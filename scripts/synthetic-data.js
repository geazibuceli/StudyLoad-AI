import { MODEL_FEATURE_NAMES, RISK_LEVELS } from "../src/domain/model-schema.js";

export const DEFAULT_SYNTHETIC_SEED = 42;
export const DEFAULT_SAMPLE_COUNT = 3_600;

export function createSeededRandom(seed = DEFAULT_SYNTHETIC_SEED) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomBetween(random, minimum, maximum) {
  return minimum + ((maximum - minimum) * random());
}

function randomInteger(random, minimum, maximum) {
  return Math.floor(randomBetween(random, minimum, maximum + 1));
}

function binomial(random, trials, probability) {
  let successes = 0;
  for (let index = 0; index < trials; index += 1) {
    if (random() < probability) {
      successes += 1;
    }
  }
  return successes;
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

function generateFeatureRow(random) {
  const pendingTaskCount = randomInteger(random, 0, 20);
  const weeklyAvailableHours = round(randomBetween(random, 6, 46), 2);

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

  const averageProgress = round(randomBetween(random, 0, 88), 2);
  const overdueTaskCount = binomial(
    random,
    pendingTaskCount,
    randomBetween(random, 0, 0.3),
  );
  const nonOverdueCount = pendingTaskCount - overdueTaskCount;
  const dueWithin7DaysCount = binomial(
    random,
    nonOverdueCount,
    randomBetween(random, 0.08, 0.72),
  );
  const examWithin14DaysCount = binomial(
    random,
    nonOverdueCount,
    randomBetween(random, 0.02, 0.28),
  );
  const highPriorityTaskCount = binomial(
    random,
    pendingTaskCount,
    randomBetween(random, 0.1, 0.58),
  );
  const deadlineCluster3Days = Math.min(
    pendingTaskCount,
    dueWithin7DaysCount + overdueTaskCount,
    randomInteger(random, 0, Math.max(1, dueWithin7DaysCount + overdueTaskCount)),
  );
  const baseRemainingHours = pendingTaskCount * randomBetween(random, 1.2, 7.2);
  const progressAdjustment = 1 - (averageProgress / 160);
  const remainingHours = round(baseRemainingHours * progressAdjustment, 2);
  const dueWithin7DaysHours = round(Math.min(
    remainingHours,
    dueWithin7DaysCount * randomBetween(random, 1.2, 8),
  ), 2);
  const overdueHours = Math.min(
    Math.max(0, remainingHours - dueWithin7DaysHours),
    overdueTaskCount * randomBetween(random, 1, 7),
  );
  const pacedFutureHours = Math.max(
    0,
    remainingHours - dueWithin7DaysHours - overdueHours,
  ) * randomBetween(random, 0.05, 0.3);
  const loadRatio = round(
    (dueWithin7DaysHours + overdueHours + pacedFutureHours)
      / weeklyAvailableHours,
  );
  const nearestDeadlineDays = overdueTaskCount > 0
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
  const score = (
    (26 * clamp(features.loadRatio, 0, 2.5))
    + (4.8 * features.overdueTaskCount)
    + (2.2 * features.dueWithin7DaysCount)
    + (3.2 * features.examWithin14DaysCount)
    + (3 * Math.max(0, features.deadlineCluster3Days - 1))
    + (1.4 * features.highPriorityTaskCount)
    + (0.06 * features.remainingHours)
    - (0.11 * features.averageProgress)
    - (0.3 * Math.min(features.nearestDeadlineDays, 14))
    + (gaussianNoise(random) * 4.5)
  );

  return score;
}

function labelForScore(score) {
  if (score < 20) {
    return "low";
  }
  if (score < 52) {
    return "moderate";
  }
  return "high";
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
  const quotas = Object.fromEntries(RISK_LEVELS.map((label, index) => [
    label,
    baseQuota + (index < sampleCount % RISK_LEVELS.length ? 1 : 0),
  ]));
  const classCounts = Object.fromEntries(RISK_LEVELS.map((label) => [label, 0]));
  const records = [];
  let attempts = 0;
  const maximumAttempts = sampleCount * 100;

  while (records.length < sampleCount && attempts < maximumAttempts) {
    attempts += 1;
    const features = generateFeatureRow(random);
    const latentScore = syntheticPressureScore(features, random);
    const label = labelForScore(latentScore);

    if (classCounts[label] >= quotas[label]) {
      continue;
    }

    records.push(Object.freeze({
      features: Object.freeze(features),
      label,
      latentScore: round(latentScore),
    }));
    classCounts[label] += 1;
  }

  if (records.length !== sampleCount) {
    throw new Error("Unable to generate the requested balanced synthetic dataset.");
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
      low: "latent score below 20",
      moderate: "latent score from 20 up to, but not including, 52",
      high: "latent score of 52 or higher",
      note: "The latent score combines academic workload features with deterministic seeded noise. It is a demonstration label, not a health outcome.",
    }),
  });
}
