import assert from "node:assert/strict";
import {
  analyzeSchedule,
  NON_DIAGNOSTIC_DISCLAIMER,
  simulateRebalance,
} from "../src/domain/analyzer.js";

const referenceDate = "2026-08-24";

function busyTask(index) {
  return {
    id: `task-${index}`,
    title: `Academic task ${index}`,
    subject: index % 2 === 0 ? "Algorithms" : "Research Methods",
    type: index < 2 ? "exam" : "project",
    deadline: `2026-08-${String(24 + (index % 3)).padStart(2, "0")}`,
    estimatedHours: 12,
    progress: 0,
    priority: "high",
    flexible: index >= 2,
  };
}

const lowLoadInput = {
  tasks: [],
  weeklyAvailableHours: 20,
  referenceDate,
};
const lowLoad = analyzeSchedule(lowLoadInput);
assert.equal(lowLoad.risk.level, "low");
assert.equal(lowLoad.risk.score, 0);
assert.equal(lowLoad.dailyLoad.length, 7);
assert.equal(lowLoad.features.pendingTaskCount, 0);
assert.match(lowLoad.disclaimer, /does not diagnose/i);

const busyTasks = Array.from({ length: 6 }, (_, index) => busyTask(index));
const highLoadInput = {
  tasks: busyTasks,
  weeklyAvailableHours: 8,
  referenceDate,
};
const highLoad = analyzeSchedule(highLoadInput);
assert.equal(highLoad.risk.level, "high");
assert.ok(highLoad.risk.score >= 80);
assert.equal(highLoad.features.deadlineCluster3Days, 6);
assert.ok(highLoad.explanations.length >= 1);
assert.ok(highLoad.explanations.some((item) => item.impact > 0));
assert.ok(highLoad.recommendations.every((item) => item.trigger.feature));

const probabilityTotal = Object.values(highLoad.risk.probabilities)
  .reduce((total, value) => total + value, 0);
assert.ok(Math.abs(probabilityTotal - 1) < 0.001);

assert.deepEqual(analyzeSchedule(highLoadInput), highLoad);
assert.equal(busyTasks[0].progress, 0, "Analysis must not mutate input tasks.");

const simulation = simulateRebalance({
  ...highLoadInput,
  adjustments: {
    taskUpdates: [{ id: "task-5", progress: 100 }],
    removeTaskIds: ["task-0", "task-1", "task-2", "task-3", "task-4"],
    weeklyAvailableHours: 20,
  },
});
assert.equal(simulation.baseline.risk.level, "high");
assert.equal(simulation.simulated.risk.level, "low");
assert.ok(simulation.comparison.riskScoreDelta < 0);
assert.equal(simulation.comparison.improved, true);
assert.equal(simulation.appliedAdjustments.weeklyAvailableHours, 20);
assert.equal(simulation.disclaimer, NON_DIAGNOSTIC_DISCLAIMER);

assert.throws(
  () => analyzeSchedule({
    tasks: [{ ...busyTask(0), deadline: "2026-02-30" }],
    weeklyAvailableHours: 10,
    referenceDate,
  }),
  /valid calendar date/i,
);

console.log(JSON.stringify({
  status: "ok",
  lowLoadRisk: lowLoad.risk,
  highLoadRisk: highLoad.risk,
  simulatedRisk: simulation.simulated.risk,
  model: highLoad.metadata.model,
}, null, 2));
