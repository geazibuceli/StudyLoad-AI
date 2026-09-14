import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import modelArtifact from "../models/study-balance-model.js";
import { analyzeSchedule } from "../src/domain/analyzer.js";

function readDocument(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function numericTableRow(document, label) {
  const line = document.split("\n").find((row) => row.startsWith(`| ${label} `));
  assert.ok(line, `Missing documented table row: ${label}`);
  return line
    .split("|")
    .slice(2, -1)
    .map((cell) => Number(cell.trim().replaceAll(",", "")));
}

function assertDocumentedFields(expected, actual, path = "response") {
  if (expected !== null && typeof expected === "object") {
    assert.ok(actual !== null && typeof actual === "object", `Missing object: ${path}`);
    if (Array.isArray(expected)) assert.ok(Array.isArray(actual), `Expected array: ${path}`);
    for (const [key, value] of Object.entries(expected)) {
      assert.ok(Object.hasOwn(actual, key), `Missing documented field: ${path}.${key}`);
      assertDocumentedFields(value, actual[key], `${path}.${key}`);
    }
    return;
  }
  assert.equal(actual, expected, `Outdated documented value: ${path}`);
}

describe("model documentation", () => {
  test("reports the saved artifact's accuracy, macro F1, and confusion matrix", () => {
    const card = readDocument("../MODEL_CARD.md");
    const { training } = modelArtifact;

    assert.deepEqual(numericTableRow(card, "Accuracy"), [
      training.trainingAccuracy,
      training.validationAccuracy,
    ]);
    assert.deepEqual(numericTableRow(card, "Macro F1"), [
      training.trainingMacroF1,
      training.validationMacroF1,
    ]);
    assert.deepEqual(
      ["Low", "Moderate", "High"].map((label) => numericTableRow(card, label)),
      training.validationConfusionMatrix,
    );
  });

  test("reports class split counts consistent with the saved validation results", () => {
    const card = readDocument("../DATA_CARD.md");
    const { training, classNames } = modelArtifact;
    const totals = classNames.map((label) => training.classCounts[label]);
    const validation = training.validationConfusionMatrix.map((row) =>
      row.reduce((sum, count) => sum + count, 0),
    );

    assert.deepEqual(numericTableRow(card, "Full generated set"), [
      training.sampleCount,
      ...totals,
    ]);
    assert.deepEqual(numericTableRow(card, "Validation"), [
      training.validationSampleCount,
      ...validation,
    ]);
    assert.deepEqual(numericTableRow(card, "Training"), [
      training.trainingSampleCount,
      ...totals.map((total, index) => total - validation[index]),
    ]);
  });

  test("reproduces every displayed field in the abbreviated analysis API example", () => {
    const document = readDocument("../docs/API.md");
    const requestBlock = document.split("Request body:")[1]?.match(/```json\s*([\s\S]+?)```/);
    const responseBlock = document
      .split("### Analysis response")[1]
      ?.match(/```jsonc\s*([\s\S]+?)```/);
    assert.ok(requestBlock, "Missing documented analysis request");
    assert.ok(responseBlock, "Missing documented analysis response");

    const request = JSON.parse(requestBlock[1]);
    const response = JSON.parse(
      responseBlock[1].replace(/^\s*\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1"),
    );
    assertDocumentedFields(response, analyzeSchedule(request));
  });
});
