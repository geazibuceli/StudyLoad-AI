import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { createAppServer } from "../src/server.js";
import { createLightSchedule, createOverloadedSchedule } from "./fixtures.js";

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

async function postJson(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("application server", () => {
  test("serves the static application with security headers", async () => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/i);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(body, /<!doctype html>/i);
  });

  test("reports service health as JSON", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/i);
    assert.equal(body.status, "ok");
    assert.match(response.headers.get("x-request-id") ?? "", /.+/);
  });

  test("serves the planner UX controls needed for empty-state recovery", async () => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /id="task-search"/);
    assert.match(body, /id="task-empty"/);
    assert.match(body, /id="clear-filters-button"/);
    assert.match(body, /id="clear-data-button"/);
    assert.match(body, /id="empty-clear-button"/);
  });

  test("analyzes and simulates valid schedules through the API", async () => {
    const analysisResponse = await postJson("/api/analyze", createLightSchedule());
    const analysis = await analysisResponse.json();
    assert.equal(analysisResponse.status, 200);
    assert.ok(analysis.features);
    assert.ok(analysis.risk);

    const overloaded = createOverloadedSchedule();
    const simulationResponse = await postJson("/api/simulate", {
      ...overloaded,
      adjustments: {
        weeklyAvailableHours: 24,
        taskUpdates: [{ id: overloaded.tasks[0].id, progress: 75 }],
      },
    });
    const simulation = await simulationResponse.json();
    assert.equal(simulationResponse.status, 200);
    assert.ok(simulation.baseline);
    assert.ok(simulation.simulated);
    assert.ok(simulation.comparison);
  });

  test("returns client errors as JSON and does not expose internals", async () => {
    const invalidJsonResponse = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    });
    const invalidJson = await invalidJsonResponse.json();
    assert.equal(invalidJsonResponse.status, 400);
    assert.match(invalidJsonResponse.headers.get("x-request-id") ?? "", /.+/);
    assert.equal(typeof invalidJson.error, "string");
    assert.ok(invalidJson.error.length > 0);
    assert.equal("stack" in invalidJson, false);

    const invalidScheduleResponse = await postJson("/api/analyze", {
      tasks: [],
      weeklyAvailableHours: 0,
      referenceDate: "2026-03-02",
    });
    assert.equal(invalidScheduleResponse.status, 400);
    assert.match(invalidScheduleResponse.headers.get("x-request-id") ?? "", /.+/);

    const invalidTaskResponse = await postJson("/api/analyze", {
      ...createLightSchedule(),
      tasks: [
        {
          ...createLightSchedule().tasks[0],
          progress: 101,
        },
      ],
    });
    const invalidTask = await invalidTaskResponse.json();
    assert.equal(invalidTaskResponse.status, 400);
    assert.match(invalidTaskResponse.headers.get("x-request-id") ?? "", /.+/);
    assert.match(invalidTask.error, /progress/i);

    const unsupportedTypeResponse = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });
    const unsupportedType = await unsupportedTypeResponse.json();
    assert.equal(unsupportedTypeResponse.status, 415);
    assert.match(unsupportedTypeResponse.headers.get("x-request-id") ?? "", /.+/);
    assert.match(unsupportedType.error, /application\/json/i);
  });

  test("returns JSON for missing API routes and static files", async () => {
    for (const path of ["/api/missing", "/missing-file.txt"]) {
      const response = await fetch(`${baseUrl}${path}`);
      const body = await response.json();
      assert.equal(response.status, 404);
      assert.equal(typeof body.error, "string");
      assert.match(response.headers.get("x-request-id") ?? "", /.+/);
    }
  });
});
