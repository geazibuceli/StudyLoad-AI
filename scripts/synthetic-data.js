import { MODEL_FEATURE_NAMES, RISK_LEVELS } from "../src/domain/model-schema.js";

export const DEFAULT_SYNTHETIC_SEED = 42;
export const DEFAULT_SAMPLE_COUNT = 3_600;

export function createSeededRandom(seed = DEFAULT_SYNTHETIC_SEED) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomBetween(random, minimum, maximum) {
  return minimum + (maximum - minimum) * random();
}

function randomInteger(random, minimum, maximum) {
  return Math.floor(randomBetween(random, minimum, maximum + 1));
}

function gaussianNoise(random) {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

const RISK_PROFILE_CONFIG = {
  low: {
    pendingTaskCount: [0, 6],
    overdueTaskCount: [0, 1],
    dueWithin7DaysCount: [0, 2],
    examWithin14DaysCount: [0, 1],
    highPriorityTaskCount: [0, 2],
    weeklyAvailableHours: [18, 46],
    averageProgress: [70, 100],
    remainingHoursPerTask: [1.4, 4.5],
    dueWithin7DaysHoursPerTask: [1.2, 3.2],
    overdueHoursPerTask: [0.8, 2.2],
    futureHoursRatio: [0.02, 0.15],
    loadRatioMinimum: 0.1,
    loadRatioMaximum: 0.95,
  },
  moderate: {
    pendingTaskCount: [4, 12],
    overdueTaskCount: [0, 3],
    dueWithin7DaysCount: [1, 6],
    examWithin14DaysCount: [0, 3],
    highPriorityTaskCount: [1, 4],
    weeklyAvailableHours: [10, 34],
    averageProgress: [35, 80],
    remainingHoursPerTask: [1.8, 5.5],
    dueWithin7DaysHoursPerTask: [1.4, 4.5],
    overdueHoursPerTask: [1.4, 4.4],
    futureHoursRatio: [0.08, 0.22],
    loadRatioMinimum: 0.45,
    loadRatioMaximum: 1.5,
  },
  high: {
    pendingTaskCount: [8, 20],
    overdueTaskCount: [1, 6],
    dueWithin7DaysCount: [4, 12],
    examWithin14DaysCount: [1, 6],
    highPriorityTaskCount: [2, 8],
    weeklyAvailableHours: [6, 28],
    averageProgress: [0, 55],
    remainingHoursPerTask: [2.4, 7.2],
    dueWithin7DaysHoursPerTask: [2, 6.5],
    overdueHoursPerTask: [2.4, 6.8],
    futureHoursRatio: [0.12, 0.35],
    loadRatioMinimum: 1.1,
    loadRatioMaximum: 2.5,
  },
};

function generateFeatureRow(random, targetLabel = "moderate") {
  const profile = RISK_PROFILE_CONFIG[targetLabel] ?? RISK_PROFILE_CONFIG.moderate;
  const pendingTaskCount = randomInteger(
    random,
    profile.pendingTaskCount[0],
    profile.pendingTaskCount[1],
  );
  const weeklyAvailableHours = round(
    randomBetween(random, profile.weeklyAvailableHours[0], profile.weeklyAvailableHours[1]),
    2,
  );

  if (pendingTaskCount === 0) {
    return {
      pendingTaskCount: 0,
      overdueTaskCount: 0,
      dueWithin7DaysCount: 0,
      examWithin14DaysCount: 0,
      remainingHours: 0,
      dueWithin7DaysHours: 0,
      weeklyAvailableHours,
      loadRatio: 0,
      deadlineCluster3Days: 0,
      highPriorityTaskCount: 0,
      nearestDeadlineDays: 30,
      averageProgress: 100,
    };
  }

  const averageProgress = round(
    randomBetween(random, profile.averageProgress[0], profile.averageProgress[1]),
    2,
  );
  const overdueTaskCount = Math.min(
    pendingTaskCount,
    randomInteger(random, profile.overdueTaskCount[0], profile.overdueTaskCount[1]),
  );
  const nonOverdueCount = Math.max(0, pendingTaskCount - overdueTaskCount);
  const dueWithin7DaysCount = Math.min(
    nonOverdueCount,
    randomInteger(random, profile.dueWithin7DaysCount[0], profile.dueWithin7DaysCount[1]),
  );
  const remainingNonurgentCount = Math.max(0, nonOverdueCount - dueWithin7DaysCount);
  const examWithin14DaysCount = Math.min(
    remainingNonurgentCount,
    randomInteger(random, profile.examWithin14DaysCount[0], profile.examWithin14DaysCount[1]),
  );
  const highPriorityTaskCount = Math.min(
    pendingTaskCount,
    randomInteger(random, profile.highPriorityTaskCount[0], profile.highPriorityTaskCount[1]),
  );
  const deadlineCluster3Days = Math.min(
    pendingTaskCount,
    dueWithin7DaysCount + overdueTaskCount,
    randomInteger(random, 0, Math.max(1, dueWithin7DaysCount + overdueTaskCount)),
  );
  const baseRemainingHours =
    pendingTaskCount *
    randomBetween(random, profile.remainingHoursPerTask[0], profile.remainingHoursPerTask[1]);
  const progressAdjustment = 1 - averageProgress / 160;
  const remainingHours = round(baseRemainingHours * progressAdjustment, 2);
  const dueWithin7DaysHours = round(
    Math.min(
      remainingHours,
      dueWithin7DaysCount *
        randomBetween(
          random,
          profile.dueWithin7DaysHoursPerTask[0],
          profile.dueWithin7DaysHoursPerTask[1],
        ),
    ),
    2,
  );
  const overdueHours = Math.min(
    Math.max(0, remainingHours - dueWithin7DaysHours),
    overdueTaskCount *
      randomBetween(random, profile.overdueHoursPerTask[0], profile.overdueHoursPerTask[1]),
  );
  const pacedFutureHours =
    Math.max(0, remainingHours - dueWithin7DaysHours - overdueHours) *
    randomBetween(random, profile.futureHoursRatio[0], profile.futureHoursRatio[1]);
  const loadRatio = Math.min(
    profile.loadRatioMaximum,
    Math.max(
      profile.loadRatioMinimum,
      round((dueWithin7DaysHours + overdueHours + pacedFutureHours) / weeklyAvailableHours),
    ),
  );
  const nearestDeadlineDays =
    overdueTaskCount > 0
      ? 0
      : dueWithin7DaysCount > 0
        ? randomInteger(random, 0, 6)
        : randomInteger(random, 7, 30);

  return {
    pendingTaskCount,
    overdueTaskCount,
    dueWithin7DaysCount,
    examWithin14DaysCount,
    remainingHours,
    dueWithin7DaysHours,
    weeklyAvailableHours,
    loadRatio,
    deadlineCluster3Days,
    highPriorityTaskCount,
    nearestDeadlineDays,
    averageProgress,
  };
}

function syntheticPressureScore(features, random) {
  const score =
    26 * clamp(features.loadRatio, 0, 2.5) +
    4.8 * features.overdueTaskCount +
    2.2 * features.dueWithin7DaysCount +
    3.2 * features.examWithin14DaysCount +
    3 * Math.max(0, features.deadlineCluster3Days - 1) +
    1.4 * features.highPriorityTaskCount +
    0.06 * features.remainingHours -
    0.11 * features.averageProgress -
    0.3 * Math.min(features.nearestDeadlineDays, 14) +
    gaussianNoise(random) * 4.5;

  return score;
}

export function generateSyntheticDataset({
  seed = DEFAULT_SYNTHETIC_SEED,
  sampleCount = DEFAULT_SAMPLE_COUNT,
} = {}) {
  if (!Number.isInteger(sampleCount) || sampleCount < RISK_LEVELS.length) {
    throw new RangeError("sampleCount must be an integer of at least three.");
  }

  const random = createSeededRandom(seed);
  const baseQuota = Math.floor(sampleCount / RISK_LEVELS.length);
  const quotas = Object.fromEntries(
    RISK_LEVELS.map((label, index) => [
      label,
      baseQuota + (index < sampleCount % RISK_LEVELS.length ? 1 : 0),
    ]),
  );

  const records = [];
  for (const label of RISK_LEVELS) {
    for (let index = 0; index < quotas[label]; index += 1) {
      const features = generateFeatureRow(random, label);
      const latentScore = syntheticPressureScore(features, random);

      records.push(
        Object.freeze({
          features: Object.freeze(features),
          label,
          latentScore: round(latentScore),
        }),
      );
    }
  }

  if (records.length !== sampleCount) {
    throw new Error("Unable to generate the requested balanced synthetic dataset.");
  }

  const classCounts = Object.fromEntries(RISK_LEVELS.map((label) => [label, 0]));
  for (const record of records) {
    classCounts[record.label] += 1;
  }

  for (const record of records) {
    for (const featureName of MODEL_FEATURE_NAMES) {
      if (!Number.isFinite(record.features[featureName])) {
        throw new Error(`Synthetic feature ${featureName} is not finite.`);
      }
    }
  }

  return Object.freeze({
    seed,
    sampleCount,
    classCounts: Object.freeze(classCounts),
    records: Object.freeze(records),
    labelRule: Object.freeze({
      low: "selected low workload generation profile",
      moderate: "selected moderate workload generation profile",
      high: "selected high workload generation profile",
      note: "Labels are assigned before feature generation using class-specific workload profiles. The latent score is auxiliary and does not assign labels. Synthetic labels are not health outcomes.",
    }),
  });
}
