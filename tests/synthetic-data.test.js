import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { generateSyntheticDataset } from "../scripts/synthetic-data.js";

describe("generateSyntheticDataset", () => {
  test("generates coherent risk profiles across low, moderate, and high labels", () => {
    const dataset = generateSyntheticDataset({ sampleCount: 15 });

    const lowRecords = dataset.records.filter((record) => record.label === "low");
    const moderateRecords = dataset.records.filter((record) => record.label === "moderate");
    const highRecords = dataset.records.filter((record) => record.label === "high");

    assert.equal(lowRecords.length, 5);
    assert.equal(moderateRecords.length, 5);
    assert.equal(highRecords.length, 5);

    for (const record of lowRecords) {
      assert.ok(record.features.pendingTaskCount <= 8);
      assert.ok(record.features.weeklyAvailableHours >= 18);
      assert.ok(record.features.loadRatio < 1.1);
    }

    for (const record of moderateRecords) {
      assert.ok(record.features.pendingTaskCount >= 4 && record.features.pendingTaskCount <= 15);
      assert.ok(
        record.features.weeklyAvailableHours >= 10 && record.features.weeklyAvailableHours <= 36,
      );
      assert.ok(record.features.loadRatio >= 0.45 && record.features.loadRatio <= 1.5);
    }

    for (const record of highRecords) {
      assert.ok(record.features.pendingTaskCount >= 8);
      assert.ok(record.features.weeklyAvailableHours <= 30);
      assert.ok(record.features.loadRatio >= 1.1 || record.features.overdueTaskCount > 0);
    }
  });
});
