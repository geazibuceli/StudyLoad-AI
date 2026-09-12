import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import {
  MODEL_FEATURE_NAMES,
  MODEL_SCHEMA_VERSION,
  RISK_LEVELS,
} from "../src/domain/model-schema.js";
import {
  createSeededRandom,
  DEFAULT_SAMPLE_COUNT,
  DEFAULT_SYNTHETIC_SEED,
  generateSyntheticDataset,
} from "./synthetic-data.js";

const TRAINING_FRACTION = 0.8;
const TRAINING_ITERATIONS = 900;
const LEARNING_RATE = 0.08;
const L2_REGULARIZATION = 0.002;
const ARTIFACT_VERSION = "1.0.0";
const REPRODUCIBLE_TRAINING_DATE = "2026-08-24T00:00:00.000Z";

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const replacementIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[replacementIndex]] = [shuffled[replacementIndex], shuffled[index]];
  }
  return shuffled;
}

function vectorForRecord(record) {
  return MODEL_FEATURE_NAMES.map((featureName) => record.features[featureName]);
}

function calculateScaler(vectors) {
  const means = MODEL_FEATURE_NAMES.map(
    (_, featureIndex) =>
      vectors.reduce((total, vector) => total + vector[featureIndex], 0) / vectors.length,
  );
  const standardDeviations = MODEL_FEATURE_NAMES.map((_, featureIndex) => {
    const variance =
      vectors.reduce((total, vector) => {
        const difference = vector[featureIndex] - means[featureIndex];
        return total + difference * difference;
      }, 0) / vectors.length;
    return Math.max(Math.sqrt(variance), 1e-8);
  });

  return { means, standardDeviations };
}

function standardize(vector, scaler) {
  return vector.map(
    (value, index) => (value - scaler.means[index]) / scaler.standardDeviations[index],
  );
}

function softmax(logits) {
  const maximum = Math.max(...logits);
  const exponentials = logits.map((value) => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function trainSoftmax(samples) {
  const featureCount = MODEL_FEATURE_NAMES.length;
  const classCount = RISK_LEVELS.length;
  const weights = Array.from({ length: classCount }, () => Array(featureCount).fill(0));
  const biases = Array(classCount).fill(0);

  for (let iteration = 0; iteration < TRAINING_ITERATIONS; iteration += 1) {
    const weightGradients = Array.from({ length: classCount }, () => Array(featureCount).fill(0));
    const biasGradients = Array(classCount).fill(0);

    for (const sample of samples) {
      const logits = weights.map((classWeights, classIndex) =>
        classWeights.reduce(
          (total, weight, featureIndex) => total + weight * sample.vector[featureIndex],
          biases[classIndex],
        ),
      );
      const probabilities = softmax(logits);

      for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
        const target = sample.classIndex === classIndex ? 1 : 0;
        const error = probabilities[classIndex] - target;
        biasGradients[classIndex] += error;

        for (let featureIndex = 0; featureIndex < featureCount; featureIndex += 1) {
          weightGradients[classIndex][featureIndex] += error * sample.vector[featureIndex];
        }
      }
    }

    for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
      biases[classIndex] -= (LEARNING_RATE * biasGradients[classIndex]) / samples.length;

      for (let featureIndex = 0; featureIndex < featureCount; featureIndex += 1) {
        const regularizedGradient =
          weightGradients[classIndex][featureIndex] / samples.length +
          L2_REGULARIZATION * weights[classIndex][featureIndex];
        weights[classIndex][featureIndex] -= LEARNING_RATE * regularizedGradient;
      }
    }
  }

  return { weights, biases };
}

function predictClass(vector, weights, biases) {
  const logits = weights.map((classWeights, classIndex) =>
    classWeights.reduce(
      (total, weight, featureIndex) => total + weight * vector[featureIndex],
      biases[classIndex],
    ),
  );
  return logits.indexOf(Math.max(...logits));
}

function calculateMetrics(samples, weights, biases) {
  const confusionMatrix = Array.from({ length: RISK_LEVELS.length }, () =>
    Array(RISK_LEVELS.length).fill(0),
  );

  for (const sample of samples) {
    const predictedClass = predictClass(sample.vector, weights, biases);
    confusionMatrix[sample.classIndex][predictedClass] += 1;
  }

  const correct = confusionMatrix.reduce((total, row, index) => total + row[index], 0);
  const f1Scores = RISK_LEVELS.map((_, classIndex) => {
    const truePositive = confusionMatrix[classIndex][classIndex];
    const falsePositive = confusionMatrix.reduce(
      (total, row, rowIndex) => (rowIndex === classIndex ? total : total + row[classIndex]),
      0,
    );
    const falseNegative = confusionMatrix[classIndex].reduce(
      (total, count, columnIndex) => (columnIndex === classIndex ? total : total + count),
      0,
    );
    const precision =
      truePositive + falsePositive === 0 ? 0 : truePositive / (truePositive + falsePositive);
    const recall =
      truePositive + falseNegative === 0 ? 0 : truePositive / (truePositive + falseNegative);
    return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  });

  return {
    accuracy: correct / samples.length,
    macroF1: f1Scores.reduce((sum, value) => sum + value, 0) / f1Scores.length,
    confusionMatrix,
  };
}

function roundedNumbers(values, precision = 8) {
  const factor = 10 ** precision;
  return values.map((value) => Math.round(value * factor) / factor);
}

export function buildModelArtifact() {
  const dataset = generateSyntheticDataset({
    seed: DEFAULT_SYNTHETIC_SEED,
    sampleCount: DEFAULT_SAMPLE_COUNT,
  });
  const shuffledRecords = shuffle(dataset.records, createSeededRandom(DEFAULT_SYNTHETIC_SEED + 1));
  const trainingCount = Math.floor(shuffledRecords.length * TRAINING_FRACTION);
  const trainingRecords = shuffledRecords.slice(0, trainingCount);
  const validationRecords = shuffledRecords.slice(trainingCount);
  const trainingVectors = trainingRecords.map(vectorForRecord);
  const scaler = calculateScaler(trainingVectors);
  const toSample = (record) => ({
    vector: standardize(vectorForRecord(record), scaler),
    classIndex: RISK_LEVELS.indexOf(record.label),
  });
  const trainingSamples = trainingRecords.map(toSample);
  const validationSamples = validationRecords.map(toSample);
  const { weights, biases } = trainSoftmax(trainingSamples);
  const trainingMetrics = calculateMetrics(trainingSamples, weights, biases);
  const validationMetrics = calculateMetrics(validationSamples, weights, biases);

  return {
    name: "StudyBalance AI academic workload model",
    version: ARTIFACT_VERSION,
    schemaVersion: MODEL_SCHEMA_VERSION,
    modelType: "multinomial logistic regression (softmax)",
    trainedAt: REPRODUCIBLE_TRAINING_DATE,
    featureNames: [...MODEL_FEATURE_NAMES],
    classNames: [...RISK_LEVELS],
    scaler: {
      means: roundedNumbers(scaler.means),
      standardDeviations: roundedNumbers(scaler.standardDeviations),
    },
    weights: weights.map((row) => roundedNumbers(row)),
    biases: roundedNumbers(biases),
    training: {
      seed: DEFAULT_SYNTHETIC_SEED,
      sampleCount: dataset.sampleCount,
      trainingSampleCount: trainingSamples.length,
      validationSampleCount: validationSamples.length,
      classCounts: dataset.classCounts,
      split: TRAINING_FRACTION,
      normalization: "z-score using training-set population mean and standard deviation",
      iterations: TRAINING_ITERATIONS,
      learningRate: LEARNING_RATE,
      l2Regularization: L2_REGULARIZATION,
      trainingAccuracy: Number(trainingMetrics.accuracy.toFixed(4)),
      trainingMacroF1: Number(trainingMetrics.macroF1.toFixed(4)),
      validationAccuracy: Number(validationMetrics.accuracy.toFixed(4)),
      validationMacroF1: Number(validationMetrics.macroF1.toFixed(4)),
      validationConfusionMatrix: validationMetrics.confusionMatrix,
      labels: dataset.labelRule,
      limitation:
        "All training records and labels are synthetic. Metrics demonstrate pipeline behavior and are not evidence of clinical, psychological, or real-world educational validity.",
    },
  };
}

export async function serializeModelArtifact(artifact) {
  const source = `// Generated by scripts/train-model.js from deterministic synthetic data.\n// This artifact estimates academic workload for organizational support only.\n\nconst modelArtifact = ${JSON.stringify(artifact, null, 2)};\n\nexport default Object.freeze(modelArtifact);\n`;

  return format(source, {
    parser: "babel",
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
  });
}

async function runCommand() {
  const artifact = buildModelArtifact();
  const serialized = await serializeModelArtifact(artifact);
  const artifactUrl = new URL("../models/study-balance-model.js", import.meta.url);
  const artifactPath = fileURLToPath(artifactUrl);
  const checkOnly = process.argv.includes("--check");

  if (checkOnly) {
    if (!existsSync(artifactPath) || readFileSync(artifactPath, "utf8") !== serialized) {
      console.error("The model artifact is missing or out of date.");
      process.exitCode = 1;
      return;
    }

    console.log("The model artifact is reproducible and up to date.");
    return;
  }

  writeFileSync(artifactPath, serialized, "utf8");
  const summary = {
    version: artifact.version,
    samples: artifact.training.sampleCount,
    validationAccuracy: artifact.training.validationAccuracy,
    validationMacroF1: artifact.training.validationMacroF1,
  };

  console.log(JSON.stringify(summary, null, 2));
}

runCommand();
