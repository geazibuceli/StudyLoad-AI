import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { analyzeSchedule, simulateRebalance } from "../src/domain/analyzer.js";
import { createAppServer } from "../src/server.js";
import {
  createFeatureSchedule,
  createLightSchedule,
  createOverloadedSchedule,
} from "./fixtures.js";

const LEAP_WEEK_DATES = [
  "2028-02-27",
  "2028-02-28",
  "2028-02-29",
  "2028-03-01",
  "2028-03-02",
  "2028-03-03",
  "2028-03-04",
];

function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
}

describe("interactive planner domain contracts", () => {
  test("supports an empty planner after the user clears local data", () => {
    const result = analyzeSchedule({
      tasks: [],
      weeklyAvailableHours: 21,
      referenceDate: "2028-02-27",
    });

    assert.equal(result.features.pendingTaskCount, 0);
    assert.equal(result.features.completedTaskCount, 0);
    assert.equal(result.features.remainingHours, 0);
    assert.equal(result.features.loadRatio, 0);
    assert.deepEqual(
      result.dailyLoad.map((day) => day.date),
      LEAP_WEEK_DATES,
    );
    assert.ok(
      result.dailyLoad.every(
        (day) => day.plannedHours === 0 && day.taskCount === 0 && day.taskIds.length === 0,
      ),
    );
    assert.equal(result.metadata.referenceDate, "2028-02-27");
    assert.equal(result.recommendations[0].id, "maintain-sustainable-plan");
  });

  test("keeps the seven-day chart calendar-safe across a leap-day boundary", () => {
    const schedule = createLightSchedule();
    schedule.referenceDate = "2028-02-27";
    schedule.tasks[0].deadline = "2028-03-04";

    const result = analyzeSchedule(schedule);

    assert.deepEqual(
      result.dailyLoad.map((day) => day.date),
      LEAP_WEEK_DATES,
    );
    assert.ok(result.dailyLoad.every((day) => day.taskIds.includes("light-reading")));
  });

  test("returns predictable zero deltas for a no-op simulation", () => {
    const schedule = createLightSchedule();
    const simulation = simulateRebalance(schedule);

    assert.deepEqual(simulation.simulated.features, simulation.baseline.features);
    assert.deepEqual(simulation.simulated.dailyLoad, simulation.baseline.dailyLoad);
    assert.deepEqual(simulation.simulated.risk, simulation.baseline.risk);
    assert.deepEqual(simulation.comparison, {
      riskScoreDelta: 0,
      highRiskProbabilityDelta: 0,
      peakDailyHoursDelta: 0,
      loadRatioDelta: 0,
      levelChanged: false,
      improved: false,
    });
    assert.deepEqual(simulation.appliedAdjustments.taskUpdates, []);
    assert.deepEqual(simulation.appliedAdjustments.removeTaskIds, []);
    assert.equal(simulation.appliedAdjustments.weeklyAvailableHours, schedule.weeklyAvailableHours);
  });

  test("applies partial edits, removals, and capacity changes without altering source state", () => {
    const schedule = createFeatureSchedule();
    const snapshot = structuredClone(schedule);
    const simulation = simulateRebalance({
      ...schedule,
      adjustments: {
        taskUpdates: [{ id: "due-today", progress: 100 }],
        removeTaskIds: ["overdue-assignment", "overdue-assignment"],
        weeklyAvailableHours: 30,
      },
    });

    assert.deepEqual(schedule, snapshot);
    assert.equal(simulation.baseline.features.pendingTaskCount, 4);
    assert.equal(simulation.simulated.features.pendingTaskCount, 2);
    assert.equal(simulation.simulated.features.completedTaskCount, 2);
    assert.equal(simulation.simulated.features.overdueTaskCount, 0);
    assert.equal(simulation.simulated.features.weeklyAvailableHours, 30);
    assert.ok(
      simulation.simulated.dailyLoad.every(
        (day) => !day.taskIds.includes("due-today") && !day.taskIds.includes("overdue-assignment"),
      ),
    );
    assert.deepEqual(simulation.appliedAdjustments.removeTaskIds, ["overdue-assignment"]);
    assert.equal(simulation.appliedAdjustments.taskUpdates[0].id, "due-today");
    assert.equal(simulation.appliedAdjustments.taskUpdates[0].progress, 100);
    assert.equal(simulation.appliedAdjustments.taskUpdates[0].title, "Present the class seminar");
    assert.ok(simulation.comparison.loadRatioDelta < 0);
  });

  test("rejects ambiguous simulation edits before an interactive client applies them", () => {
    const schedule = createLightSchedule();
    const taskId = schedule.tasks[0].id;
    const invalidAdjustments = [
      {
        adjustments: { taskUpdates: [{ id: "missing-task", progress: 50 }] },
        message: /unknown task/i,
      },
      {
        adjustments: {
          taskUpdates: [
            { id: taskId, progress: 25 },
            { id: taskId, progress: 75 },
          ],
        },
        message: /multiple updates/i,
      },
      {
        adjustments: {
          taskUpdates: [{ id: taskId, progress: 50 }],
          removeTaskIds: [taskId],
        },
        message: /updated and removed/i,
      },
    ];

    for (const { adjustments, message } of invalidAdjustments) {
      assert.throws(
        () => simulateRebalance({ ...schedule, adjustments }),
        (error) => error instanceof RangeError && message.test(error.message),
      );
    }
  });
});

describe("interactive planner API workflows", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createAppServer();
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (!server) return;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test("round-trips a dated demo payload into an analysis", async () => {
    const demoResponse = await fetch(`${baseUrl}/api/demo?referenceDate=2028-02-27`);
    const demo = await demoResponse.json();

    assert.equal(demoResponse.status, 200);
    assert.equal(demo.referenceDate, "2028-02-27");
    assert.equal(demo.demoMode, true);
    assert.ok(demo.tasks.length > 0);
    assert.equal(new Set(demo.tasks.map((task) => task.id)).size, demo.tasks.length);

    const analysisResponse = await postJson(baseUrl, "/api/analyze", demo);
    const analysis = await analysisResponse.json();

    assert.equal(analysisResponse.status, 200);
    assert.equal(analysis.metadata.referenceDate, demo.referenceDate);
    assert.equal(analysis.features.pendingTaskCount, demo.tasks.length);
    assert.deepEqual(
      analysis.dailyLoad.map((day) => day.date),
      LEAP_WEEK_DATES,
    );
  });

  test("isolates concurrent what-if responses used by interactive comparisons", async () => {
    const schedule = createOverloadedSchedule();
    const firstTask = schedule.tasks[0];
    const secondTask = schedule.tasks[1];

    const [completionResponse, removalResponse] = await Promise.all([
      postJson(baseUrl, "/api/simulate", {
        ...schedule,
        adjustments: { taskUpdates: [{ id: firstTask.id, progress: 100 }] },
      }),
      postJson(baseUrl, "/api/simulate", {
        ...schedule,
        adjustments: { removeTaskIds: [secondTask.id] },
      }),
    ]);
    const [completion, removal] = await Promise.all([
      completionResponse.json(),
      removalResponse.json(),
    ]);

    assert.equal(completionResponse.status, 200);
    assert.equal(removalResponse.status, 200);
    assert.deepEqual(completion.appliedAdjustments.removeTaskIds, []);
    assert.equal(completion.appliedAdjustments.taskUpdates[0].id, firstTask.id);
    assert.deepEqual(removal.appliedAdjustments.taskUpdates, []);
    assert.deepEqual(removal.appliedAdjustments.removeTaskIds, [secondTask.id]);
    assert.equal(
      completion.simulated.features.pendingTaskCount,
      completion.baseline.features.pendingTaskCount - 1,
    );
    assert.equal(
      removal.simulated.features.pendingTaskCount,
      removal.baseline.features.pendingTaskCount - 1,
    );
  });

  test("accepts the empty schedule produced by the clear-data interaction", async () => {
    const response = await postJson(baseUrl, "/api/analyze", {
      tasks: [],
      weeklyAvailableHours: 18,
      referenceDate: "2028-02-27",
    });
    const analysis = await response.json();

    assert.equal(response.status, 200);
    assert.equal(analysis.features.pendingTaskCount, 0);
    assert.ok(analysis.dailyLoad.every((day) => day.plannedHours === 0));
  });
});
