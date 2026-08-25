export const RISK_LEVELS = Object.freeze(["low", "moderate", "high"]);

export const MODEL_FEATURE_NAMES = Object.freeze([
  "pendingTaskCount",
  "overdueTaskCount",
  "dueWithin7DaysCount",
  "examWithin14DaysCount",
  "remainingHours",
  "dueWithin7DaysHours",
  "weeklyAvailableHours",
  "loadRatio",
  "deadlineCluster3Days",
  "highPriorityTaskCount",
  "nearestDeadlineDays",
  "averageProgress",
]);

export const MODEL_SCHEMA_VERSION = 1;
