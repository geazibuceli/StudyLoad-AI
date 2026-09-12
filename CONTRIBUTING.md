# Contributing to StudyBalance AI

Thank you for helping improve StudyBalance AI. Contributions are especially valuable when they make the project easier to understand, test, access, or evaluate responsibly.

## Project boundaries

Before proposing a change, preserve these non-negotiable boundaries:

- The application supports academic planning and does not diagnose any health condition.
- Individual forecasts must not be used for ranking, surveillance, discipline, or another adverse decision.
- User tasks remain local by default and are not silently collected or used for training.
- Model probabilities and synthetic metrics must not be presented as real-world or clinical evidence.
- Recommendations remain deterministic, inspectable, optional, and separate from prediction.
- What-if operations must not mutate the saved schedule without an explicit user action.
- User-facing text, code comments, tests, and documentation use English.

A contribution that crosses these boundaries needs a clearly justified design discussion and appropriate ethical evidence, not only a code change.

## Ways to contribute

- Report a reproducible bug or unclear behavior.
- Improve keyboard, screen-reader, contrast, motion, or cognitive accessibility.
- Add boundary, security, determinism, or property-oriented tests.
- Clarify explanations, uncertainty, privacy, or non-diagnostic language.
- Improve frontend usability without adding hidden data collection.
- Strengthen synthetic-data and model documentation.
- Propose a transparent baseline or a responsible evaluation design.
- Correct documentation drift between source, API, model artifact, and cards.

## Development setup

### Requirements

- Node.js 22 or newer.
- Git.

The application has zero runtime dependencies. From the repository root:

```bash
npm start
```

Open `http://localhost:3000` to use the application.

For automatic server restarts during development:

```bash
npm run dev
```

## Repository map

| Path                            | Purpose                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `public/`                       | HTML, CSS, JavaScript, and static browser assets                                        |
| `src/server.js`                 | Native HTTP server, static delivery, and API routing                                    |
| `src/domain/`                   | Validation, features, model inference, explanations, recommendations, and orchestration |
| `src/demo.js`                   | Artificial demo schedule                                                                |
| `scripts/synthetic-data.js`     | Deterministic synthetic feature generator                                               |
| `scripts/train-model.js`        | Softmax training, evaluation, and artifact serialization                                |
| `models/study-balance-model.js` | Versioned model artifact                                                                |
| `tests/`                        | Node.js test suite                                                                      |
| `docs/`                         | Technical and responsible-use documentation                                             |
| `MODEL_CARD.md`                 | Model transparency record                                                               |
| `DATA_CARD.md`                  | Synthetic-data transparency record                                                      |

## Make a focused change

1. Check existing issues before opening a duplicate.
2. Create a short-lived branch from the current default branch.
3. Keep the change limited to one coherent problem.
4. Add or update tests for behavior changes.
5. Update documentation when a contract, assumption, label, recommendation, or privacy behavior changes.
6. Run all verification commands.
7. Open a pull request that explains the problem, approach, evidence, risks, and limitations.

Do not commit local planner data, exported schedules, secrets, access tokens, private research records, generated coverage output, or editor-specific state.

## Code standards

- Use JavaScript ESM and explicit imports.
- Prefer native Node.js and browser APIs.
- Keep domain functions deterministic and side-effect free where practical.
- Treat HTTP and `localStorage` input as untrusted.
- Validate at trust boundaries and use finite, bounded numerical values.
- Keep dates explicit and deterministic in tests; use `YYYY-MM-DD` calendar values.
- Do not mutate caller-owned schedule or simulation objects.
- Keep prediction, explanation, and recommendation responsibilities separate.
- Return bounded errors without stack traces or sensitive payloads.
- Use names that describe academic workload rather than health status.
- Add a runtime dependency only after documenting the need, alternatives, maintenance cost, security implications, and removal plan.

## Frontend and accessibility standards

- Start with semantic HTML and native controls.
- Support keyboard-only operation and visible focus.
- Associate labels, descriptions, errors, and status updates programmatically.
- Preserve readable contrast and do not rely on color alone for workload levels.
- Respect reduced-motion preferences.
- Keep critical limitations visible at the point of interpretation.
- Test narrow screens, zoom, long text, and empty or error states.
- Avoid manipulative urgency, shame, streak pressure, or celebratory framing around a model score.

## Test and verify

Run the automated suite:

```bash
npm test
```

Run syntax and project checks:

```bash
npm run check
```

If the model pipeline is in scope, verify artifact reproducibility:

```bash
node scripts/train-model.js --check
```

Relevant tests should cover success, empty state, invalid input, boundary dates, extreme finite values, non-mutation, deterministic output, and failure behavior. A visual change should also be reviewed with keyboard navigation and at least one screen-reader workflow.

## Model and data changes

Changing any of the following is a model change, even if the JavaScript API remains the same:

- feature names, order, definitions, or normalization;
- synthetic generator distributions or correlations;
- label formula, thresholds, noise, balancing, or seed;
- split, optimizer, iterations, learning rate, or regularization;
- class names, score formula, counterfactual baselines, or clipping;
- model artifact parameters or version.

For such a change:

1. State the hypothesis and expected benefit before selecting results.
2. Regenerate the artifact through `scripts/train-model.js` rather than editing coefficients manually.
3. Run the full test suite and reproducibility check.
4. Report both favorable and unfavorable synthetic results.
5. Update `MODEL_CARD.md`, `DATA_CARD.md`, methodology, and API metadata.
6. Explain compatibility and migration implications.
7. Avoid describing synthetic metric gains as student benefit.

The committed artifact should match the trainer byte for byte. New artifact versions must preserve or deliberately migrate schema validation.

## Recommendation changes

Every recommendation rule should expose:

- a stable identifier;
- the feature, operator, threshold, and observed value that triggered it;
- a bounded action written as an option, not a command;
- related task identifiers only when needed;
- a test for both triggering and non-triggering cases.

Review recommendations for hidden assumptions about deadline flexibility, free time, disability, employment, caregiving, finances, and access to institutional support.

## Documentation standards

- Use plain English and define specialized terms on first use.
- Distinguish implemented behavior from future work.
- Link to source or a DOI for research claims.
- Never fabricate benchmark results, participant counts, validation studies, or impact.
- Keep examples artificial and free of personal information.
- Preserve the distinction between model confidence and correctness.
- Update internal links and Mermaid diagrams when architecture changes.

## Pull request checklist

- [ ] The change has a focused purpose and no unrelated refactor.
- [ ] Tests were added or updated and `npm test` passes.
- [ ] `npm run check` passes.
- [ ] The model artifact check passes when relevant.
- [ ] Inputs remain validated and caller-owned data remain unmodified.
- [ ] No personal data, secret, telemetry, or hidden external request was added.
- [ ] Accessibility and responsive behavior were reviewed when relevant.
- [ ] Non-diagnostic language and user control remain intact.
- [ ] Documentation, Model Card, and Data Card were updated when required.
- [ ] The pull request states limitations and any unresolved risk.

## Bug reports

A useful bug report includes:

- the StudyBalance AI and Node.js versions;
- browser and operating-system information when relevant;
- exact reproduction steps using artificial data;
- expected and actual behavior;
- sanitized logs or screenshots;
- whether the problem affects data loss, privacy, accessibility, or safety wording.

Do not attach a real academic schedule or another person's information to a public issue.

## Security and privacy reports

Do not publish an exploitable vulnerability or exposed personal data in a public issue. Use the repository's private security reporting feature when available. Include a minimal artificial proof of concept, affected versions, potential impact, and suggested mitigation.

## Review expectations

Review evaluates correctness, scope, tests, accessibility, privacy, scientific honesty, and maintenance cost. Maintainers may request a smaller change, additional evidence, or documentation before merging. A higher synthetic score alone is not evidence that a model contribution is safer or more useful.

## Community expectations

Be respectful, specific, and open to correction. Discuss code and evidence rather than a contributor's identity or ability. Do not share private student information. Harassment, discrimination, intimidation, and coercive use of project outputs are not acceptable.

By contributing, you agree that your contribution is licensed under the project's MIT License.
