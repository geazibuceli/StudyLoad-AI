import { predictRisk } from "./model.js";

const SAFE_BASELINES = Object.freeze({
  pendingTaskCount: (value) => Math.min(value, 3),
  overdueTaskCount: () => 0,
  dueWithin7DaysCount: (value) => Math.min(value, 2),
  examWithin14DaysCount: (value) => Math.min(value, 1),
  remainingHours: (value, features) => Math.min(value, features.weeklyAvailableHours * 1.5),
  dueWithin7DaysHours: (value, features) => Math.min(value, features.weeklyAvailableHours * 0.7),
  weeklyAvailableHours: (value) => Math.max(value, 20),
  loadRatio: (value) => Math.min(value, 0.75),
  deadlineCluster3Days: (value) => Math.min(value, 1),
  highPriorityTaskCount: (value) => Math.min(value, 2),
  nearestDeadlineDays: (value) => Math.max(value, 7),
  averageProgress: (value) => Math.max(value, 50),
});

const FEATURE_LABELS = Object.freeze({
  pendingTaskCount: "pending task count",
  overdueTaskCount: "overdue task count",
  dueWithin7DaysCount: "tasks due within seven days",
  examWithin14DaysCount: "exams within fourteen days",
  remainingHours: "remaining workload",
  dueWithin7DaysHours: "hours due within seven days",
  weeklyAvailableHours: "weekly study availability",
  loadRatio: "demand-to-availability ratio",
  deadlineCluster3Days: "three-day deadline concentration",
  highPriorityTaskCount: "high-priority task count",
  nearestDeadlineDays: "time to the nearest deadline",
  averageProgress: "average task progress",
});

const percent = (value) => `${Math.round(value * 100)} percentage points`;

function explanationMessage(featureName, impact, currentValue) {
  const direction = impact >= 0 ? "increased" : "reduced";
  return `Against a lower-load reference for this schedule, your ${FEATURE_LABELS[featureName]} (${currentValue}) ${direction} the estimated high-load probability by about ${percent(Math.abs(impact))}.`;
}

export function explainPrediction(features, risk, limit = 3) {
  const safeReference = Object.fromEntries(
    Object.entries(features).map(([featureName, value]) => {
      const baselineFactory = SAFE_BASELINES[featureName];
      return [
        featureName,
        baselineFactory ? baselineFactory(value, features) : value,
      ];
    }),
  );
  const referenceRisk = predictRisk(safeReference);
  const candidates = Object.entries(SAFE_BASELINES).map(([
    featureName,
    baselineFactory,
  ]) => {
    const baselineValue = baselineFactory(features[featureName], features);
    const counterfactualFeatures = {
      ...safeReference,
      [featureName]: features[featureName],
    };
    const counterfactualRisk = predictRisk(counterfactualFeatures);
    const impact = (
      counterfactualRisk.probabilities.high - referenceRisk.probabilities.high
    );

    return {
      feature: featureName,
      label: FEATURE_LABELS[featureName],
      direction: impact >= 0 ? "risk-increasing" : "risk-reducing",
      impact: Math.round(impact * 10_000) / 10_000,
      impactPoints: Math.round(impact * 100),
      currentValue: features[featureName],
      baselineValue,
      currentHighProbability: risk.probabilities.high,
      referenceHighProbability: referenceRisk.probabilities.high,
      message: explanationMessage(featureName, impact, features[featureName]),
      method: "safe-reference local counterfactual",
    };
  });

  const meaningful = candidates
    .filter((candidate) => Math.abs(candidate.impact) >= 0.002)
    .sort((first, second) => Math.abs(second.impact) - Math.abs(first.impact))
    .slice(0, limit);

  if (meaningful.length > 0) {
    return meaningful;
  }

  return [{
    feature: "loadRatio",
    label: FEATURE_LABELS.loadRatio,
    direction: "neutral",
    impact: 0,
    impactPoints: 0,
    currentValue: features.loadRatio,
    baselineValue: features.loadRatio,
    currentHighProbability: risk.probabilities.high,
    referenceHighProbability: risk.probabilities.high,
    message: "No single academic workload factor materially changed the current estimate.",
    method: "safe-reference local counterfactual",
  }];
}
