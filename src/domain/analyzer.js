import { explainPrediction } from "./explanations.js";
import { buildDailyLoad, extractFeatures } from "./features.js";
import { getModelMetadata, predictRisk } from "./model.js";
import { buildRecommendations } from "./recommendations.js";
import { normalizeScheduleInput, normalizeSimulationAdjustments } from "./validation.js";

export const NON_DIAGNOSTIC_DISCLAIMER =
  "StudyBalance AI estimates academic workload patterns for organizational support only. It does not diagnose stress, burnout, depression, or any health condition, and it does not replace qualified professional support.";

function freezeAnalysis(analysis) {
  return Object.freeze({
    ...analysis,
    dailyLoad: Object.freeze(analysis.dailyLoad),
    explanations: Object.freeze(analysis.explanations),
    recommendations: Object.freeze(analysis.recommendations),
  });
}

export function analyzeSchedule(payload) {
  const normalized = normalizeScheduleInput(payload);
  const features = extractFeatures(
    normalized.tasks,
    normalized.weeklyAvailableHours,
    normalized.referenceDate,
  );
  const dailyLoad = buildDailyLoad(
    normalized.tasks,
    normalized.weeklyAvailableHours,
    normalized.referenceDate,
  );
  const risk = predictRisk(features);
  const explanations = explainPrediction(features, risk);
  const recommendations = buildRecommendations(
    normalized.tasks,
    features,
    risk,
    normalized.referenceDate,
  );

  return freezeAnalysis({
    features,
    dailyLoad,
    risk,
    explanations,
    recommendations,
    disclaimer: NON_DIAGNOSTIC_DISCLAIMER,
    metadata: Object.freeze({
      referenceDate: normalized.referenceDateIso,
      forecastDays: 7,
      model: getModelMetadata(),
    }),
  });
}

function applyAdjustments(tasks, adjustments) {
  const updatesById = new Map(adjustments.taskUpdates.map((task) => [task.id, task]));
  const removedIds = new Set(adjustments.removeTaskIds);

  return tasks
    .filter((task) => !removedIds.has(task.id))
    .map((task) => updatesById.get(task.id) ?? task);
}

function maximumDailyHours(analysis) {
  return Math.max(0, ...analysis.dailyLoad.map((day) => day.plannedHours));
}

function round(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function simulateRebalance(payload) {
  const normalized = normalizeScheduleInput(payload);
  const adjustments = normalizeSimulationAdjustments(payload.adjustments, normalized.tasks);
  const baseline = analyzeSchedule({
    tasks: normalized.tasks,
    weeklyAvailableHours: normalized.weeklyAvailableHours,
    referenceDate: normalized.referenceDateIso,
  });
  const simulatedTasks = applyAdjustments(normalized.tasks, adjustments);
  const simulatedWeeklyHours = adjustments.weeklyAvailableHours ?? normalized.weeklyAvailableHours;
  const simulated = analyzeSchedule({
    tasks: simulatedTasks,
    weeklyAvailableHours: simulatedWeeklyHours,
    referenceDate: normalized.referenceDateIso,
  });

  const comparison = Object.freeze({
    riskScoreDelta: simulated.risk.score - baseline.risk.score,
    highRiskProbabilityDelta: round(
      simulated.risk.probabilities.high - baseline.risk.probabilities.high,
    ),
    peakDailyHoursDelta: round(maximumDailyHours(simulated) - maximumDailyHours(baseline), 2),
    loadRatioDelta: round(simulated.features.loadRatio - baseline.features.loadRatio),
    levelChanged: simulated.risk.level !== baseline.risk.level,
    improved: simulated.risk.score < baseline.risk.score,
  });

  return Object.freeze({
    baseline,
    simulated,
    comparison,
    appliedAdjustments: Object.freeze({
      taskUpdates: Object.freeze(adjustments.taskUpdates.map((task) => ({ ...task }))),
      removeTaskIds: adjustments.removeTaskIds,
      weeklyAvailableHours: simulatedWeeklyHours,
    }),
    disclaimer: NON_DIAGNOSTIC_DISCLAIMER,
  });
}
