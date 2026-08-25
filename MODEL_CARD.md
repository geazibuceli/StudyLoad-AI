# Model Card: StudyBalance AI Academic Workload Model

## Model details

| Item | Value |
|---|---|
| Model name | StudyBalance AI academic workload model |
| Artifact version | `1.0.0` |
| Schema version | `1` |
| Release date | 2026-08-24 |
| Model family | Multinomial logistic regression with softmax output |
| Classes | `low`, `moderate`, `high` |
| Forecast horizon | Seven calendar days |
| Training data | Deterministic synthetic feature records only |
| Synthetic seed | `42` |
| Runtime | Node.js 22+ using JavaScript ESM |
| Runtime dependencies | None |
| License | MIT |

The versioned artifact is stored in `models/study-balance-model.js`. Training logic is stored in `scripts/train-model.js`, and the synthetic generator is stored in `scripts/synthetic-data.js`.

## Scope statement

The model estimates **patterns of academic demand represented in a task planner**. It is an educational software prototype, not a clinical model.

It does not diagnose or estimate stress, burnout, depression, anxiety, disability, illness, academic ability, or likelihood of failure. Its class names are operational schedule labels and have no validated mapping to a health outcome.

## Intended uses

- Personal review of workload represented in a seven-day academic schedule.
- Explainable what-if exploration before changing a planner.
- Demonstration of a dependency-free, reproducible softmax pipeline.
- Software research on transparent academic planning support.
- A baseline for future validation against simpler rules and responsibly collected data.

## Intended users

- Students who choose to inspect their own task plan.
- Educators, researchers, and developers studying explainable educational software, provided they preserve the limitations in this card.

The model is not intended to operate silently in the background or to produce results about a person who has not knowingly supplied a schedule.

## Out-of-scope and prohibited uses

- Diagnosis, treatment, screening, counseling, or crisis assessment.
- Student ranking, grading, admissions, scholarships, attendance enforcement, or discipline.
- Institutional surveillance, productivity monitoring, or automated reporting.
- Decisions that restrict access to education, support, employment, housing, insurance, or services.
- Inference of protected attributes, mental state, academic ability, or future success.
- Use of a workload label as a proxy for burnout, distress, or any health condition.
- Autonomous modification of deadlines, tasks, or student records.

## Input representation

The model receives twelve numerical features derived from a validated schedule. It does not process free text, names, task titles, subject labels, or demographic attributes.

| Feature | Definition |
|---|---|
| `pendingTaskCount` | Number of tasks with progress below 100 percent |
| `overdueTaskCount` | Pending tasks with deadlines before the reference date |
| `dueWithin7DaysCount` | Pending, non-overdue tasks due from day zero through day six |
| `examWithin14DaysCount` | Pending exams due from day zero through day thirteen |
| `remainingHours` | Sum of estimated hours remaining after progress is applied |
| `dueWithin7DaysHours` | Remaining hours attached to tasks due within seven days |
| `weeklyAvailableHours` | User-supplied planning availability for the week |
| `loadRatio` | Modeled weekly hours divided by weekly available hours |
| `deadlineCluster3Days` | Largest task count inside a three-day window before day fourteen; all overdue deadlines, including older ones, are folded into day zero |
| `highPriorityTaskCount` | Pending tasks marked as high priority |
| `nearestDeadlineDays` | Bounded non-negative distance to the nearest pending deadline; defaults to 30 with no pending task |
| `averageProgress` | Mean progress among pending tasks; defaults to 100 with no pending task |

Feature order is part of schema version `1`. The artifact stores the training-set mean and population standard deviation for each feature. Inference applies z-score standardization and clips each standardized value to the interval from `-6` through `6` to limit extreme numerical extrapolation.

## Output

For each class \(k\), the model computes a linear logit from the standardized feature vector \(x\):

$$
z_k = b_k + \sum_j w_{k,j}x_j
$$

It converts logits into probabilities with a numerically stable softmax:

$$
P(y=k \mid x) = \frac{e^{z_k}}{\sum_c e^{z_c}}
$$

The response includes:

- `level`: the class with the largest unrounded probability;
- `confidence`: that class probability, rounded to four decimal places;
- `probabilities`: all three class probabilities, rounded to four decimal places;
- `score`: `round(50 × P(moderate) + 100 × P(high))`, bounded from zero through 100.

The score is a convenience index created by this project. It is not a validated scale. Softmax confidence is not a guarantee of correctness and has not been calibrated on real student data.

## Training data

The training pipeline generates 3,600 artificial feature records with seed `42`, balanced to exactly 1,200 records per synthetic class. It then shuffles them with seed `43` and uses an 80/20 holdout split:

| Partition | Records |
|---|---:|
| Training | 2,880 |
| Synthetic validation | 720 |
| Total | 3,600 |

Synthetic labels come from a hand-designed latent workload score plus deterministic seeded Gaussian noise:

- `low`: latent score below 20;
- `moderate`: latent score from 20 up to, but not including, 52;
- `high`: latent score of 52 or higher.

Class balancing uses rejection sampling until each quota is filled. See [DATA_CARD.md](DATA_CARD.md) for the complete generation formula and distribution limitations.

## Training procedure

| Setting | Value |
|---|---:|
| Optimization | Full-batch gradient descent |
| Iterations | 900 |
| Learning rate | 0.08 |
| L2 regularization | 0.002 |
| Initialization | Zero weights and biases |
| Normalization | Training-set z-score using population standard deviation |
| Artifact timestamp | Fixed at `2026-08-24T00:00:00.000Z` for reproducibility |

The training process is deterministic for the same supported runtime and source version. User tasks are never used for online learning or automatic retraining.

## Synthetic evaluation

| Metric | Training split | Validation split |
|---|---:|---:|
| Accuracy | 0.9177 | 0.9014 |
| Macro F1 | 0.9183 | 0.9011 |

Validation confusion matrix, with rows as synthetic true labels and columns as predicted labels:

| Actual \ Predicted | Low | Moderate | High |
|---|---:|---:|---:|
| Low | 214 | 20 | 0 |
| Moderate | 22 | 204 | 8 |
| High | 0 | 21 | 231 |

These metrics measure agreement with labels created by the same project assumptions. They do **not** estimate accuracy, safety, fairness, calibration, or usefulness for real students. The validation split is not an external dataset, and its records are not independent of the synthetic generation design.

## Explanations

The explanation layer is post hoc and local. It first constructs a lower-load reference vector by applying the rule-defined baselines below to every recognized feature. Several baselines depend on the current value or weekly availability. It then restores one feature at a time to its current value while all other features remain at their reference values. The reported impact is the resulting change from the safe-reference `high` probability. It returns up to three effects with an absolute change of at least 0.002; when none qualify, it returns one neutral fallback with zero impact.

| Feature | Counterfactual baseline |
|---|---|
| Pending tasks | At most 3 |
| Overdue tasks | 0 |
| Tasks due within seven days | At most 2 |
| Exams within fourteen days | At most 1 |
| Remaining hours | At most 1.5 times weekly availability |
| Hours due within seven days | At most 0.7 times weekly availability |
| Weekly availability | At least 20 hours |
| Load ratio | At most 0.75 |
| Three-day deadline cluster | At most 1 |
| High-priority tasks | At most 2 |
| Nearest deadline | At least 7 days |
| Average progress | At least 50 percent |

The response also carries the full schedule's current `high` probability, but the per-feature impact is calculated against the safe-reference probability. Individual impacts are not additive and cannot reconstruct the full prediction.

This method explains model sensitivity, not causality. Because schedule features are related, the reference and one-feature-restored vectors can create combinations that no real schedule could produce. The output must therefore be described as a **safe-reference local counterfactual**, never as proof that changing one task will create the stated personal outcome.

## Recommendation layer

Recommendations are outside the model. A deterministic rule engine checks observable conditions such as overdue work, a load ratio above one, at least three deadlines in a three-day window, at least two upcoming exams, or at least three high-priority tasks. Each result exposes the triggering feature, operator, threshold, observed value, action text, and related task identifiers.

This separation is intentional: a probability model does not decide what a student must do. Recommendations are optional planning prompts and never modify tasks automatically.

## Key limitations

### Synthetic target circularity

The labels are functions of the same feature families presented to the model. Strong synthetic performance therefore shows that softmax regression approximates the project's hand-designed rule, not that it discovered an external phenomenon.

### Feature-level generation gap

Training records are generated directly as feature vectors rather than as complete task schedules passed through the production feature extractor. Some artificial combinations may violate relationships that naturally hold between schedule-derived features. This creates an unmeasured training-to-inference distribution gap.

### Limited input range

Synthetic weekly availability spans approximately 6 to 46 hours, while baseline HTTP analyses accept values from 1 through 168. Other real schedules may also exceed synthetic ranges. Clipping limits numerical extremes but does not make out-of-distribution predictions reliable.

### Linear decision surfaces

Softmax regression is linear after feature standardization. It may miss nonlinear interactions, program-specific patterns, seasonal changes, and constraints that feature engineering does not encode.

### No person-level context

The model sees only the entered planner snapshot. It cannot account for employment, caregiving, disability, accessibility needs, finances, commuting, sleep, social support, teaching quality, or unrecorded obligations.

### Self-report and planner quality

Missing tasks, inaccurate progress, unrealistic effort estimates, or stale availability can materially change the output. The model cannot detect all such errors.

### No external calibration or fairness evidence

There is no real-world calibration study, longitudinal evaluation, subgroup analysis, impact assessment, or evidence that recommendations improve planning. Excluding protected attributes does not guarantee equitable performance.

## Ethical considerations

- Keep non-diagnostic language visible next to every forecast.
- Do not report individual results to another person or institution without a separate, specific, informed process and appropriate safeguards.
- Do not optimize a schedule merely to obtain a lower model label.
- Preserve uncertainty and explain that high confidence can still be wrong.
- Evaluate false reassurance, unnecessary alarm, automation bias, accessibility, and recommendation burden before broader use.
- Never use the output for adverse decisions.

See [Privacy and Ethics](docs/PRIVACY_AND_ETHICS.md) for the full use policy.

## Reproducibility and verification

Verify that the committed artifact exactly matches deterministic training:

```bash
node scripts/train-model.js --check
```

Regenerate it intentionally with:

```bash
node scripts/train-model.js
```

Any artifact change requires review of the generator, feature schema, label assumptions, synthetic metrics, tests, this card, and [DATA_CARD.md](DATA_CARD.md). A better synthetic metric alone is not sufficient justification for release.

## Validation needed before expanded use

At minimum, future work would require a clearly defined non-clinical target co-designed with students and relevant experts; ethics approval and informed consent for participant research; temporal and institution-external validation; probability calibration; subgroup and intersectional error analysis; accessibility and explanation-comprehension testing; and evaluation against a transparent rule-only baseline.

This repository makes no claim that those steps have occurred.
