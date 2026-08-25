import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { analyzeSchedule, simulateRebalance } from "../src/domain/analyzer.js";
import {
  REFERENCE_DATE,
  createFeatureSchedule,
  createLightSchedule,
  createOverloadedSchedule,
  createTask
} from "./fixtures.js";

const RISK_LEVELS = new Set(["low", "moderate", "high"]);

function assertProbability(value, label) {
  assert.equal(Number.isFinite(value), true, `${label} must be finite`);
  assert.ok(value >= 0 && value <= 1, `${label} must be between 0 and 1`);
}

function assertAnalysisShape(result) {
  assert.ok(result && typeof result === "object");
  assert.ok(result.features && typeof result.features === "object");
  assert.ok(Array.isArray(result.dailyLoad));
  assert.equal(result.dailyLoad.length, 7);

  assert.ok(result.risk && typeof result.risk === "object");
  assert.ok(RISK_LEVELS.has(result.risk.level));
  assert.ok(Number.isFinite(result.risk.score));
  assert.ok(result.risk.score >= 0 && result.risk.score <= 100);
  assertProbability(result.risk.confidence, "risk confidence");

  for (const level of RISK_LEVELS) {
    assertProbability(result.risk.probabilities[level], `${level} probability`);
  }

  const probabilityTotal = Object.values(result.risk.probabilities).reduce(
    (sum, probability) => sum + probability,
    0
  );
  assert.ok(Math.abs(probabilityTotal - 1) < 0.02);

  assert.ok(Array.isArray(result.explanations));
  assert.ok(Array.isArray(result.recommendations));
  assert.equal(typeof result.disclaimer, "string");
  assert.ok(result.disclaimer.trim().length > 20);
  assert.ok(result.metadata && typeof result.metadata === "object");
}

function readableText(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return Object.values(value).map(readableText).filter(Boolean).join(" ");
}

describe("analyzeSchedule", () => {
  test("extracts workload features across fixed date boundaries", () => {
    const schedule = createFeatureSchedule();
    const snapshot = structuredClone(schedule);
    const result = analyzeSchedule(schedule);

    assertAnalysisShape(result);
    assert.deepEqual(schedule, snapshot, "analysis must not mutate its input");

    assert.equal(result.features.pendingTaskCount, 4);
    assert.equal(result.features.completedTaskCount, 1);
    assert.equal(result.features.overdueTaskCount, 1);
    assert.ok(result.features.dueWithin7DaysCount >= 2);
    assert.ok(result.features.examWithin14DaysCount >= 1);
    assert.ok(result.features.remainingHours > 0);
    assert.equal(result.features.weeklyAvailableHours, schedule.weeklyAvailableHours);
    assert.ok(result.features.loadRatio > 0);
    assert.ok(result.features.averageProgress >= 0 && result.features.averageProgress <= 100);

    assert.equal(result.dailyLoad[0].date, REFERENCE_DATE);
    assert.equal(result.dailyLoad.at(-1).date, "2026-03-08");
    for (const day of result.dailyLoad) {
      assert.match(day.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(Number.isFinite(day.plannedHours) && day.plannedHours >= 0);
      assert.ok(Number.isFinite(day.availableHours) && day.availableHours >= 0);
      assert.ok(Number.isFinite(day.loadRatio) && day.loadRatio >= 0);
      assert.ok(Array.isArray(day.taskIds));
      assert.equal(day.taskCount, day.taskIds.length);
    }
  });

  test("keeps risk values bounded and raises overload risk for concentrated demand", () => {
    const light = analyzeSchedule(createLightSchedule());
    const overloaded = analyzeSchedule(createOverloadedSchedule());

    assertAnalysisShape(light);
    assertAnalysisShape(overloaded);
    assert.ok(overloaded.features.loadRatio > light.features.loadRatio);
    assert.ok(overloaded.risk.score > light.risk.score);
    assert.ok(overloaded.risk.probabilities.high >= light.risk.probabilities.high);
  });

  test("provides readable explanations and actionable recommendations", () => {
    const result = analyzeSchedule(createOverloadedSchedule());

    assert.ok(result.explanations.length > 0);
    for (const explanation of result.explanations) {
      assert.ok(readableText(explanation).length > 10);
    }

    assert.ok(result.recommendations.length > 0);
    for (const recommendation of result.recommendations) {
      assert.equal(typeof recommendation.title, "string");
      assert.ok(recommendation.title.trim().length > 0);
      assert.equal(typeof recommendation.action, "string");
      assert.ok(recommendation.action.trim().length > 0);
      assert.ok(["low", "medium", "high"].includes(recommendation.priority));
      assert.ok(Array.isArray(recommendation.relatedTaskIds));
    }
  });

  test("rejects invalid schedules and invalid task boundaries", () => {
    const valid = createLightSchedule();
    const invalidInputs = [
      { ...valid, tasks: "not-a-list" },
      { ...valid, weeklyAvailableHours: 0 },
      { ...valid, referenceDate: "not-a-date" },
      { ...valid, tasks: [createTask({ progress: 101 })] },
      { ...valid, tasks: [createTask({ estimatedHours: -1 })] },
      { ...valid, tasks: [createTask({ deadline: "2026-02-30" })] }
    ];

    for (const input of invalidInputs) {
      assert.throws(
        () => analyzeSchedule(input),
        (error) => error instanceof TypeError || error instanceof RangeError
      );
    }
  });
});

describe("simulateRebalance", () => {
  test("compares a lighter plan without mutating the original schedule", () => {
    const schedule = createOverloadedSchedule();
    const snapshot = structuredClone(schedule);
    const simulation = simulateRebalance({
      ...schedule,
      adjustments: {
        weeklyAvailableHours: 28,
        taskUpdates: schedule.tasks.map((task) => ({ id: task.id, progress: 80 }))
      }
    });

    assert.deepEqual(schedule, snapshot);
    assertAnalysisShape(simulation.baseline);
    assertAnalysisShape(simulation.simulated);
    assert.ok(simulation.comparison && typeof simulation.comparison === "object");
    assert.ok(simulation.simulated.features.loadRatio < simulation.baseline.features.loadRatio);
    assert.ok(simulation.simulated.risk.score <= simulation.baseline.risk.score);
    assert.ok(simulation.comparison.riskScoreDelta <= 0);
    assert.equal(simulation.comparison.improved, true);
    assert.ok(simulation.appliedAdjustments && typeof simulation.appliedAdjustments === "object");
    assert.equal(typeof simulation.disclaimer, "string");
  });
});
