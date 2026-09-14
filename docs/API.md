# API Reference

## 1. Overview

The StudyBalance AI server exposes a small same-origin JSON API using native Node.js HTTP modules.

- Default base URL: `http://localhost:3000`
- API prefix: `/api`
- Date format: `YYYY-MM-DD`
- Response encoding: `application/json; charset=utf-8`
- Required request encoding for POST endpoints: `application/json`
- Maximum request body: 1 MB
- Maximum tasks per analysis: 500

JSON responses use `Cache-Control: no-store`. The API has no authentication because the MVP is designed for a local, single-user environment. Do not expose it to an untrusted network without adding deployment-appropriate controls.

## 2. Task schema

Every task submitted for analysis has the following fields:

| Field            | Type    | Constraint                                             | Meaning                               |
| ---------------- | ------- | ------------------------------------------------------ | ------------------------------------- |
| `id`             | string  | Required, non-empty, unique in the request             | Stable local identifier               |
| `title`          | string  | Required, non-empty                                    | Human-readable task title             |
| `subject`        | string  | Required, non-empty                                    | Course or subject label               |
| `type`           | string  | `assignment`, `exam`, `reading`, `project`, or `other` | Academic activity type                |
| `deadline`       | string  | Valid `YYYY-MM-DD` calendar date                       | Due date                              |
| `estimatedHours` | number  | Finite and at least `0`                                | Total estimated effort                |
| `progress`       | number  | From `0` through `100`                                 | Completion percentage                 |
| `priority`       | string  | `low`, `medium`, or `high`                             | User-selected planning priority       |
| `flexible`       | boolean | Required                                               | Whether rescheduling may be practical |

The API interprets `progress: 100` as completed. It never infers task importance from the title or subject text.

## 3. Health check

### `GET /api/health`

Returns service status and exposes lightweight runtime diagnostics for the local service instance.

```json
{
  "status": "ok",
  "service": "study-balance-ai",
  "version": "1.0.0",
  "diagnostic": true,
  "requestCount": 12,
  "uptimeSeconds": 25.4
}
```

## 4. Demo schedule

### `GET /api/demo`

Returns an artificial schedule suitable for exploring the interface. No real student data are included.

An optional reference date may be supplied:

```text
GET /api/demo?referenceDate=2026-03-02
```

If the query value does not match the required date format, the server uses the current date.

## 5. Analyze a schedule

### `POST /api/analyze`

Request body:

```json
{
  "referenceDate": "2026-03-02",
  "weeklyAvailableHours": 18,
  "tasks": [
    {
      "id": "algorithms-exam",
      "title": "Algorithms midterm",
      "subject": "Algorithm Design",
      "type": "exam",
      "deadline": "2026-03-06",
      "estimatedHours": 8,
      "progress": 10,
      "priority": "high",
      "flexible": false
    },
    {
      "id": "statistics-set",
      "title": "Problem set 4",
      "subject": "Probability and Statistics",
      "type": "assignment",
      "deadline": "2026-03-03",
      "estimatedHours": 4,
      "progress": 45,
      "priority": "medium",
      "flexible": true
    }
  ]
}
```

`referenceDate` is optional. Supplying it is strongly recommended for tests, saved analyses, and reproducible examples. At the HTTP boundary, baseline `weeklyAvailableHours` must be at least `1` and no greater than `168`.

Example request:

```bash
curl --request POST http://localhost:3000/api/analyze \
  --header "Content-Type: application/json" \
  --data @schedule.json
```

### Analysis response

```jsonc
{
  "features": {
    "pendingTaskCount": 2,
    "completedTaskCount": 0,
    "overdueTaskCount": 0,
    "dueWithin7DaysCount": 2,
    "examWithin14DaysCount": 1,
    "remainingHours": 9.4,
    "dueWithin7DaysHours": 9.4,
    "weeklyAvailableHours": 18,
    "loadRatio": 0.5222,
    "deadlineCluster3Days": 1,
    "highPriorityTaskCount": 1,
    "nearestDeadlineDays": 1,
    "averageProgress": 27.5,
  },
  "dailyLoad": [
    {
      "date": "2026-03-02",
      "plannedHours": 2.54,
      "availableHours": 2.57,
      "loadRatio": 0.99,
      "taskIds": ["statistics-set", "algorithms-exam"],
      "taskCount": 2,
    },
    // Six more daily entries follow in the full response.
  ],
  "risk": {
    "level": "moderate",
    "score": 47,
    "confidence": 0.9282,
    "probabilities": {
      "low": 0.0694,
      "moderate": 0.9282,
      "high": 0.0025,
    },
  },
  "explanations": [
    {
      "feature": "averageProgress",
      "direction": "risk-increasing",
      "impact": 0.0023,
      "currentValue": 27.5,
      "baselineValue": 50,
      "method": "safe-reference local counterfactual",
    },
  ],
  "recommendations": [
    {
      "id": "maintain-sustainable-plan",
      "priority": "low",
      "title": "Keep the plan sustainable",
      "trigger": {
        "feature": "loadRatio",
        "operator": "<=",
        "threshold": 1,
        "actual": 0.5222,
      },
    },
  ],
  "disclaimer": "StudyBalance AI estimates academic workload patterns for organizational support only. It does not diagnose stress, burnout, depression, or any health condition, and it does not replace qualified professional support.",
  "metadata": {
    "referenceDate": "2026-03-02",
    "forecastDays": 7,
    "model": {
      "version": "1.0.0",
      "schemaVersion": 1,
      "seed": 42,
      "sampleCount": 3600,
      "validationMacroF1": 0.9744,
      "syntheticTrainingData": true,
    },
  },
}
```

This abbreviated response uses model artifact `1.0.0` and the request shown above. Only selected nested fields are shown; descriptive fields and six of the seven `dailyLoad` entries are omitted for readability.

The response fields have these meanings:

| Field                | Meaning                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `features`           | Deterministic summaries derived from the schedule                   |
| `dailyLoad`          | Seven calendar days of planned and available hours                  |
| `risk.level`         | Class with the highest softmax probability                          |
| `risk.score`         | Bounded zero-to-100 workload index derived from class probabilities |
| `risk.confidence`    | Probability assigned to the selected class                          |
| `risk.probabilities` | Softmax probabilities for all three classes                         |
| `explanations`       | Up to three safe-reference local counterfactuals                    |
| `recommendations`    | Deterministic planning actions with explicit triggers               |
| `disclaimer`         | Required non-diagnostic scope statement                             |
| `metadata`           | Reference date, forecast horizon, and model provenance              |

## 6. Simulate adjustments

### `POST /api/simulate`

The simulation request contains the same schedule fields as `/api/analyze` plus an `adjustments` object:

```json
{
  "referenceDate": "2026-03-02",
  "weeklyAvailableHours": 18,
  "tasks": [
    {
      "id": "algorithms-exam",
      "title": "Algorithms midterm",
      "subject": "Algorithm Design",
      "type": "exam",
      "deadline": "2026-03-06",
      "estimatedHours": 8,
      "progress": 10,
      "priority": "high",
      "flexible": false
    }
  ],
  "adjustments": {
    "weeklyAvailableHours": 22,
    "taskUpdates": [
      {
        "id": "algorithms-exam",
        "progress": 40
      }
    ],
    "removeTaskIds": []
  }
}
```

All adjustment fields are optional:

| Field                  | Type         | Behavior                                                                                       |
| ---------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `weeklyAvailableHours` | number       | Temporarily replaces baseline availability; must be greater than `0` and no greater than `168` |
| `taskUpdates`          | array        | Partially updates known tasks; each entry requires a valid existing `id`                       |
| `removeTaskIds`        | string array | Temporarily removes known tasks from the simulated copy                                        |

A task cannot be updated and removed in the same simulation. Duplicate task updates and unknown identifiers are rejected.

The response contains:

```jsonc
{
  "baseline": {/* complete analysis response */},
  "simulated": {/* complete analysis response */},
  "comparison": {
    "riskScoreDelta": -9,
    "highRiskProbabilityDelta": -0.0012,
    "peakDailyHoursDelta": -0.48,
    "loadRatioDelta": -0.1818,
    "levelChanged": false,
    "improved": true,
  },
  "appliedAdjustments": {
    "taskUpdates": [
      {
        "id": "algorithms-exam",
        "title": "Algorithms midterm",
        "subject": "Algorithm Design",
        "type": "exam",
        "deadline": "2026-03-06",
        "estimatedHours": 8,
        "progress": 40,
        "priority": "high",
        "flexible": false,
      },
    ],
    "removeTaskIds": [],
    "weeklyAvailableHours": 22,
  },
  "disclaimer": "StudyBalance AI estimates academic workload patterns for organizational support only. It does not diagnose stress, burnout, depression, or any health condition, and it does not replace qualified professional support.",
}
```

Delta values are calculated as `simulated - baseline`. `improved` means only that the simulated model score is lower; it is not a health or academic-success judgment. The endpoint does not persist the simulated schedule.

## 7. Error responses

Errors use a bounded JSON shape and do not include a stack trace:

```json
{
  "error": "The request body is not valid JSON."
}
```

| Status                       | Meaning                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `400 Bad Request`            | Malformed JSON or invalid schedule input                 |
| `404 Not Found`              | Unknown API path or static resource                      |
| `413 Payload Too Large`      | Request body exceeds 1 MB                                |
| `415 Unsupported Media Type` | A POST endpoint did not receive `application/json`       |
| `500 Internal Server Error`  | Unexpected analysis failure; internal details are hidden |

Callers must not use error text as a stable machine-readable contract.

## 8. Direct domain API

Code running inside the Node.js project can bypass HTTP and call the pure domain operations:

```js
import { analyzeSchedule, simulateRebalance } from "./src/domain/analyzer.js";

const analysis = analyzeSchedule(schedule);
const simulation = simulateRebalance({
  ...schedule,
  adjustments: {
    weeklyAvailableHours: 22,
  },
});
```

Invalid domain input throws `TypeError` or `RangeError`. Neither operation mutates its input.
