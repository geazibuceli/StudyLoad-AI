import modelArtifact from "../../models/study-balance-model.js";
import {
  MODEL_FEATURE_NAMES,
  MODEL_SCHEMA_VERSION,
  RISK_LEVELS,
} from "./model-schema.js";

function round(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function softmax(logits) {
  const maximum = Math.max(...logits);
  const exponentials = logits.map((value) => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function validateArtifact(artifact) {
  if (artifact.schemaVersion !== MODEL_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported model schema version ${artifact.schemaVersion}.`,
    );
  }
  if (
    artifact.featureNames.length !== MODEL_FEATURE_NAMES.length
    || artifact.featureNames.some(
      (featureName, index) => featureName !== MODEL_FEATURE_NAMES[index],
    )
  ) {
    throw new Error("The model artifact feature schema is incompatible.");
  }
  if (
    artifact.classNames.length !== RISK_LEVELS.length
    || artifact.classNames.some(
      (className, index) => className !== RISK_LEVELS[index],
    )
  ) {
    throw new Error("The model artifact risk classes are incompatible.");
  }
}

validateArtifact(modelArtifact);

export function predictRisk(features, artifact = modelArtifact) {
  const standardizedFeatures = artifact.featureNames.map((featureName, index) => {
    const rawValue = features[featureName];
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
      throw new TypeError(`Feature ${featureName} must be a finite number.`);
    }

    const standardized = (
      (rawValue - artifact.scaler.means[index])
      / artifact.scaler.standardDeviations[index]
    );
    return Math.max(-6, Math.min(6, standardized));
  });

  const logits = artifact.weights.map((classWeights, classIndex) => (
    classWeights.reduce(
      (total, weight, featureIndex) => (
        total + (weight * standardizedFeatures[featureIndex])
      ),
      artifact.biases[classIndex],
    )
  ));
  const probabilityValues = softmax(logits);
  const probabilities = Object.fromEntries(
    artifact.classNames.map((className, index) => [
      className,
      round(probabilityValues[index]),
    ]),
  );
  const predictedIndex = probabilityValues.indexOf(Math.max(...probabilityValues));
  const score = Math.round(
    (probabilityValues[1] * 50) + (probabilityValues[2] * 100),
  );

  return Object.freeze({
    level: artifact.classNames[predictedIndex],
    score: Math.max(0, Math.min(100, score)),
    confidence: round(probabilityValues[predictedIndex]),
    probabilities: Object.freeze(probabilities),
  });
}

export function getModelMetadata() {
  return Object.freeze({
    name: modelArtifact.name,
    version: modelArtifact.version,
    modelType: modelArtifact.modelType,
    schemaVersion: modelArtifact.schemaVersion,
    trainedAt: modelArtifact.trainedAt,
    seed: modelArtifact.training.seed,
    sampleCount: modelArtifact.training.sampleCount,
    validationMacroF1: modelArtifact.training.validationMacroF1,
    syntheticTrainingData: true,
  });
}
