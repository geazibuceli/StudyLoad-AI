# Privacy and Ethics

## 1. Position

StudyBalance AI is a student-controlled planning prototype. It estimates patterns in an entered schedule and does not assess mental health. Privacy, autonomy, and transparent uncertainty are functional requirements, not optional additions.

This document describes the MVP's intended behavior. It is not a legal certification or a substitute for a deployment-specific privacy, security, accessibility, or ethics review.

## 2. Data inventory

The application needs only data that support academic planning:

| Data category               | Example                                        | Purpose                                  | Default location                                                  |
| --------------------------- | ---------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Task identifiers            | Locally generated task ID                      | Update and remove the correct task       | Browser `localStorage`                                            |
| Task and course description | Short title and course entered by the user     | Make the planner understandable          | Browser `localStorage`; retained in-browser by the bundled client |
| Schedule details            | Due date, type, priority, completion state     | Build the seven-day workload view        | Browser `localStorage`; request memory during analysis            |
| Effort estimate             | Expected study hours                           | Compare planned demand with availability | Browser `localStorage`; request memory during analysis            |
| Weekly availability         | Hours the user chooses to allocate             | Contextualize workload                   | Browser `localStorage`; request memory during analysis            |
| Planner view preferences    | Search text, sort order, filter selection      | Restore the user's planner view          | Browser `localStorage`                                            |
| Reference date              | Explicit analysis date                         | Make time windows reproducible           | Request memory                                                    |
| Derived output              | Probabilities, factors, suggestions            | Present planning support                 | Browser memory unless explicitly persisted                        |
| Scenario draft              | Temporary capacity or flexible-deadline change | Compare with the saved baseline          | Browser and request memory until reset or apply                   |
| Focus state                 | Bounded next-step sequence and timer           | Optional local planning aid              | Ephemeral browser memory                                          |
| Synthetic feature vectors   | Artificial workload-feature combinations       | Train and test the model                 | Development process and versioned artifact                        |

The MVP does not need names, personal email addresses, student numbers, precise location, contact lists, health records, biometric data, private messages, grades, financial data, protected demographic attributes, or institutional disciplinary information.

## 3. Data flow and retention

### In the browser

Planner data and search, sort, and filter preferences remain in same-origin `localStorage` until the user clears them or the browser removes site storage. Search text can itself reveal academic interests or concerns. Selected-day state, the Focus sequence, and the Focus timer are ephemeral. Scenario Lab drafts are also ephemeral unless the user explicitly applies their supported changes to the planner. The MVP has no account or automatic cloud backup. The interface should make deletion available and explain its effect before destructive action.

### During analysis

For requests made by the bundled web client, task and course names remain in the browser. The client replaces them with neutral placeholders and sends the structural fields needed for the requested forecast or simulation: task identifiers, types, dates, estimated hours, progress, priorities, flexibility, reference date, and weekly availability. The same-origin Node.js API processes the request in memory and does not use it to update the model or create a student profile.

This text-minimization behavior belongs to the bundled client. A direct API client constructs its own request body and is responsible for deciding what content to send. A deployment must not assume that the endpoint itself removes private text.

### During training

Training uses deterministic synthetic data generated with seed `42`. User tasks are not silently collected, retained, or added to that dataset.

### Operational systems

Reverse proxies, hosting platforms, browser extensions, device backups, or custom monitoring can change this privacy posture. Anyone deploying the application is responsible for auditing those systems, disabling payload logging, defining retention, and communicating material changes.

## 4. Local storage is not secrecy

Local-first storage reduces centralized collection but does not make data confidential by itself. Risks include:

- another person using the same unlocked browser profile;
- malicious browser extensions or scripts executing on the same origin;
- device compromise or unencrypted device backups;
- accidental deletion through browser cleanup or private browsing;
- exposure of persisted planner search text as well as task details;
- exposure if the application is deployed with insecure HTTP or unsafe logging.

Users should avoid putting sensitive personal narratives into task titles. A shared-device deployment needs controls beyond this MVP.

## 5. Consent and control

For ordinary local use, the application should provide clear notice before storing planner data and offer an understandable deletion action. It should never:

- opt the user into research or telemetry through planner use;
- hide model processing behind a misleading productivity label;
- share individual forecasts with instructors, institutions, family members, or advertisers;
- modify tasks automatically to improve a score;
- apply a Scenario Lab draft without an explicit user action;
- make essential functionality conditional on unrelated data collection.

Any study involving people requires a separate informed-consent process that states purpose, procedures, data fields, retention, recipients, risks, withdrawal options, and contact channels appropriate to the study.

## 6. Intended and prohibited uses

### Intended

- personal reflection on a seven-day academic plan;
- interactive inspection of modeled daily effort and optional local focus sequencing;
- educational demonstration of transparent machine learning;
- software research on local-first, explainable planning tools;
- what-if exploration controlled by the user.

### Prohibited

- diagnosis, screening, treatment, or crisis assessment;
- student ranking, grading, admissions, scholarship, or disciplinary decisions;
- attendance enforcement, surveillance, or productivity monitoring;
- automated referral or reporting without specific informed consent and appropriate safeguards;
- inference of disability, mental state, academic ability, or likelihood of failure;
- any adverse decision based on the forecast or recommendations.

## 7. Ethical risks and safeguards

| Risk                       | Why it matters                                                           | MVP safeguard                                                                        | Further work required                                            |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Clinical misinterpretation | A workload label may be mistaken for a health assessment                 | Persistent non-diagnostic language and schedule-focused labels                       | Comprehension testing with representative users                  |
| False reassurance          | A `low` result may hide unrecorded constraints or distress               | Visible limitations and no wellness claim                                            | Human-centered validation and escalation guidance                |
| Unnecessary alarm          | A `high` result may increase pressure                                    | Neutral wording, uncertainty, and optional actions                                   | Measure alert fatigue and emotional impact                       |
| Automation bias            | Probabilities may appear more authoritative than they are                | Factors, counterfactual framing, and user control                                    | Evaluate understanding and calibration display                   |
| Distribution bias          | Synthetic feature vectors cannot represent all programs or circumstances | No demographic or institutional claims                                               | Diverse real-world validation with subgroup analysis             |
| Accessibility exclusion    | Planning interfaces can create barriers                                  | Standards-based controls, keyboard paths, mobile actions, and reduced-motion support | Keyboard, screen-reader, contrast, motion, and cognitive testing |
| Privacy exposure           | Academic schedules and planner searches can reveal routines or concerns  | Local-first storage and neutral text placeholders in bundled-client API requests     | Threat modeling and deployment-specific controls                 |
| Recommendation burden      | Advice may imply that every deadline can be moved                        | Suggestions remain optional and describe assumptions                                 | Co-design with students and support staff                        |

The bundled interface suppresses global single-key shortcuts while the user is editing a field and disables nonessential reveal motion when `prefers-reduced-motion: reduce` is active. These safeguards reduce specific barriers but do not establish accessibility compliance.

## 8. Fairness

Excluding protected attributes does not guarantee fairness. Task patterns may still reflect course structure, employment, caregiving, disability, access to technology, language, finances, or institutional policy. A model trained on synthetic assumptions may perform unevenly across those contexts even when it never sees demographic fields.

Before broader use, evaluation should report error and calibration by relevant, ethically collected groups; examine intersectional effects where sample sizes permit; include students with varied schedules and accessibility needs; and document mitigations without treating group membership as a deficit.

## 9. Transparency requirements

Every user-facing forecast should preserve:

- the seven-day time window and reference date;
- all workload classes or an equivalent uncertainty representation;
- the key schedule factors used in the explanation;
- the counterfactual nature of any alternative scenario;
- Scenario Lab deltas as `simulated - baseline` and the fact that scenarios remain temporary until explicitly applied;
- the optional status of recommendations;
- the non-diagnostic disclaimer;
- a clear path to the model and data documentation.

Changes to the model, data generator, feature schema, or recommendation rules should be reviewable in version control and described in release notes.

## 10. Security baseline

The repository should maintain strict input validation, bounded request sizes, safe path handling, explicit content types, non-sensitive error responses, and automated tests for malformed inputs. A public deployment additionally needs HTTPS, hardened headers, rate limiting, deliberate origin and access controls, safe logs, dependency and runtime update processes, backups where promised, and an incident response plan.

Zero runtime dependencies reduce one class of supply-chain risk, but they do not remove application, browser, network, or operational risk.

## 11. Human support

StudyBalance AI is not an emergency or counseling service. The application should not attempt to infer a crisis from task data. If academic demands are affecting a user's health or safety, the responsible message is to seek appropriate human support, such as a trusted person, a student support service, or a qualified professional. Emergency guidance must be tailored to the user's actual location by a service designed for that purpose.

## 12. Sustainable Development Goals

The project is motivated by:

- **SDG 3, Good Health and Well-Being:** exploring non-clinical support for sustainable academic routines;
- **SDG 4, Quality Education:** exploring understandable tools that help students plan educational demands.

This alignment is conceptual. The MVP does not measure SDG indicators or establish positive impact.
