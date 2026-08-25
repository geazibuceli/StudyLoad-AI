# Methodology

## 1. Objective

StudyBalance AI investigates whether information already present in an academic planner can be transformed into three useful forms of support:

1. an early estimate of concentrated demand in the next seven days;
2. an understandable account of the schedule factors associated with that estimate;
3. optional planning actions that the student can inspect and simulate.

This is a software feasibility prototype. It does not test a medical hypothesis, infer a psychological state, or claim that academic workload alone determines well-being.

## 2. Operational definition

For this project, **academic overload** is an operational label for a pattern of scheduled demand relative to time and capacity. The output classes are:

- `low`: the synthetic training procedure represents the schedule as comparatively manageable;
- `moderate`: the procedure represents meaningful concentration or pressure that may benefit from planning attention;
- `high`: the procedure represents a comparatively dense or urgent schedule that warrants prompt review.

These definitions apply only inside this model. They do not correspond to a validated clinical scale, diagnosis, student identity, academic ability, or moral judgment.

## 3. Unit and prediction window

The unit of analysis is one schedule snapshot for a seven-day window beginning at a supplied reference date. Input consists of academic tasks and a weekly availability estimate. A forecast is about that snapshot, not about the person who created it.

The reference date is explicit so tests and simulations remain deterministic. Date calculations use normalized calendar values instead of relying on the machine's current local time.

## 4. Feature construction

At runtime, feature engineering converts the schedule into validated numerical indicators. The model schema focuses on workload rather than health or identity. Its inputs summarize:

- pending and overdue task counts;
- tasks and remaining hours due within the seven-day window;
- exams due within fourteen days;
- total remaining effort, weekly availability, and their modeled load ratio;
- three-day deadline concentration and high-priority task count;
- time to the nearest deadline and average progress among pending tasks.

The day-by-day load map is computed separately for presentation and comparison; peak daily load and within-week distribution are not classifier inputs in artifact version `1.0.0`.

The versioned model artifact is the authoritative source for feature order, normalization parameters, and schema version. Runtime inputs come from the production schedule extractor, while training vectors are generated directly by the synthetic-data script. Both use the same named schema, but they do not share an end-to-end schedule extraction path. This creates the distribution gap described below and in the Data Card. No protected demographic attribute, health record, biometric signal, message content, grade, or institutional disciplinary data is required.

## 5. Synthetic data

The model is trained only on programmatically generated feature vectors. A deterministic pseudorandom generator initialized with seed `42` varies counts, workload values, deadline summaries, progress, and weekly availability within bounded ranges. It does not generate complete task schedules and pass them through the production extractor.

Synthetic class labels are produced from explicit assumptions about schedule density and urgency. This provides a reproducible target for software development, but it also means that the model primarily approximates those assumptions. It does not discover a ground truth about real students.

The generator is useful for:

- exercising the complete training and inference pipeline;
- creating edge cases without collecting personal information;
- verifying deterministic behavior;
- comparing code changes against a stable baseline.

It is not evidence of population representativeness, real-world accuracy, fairness, or intervention benefit. See [DATA_CARD.md](../DATA_CARD.md).

## 6. Model

The predictor is multinomial logistic regression with a softmax output. For normalized input vector \(x\), class \(k\) receives the logit:

$$
z_k = b_k + \sum_j w_{k,j}x_j
$$

The model converts logits to class probabilities:

$$
P(y=k \mid x) = \frac{e^{z_k}}{\sum_c e^{z_c}}
$$

The implementation uses a numerically stable softmax transformation. The class with the highest probability is the displayed level, while all class probabilities remain available so the interface can expose uncertainty.

Softmax regression was selected because it is compact, deterministic, dependency-free, and easier to audit than a large nonlinear model. Its main tradeoff is limited ability to represent interactions unless they are encoded during feature engineering.

## 7. Training reproducibility

Training is an explicit development step, separate from application startup and user requests. Reproducibility depends on:

- Node.js 22 or newer;
- JavaScript ESM source committed with the project;
- seed `42` for synthetic generation;
- deterministic sample ordering and initialization;
- a versioned feature schema and model artifact;
- automated checks that detect schema or artifact drift.

The same repository version and supported runtime should produce the same synthetic feature vectors and model parameters. Floating-point differences across engines or architectures should still be handled with appropriate test tolerances.

## 8. Forecast output

An analysis returns more than a class label. The domain result includes:

- derived features and a seven-day load summary;
- workload level, score, confidence, and class probabilities;
- explanations tied to observable schedule properties;
- deterministic recommendations;
- a non-diagnostic disclaimer;
- metadata identifying the model and analysis assumptions.

Confidence is a property of the model output, not a guarantee of correctness. A high softmax probability can still be wrong or poorly calibrated outside the synthetic distribution.

## 9. Explanations

StudyBalance AI uses a safe-reference counterfactual analysis. It first moves every recognized workload feature toward a rule-defined lower-load reference and calculates the reference `high` probability. Several reference values depend on the current value or weekly availability rather than being global constants. It then restores one feature at a time to its current value, runs the same model, and reports the probability difference from that safe reference. An explanation can therefore answer a narrow question such as:

> Against the project's lower-load reference, how much does the current value of this one feature change the model's `high` probability while the other features remain at reference values?

The layer returns up to three absolute effects at or above 0.002. When no candidate reaches that threshold, it returns one neutral fallback stating that no single workload factor materially changed the estimate. It also exposes current and baseline feature values, the actual schedule's `high` probability, and the safe-reference probability. The individual effects are not additive and should not be summed to reconstruct the forecast.

These comparisons explain local model behavior; they do not prove that a feature causes stress or that changing it is possible or desirable for every student. Because derived features depend on one another, the safe-reference vectors may not correspond to schedules that can exist in practice.

## 10. Recommendations

Recommendations are produced by a rule engine, not generated by the classifier or a language model. Rules map validated schedule conditions to bounded actions such as:

- review urgent or overdue tasks first;
- divide a large task into smaller sessions;
- spread work away from a peak day where constraints allow;
- reserve capacity before a clustered assessment period;
- confirm effort estimates when planned hours exceed availability.

Each recommendation should state the schedule evidence that triggered it. Rules never edit tasks automatically, contact another person, or make a health claim.

## 11. What-if simulation

The simulator analyzes two immutable snapshots:

1. the current baseline schedule;
2. a copy with explicit temporary adjustments.

Both snapshots use the same reference date, feature schema, and model. The comparison reports changes in workload level, score, probabilities, and relevant schedule summaries. The operation is analytical only and does not save the simulated plan.

Simulation supports planning exploration, but it must not be optimized blindly to obtain a preferred color or label. Removing a task from the simulation does not remove the real obligation.

## 12. Evaluation strategy

### Current technical evaluation

Automated tests should verify:

- deterministic synthetic generation and training;
- feature order and artifact schema compatibility;
- finite probabilities in the interval from zero to one that sum to one;
- stable results for fixed inputs and reference dates;
- validation of malformed, extreme, and boundary inputs;
- separation between baseline and simulated schedules;
- deterministic, deduplicated recommendations;
- preservation of the non-diagnostic disclaimer.

Metrics calculated on held-out synthetic data describe agreement with synthetic labels only. They must be reported as engineering diagnostics, never as expected performance with real students.

### Evidence required before real-world claims

A responsible validation study would need to define the target with students and relevant experts, preregister the analysis where appropriate, obtain ethics approval and informed consent, and evaluate:

- discrimination and calibration on data not used for development;
- temporal generalization across academic periods;
- subgroup performance and error distribution;
- explanation comprehension and accessibility;
- recommendation usefulness and unintended pressure;
- false reassurance, alert fatigue, and other harms;
- whether the tool improves planning outcomes compared with a simpler baseline.

No such study is claimed by this repository.

## 13. Interpretation checklist

Before communicating a result, confirm that:

- it is described as a forecast of the entered schedule;
- all three probabilities or an equivalent uncertainty cue remain visible;
- explanations are framed as model sensitivity, not causality;
- recommendations remain optional and feasible for the user to judge;
- no health, ability, or academic-success inference is added;
- synthetic evaluation is not presented as student validation.
