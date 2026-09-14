# User Guide

## 1. Before you begin

StudyBalance AI helps you inspect the demand represented in an academic planner. It does not measure your well-being and cannot know about obligations, accessibility needs, work, caregiving, finances, sleep, or events that you do not enter.

Use the forecast as one planning signal, not as a verdict about yourself or your academic ability.

## 2. Start the application

Install Node.js 22 or newer, then run this command from the repository root:

```bash
npm start
```

Open `http://localhost:3000`. If a saved planner already exists in this browser, the application restores it automatically. On a first visit with no saved planner, the interface starts with an empty planner and invites you to add your own tasks or load the built-in artificial example from **Explore sample data**.

### Start with Today

When your planner contains tasks, the **Today** dashboard replaces the introductory banner. It shows counts for unfinished tasks due today and overdue, up to three tasks from those groups, and your next three future deadlines. Completed tasks are excluded from these lists. Select a task to edit its details or progress, use **Add task**, or open **Start a focus session** to choose a task and start the existing timer.

**Weekly workload** shows the modeled work for the next seven days relative to your weekly availability. It updates with the forecast; while the forecast is loading or unavailable, the task lists remain usable and the percentage is hidden. **View full forecast** opens the detailed analysis and availability controls below.

The dashboard ignores planner search and filters. **View all open tasks** clears them and opens the planner. When every task is completed, the dashboard keeps your saved plan accessible and disables the focus shortcut until you add or reopen a task. Removing all tasks brings back the introduction. The date follows your local calendar and refreshes when the day changes, including when you return to the tab.

## 3. Set weekly availability

Enter the number of hours you realistically intend to make available for academic work during the next seven days. The interface accepts values from `1` through `168`.

Availability is a planning estimate, not a demand to fill every hour. Include a sustainable amount rather than the theoretical maximum time in the week.

## 4. Add a task

Each task records:

- **Title:** a short description; avoid sensitive personal narratives.
- **Subject:** the course or area associated with the task.
- **Type:** assignment, exam, reading, project, or other.
- **Deadline:** a valid calendar date.
- **Estimated hours:** total effort currently expected.
- **Progress:** a value from zero through 100 percent.
- **Priority:** your low, medium, or high planning priority.
- **Flexible:** whether moving or redistributing this work may be practical.

Estimates do not need to be perfect. Update them when you learn more, because the forecast reflects the current planner snapshot.

## 5. Review the task planner

Use the task list to search task and course names, sort by deadline, priority, remaining effort, or progress, and filter open, near-term, high-priority, or all tasks. The selected search, sort, and filter view persists in this browser.

Each task card has an inline progress control in five-percentage-point steps. Changing it saves immediately to the local planner and requests a refreshed forecast. A task at 100 percent progress is treated as completed. You can still open the task editor to correct other fields, or remove a task that is no longer relevant. An unfinished task with a deadline before the reference date is treated as overdue.

The CSV export creates a local planner file and does not include model predictions.

Removing a task from the application does not remove the real academic obligation. Confirm the underlying course requirements before deleting it.

## 6. Explore the interactive week

The seven-day explorer is a modeled workload view, not a booked calendar. Select a day to see the tasks that contribute modeled effort to that day. This may differ from a list of deadlines because the load calculation distributes remaining effort across eligible days before each deadline.

An unfinished flexible task can be dragged from the planner onto a day. Dropping it immediately changes its recorded deadline to that date, saves the planner, and refreshes the forecast. The confirmation message offers one-level undo for the most recent change. Confirm that moving the recorded deadline is permitted and realistic; the interface cannot change the real course requirement.

## 7. Generate the weekly forecast

The forecast covers seven calendar days starting at the displayed reference date. It contains:

- a `low`, `moderate`, or `high` workload level;
- the probability assigned to each of the three levels;
- a zero-to-100 workload score derived from those probabilities;
- a day-by-day view of planned and available hours;
- up to three local counterfactual explanations;
- a preventive action plan generated by explicit rules.

### Read probabilities safely

The selected level is the class with the highest model probability. Close probabilities indicate an uncertain boundary. Even a high displayed confidence can be wrong because the model was trained on synthetic feature vectors.

The probabilities concern model classes only. They are not probabilities of stress, burnout, depression, illness, academic failure, or any personal outcome.

### Read the daily load

The daily view distributes modeled effort across days that are eligible before each deadline. It is a transparent scheduling approximation, not a calendar commitment. Use the day drilldown to inspect its contributing tasks, then compare the estimate with the actual constraints in your week.

## 8. Interpret explanations

An explanation first builds a lower-load reference across the model features. It then restores one feature to its current value while leaving the other features at their reference values and reports the change in estimated `high` probability.

For example, a statement that deadline concentration increased the estimate means:

- the current feature value was added back to a lower-load reference vector;
- the same model produced a different output for that artificial reference comparison;
- no causal relationship or guaranteed benefit was established.

Some derived features are related, so a safe-reference counterfactual may not describe a naturally occurring schedule. Individual impacts also do not add up to the full forecast. Treat each result as a model inspection aid.

If no candidate changes the `high` probability by at least 0.2 percentage points, the application returns a neutral explanation instead of ranking negligible effects.

## 9. Use the preventive action plan

Recommendations are deterministic and appear only when their documented trigger is active. Examples include reviewing overdue work, reducing a capacity mismatch, starting a deadline cluster earlier, protecting short exam review blocks, or limiting simultaneous top priorities.

Before accepting a suggestion, ask:

- Is the task actually flexible?
- Does another obligation make the change unrealistic?
- Would the change preserve rest, accessibility, and essential commitments?
- Do I need clarification or support from a person instead?

The application never changes the saved plan automatically.

## 10. Use Scenario Lab

Scenario Lab compares a temporary scenario with the current planner. You can change weekly capacity, choose an unfinished flexible task, and test a deadline shift. Select **Preview scenario** to request a comparison. Relevant range changes also refresh the preview automatically when the change is committed.

Every displayed delta is `simulated - baseline`. A negative workload-score delta means only that the model assigned a lower score to the temporary copy; it does not establish that the scenario is healthier, preferable, permitted, or likely to improve an academic outcome.

The scenario remains separate from the saved planner. **Apply this scenario** explicitly copies its supported changes into the planner and refreshes the forecast. **Reset** discards the temporary controls and result. Before applying a deadline shift, confirm the real course requirement and consider obligations that the application cannot observe.

## 11. Use Focus mode

Focus mode derives a small next-step sequence locally from open-task deadlines, remaining effort, and priority. Choosing a focus task moves that task to the front of the bounded sequence. This is planning support, not an optimized timetable or a judgment about health, ability, or academic importance.

Choose a task and an optional 15-, 25-, or 45-minute timer. Starting, pausing, or resetting the timer does not update task progress. The suggested sequence and timer state are ephemeral: they are not saved, scored, or sent for model training.

## 12. Use shortcuts and mobile navigation

Press `Ctrl+K` on Windows or Linux, or `Command+K` on macOS, to open the command palette. The following single-key shortcuts work when focus is not inside an editable control:

| Shortcut | Action                 |
| -------- | ---------------------- |
| `N`      | Open the new-task form |
| `F`      | Open Focus mode        |
| `R`      | Refresh the forecast   |
| `P`      | Go to the planner      |
| `/`      | Move to planner search |

Privacy and limitations remain available as a command-palette action without a single-key shortcut. Single-key shortcuts are suppressed while you type in an input, text area, select control, or other editable field. Visible controls provide the same core actions. On narrow screens, the mobile action dock links to the overview, interactive week, new-task form, planner, and Focus mode.

The interface respects the browser or operating system `prefers-reduced-motion` setting by suppressing nonessential reveal motion and shortening transitions. This support is not a claim of accessibility certification.

## 13. Demo mode

The built-in demo contains artificial courses and tasks generated relative to a reference date. It is safe to use for screenshots, presentations, tests, and first exploration. Loading a demo should not be confused with evidence that the model represents a real student population.

## 14. Manage local data

Tasks, weekly capacity, and planner search, sort, and filter preferences are stored in the browser's `localStorage` for the application origin. Scenario Lab drafts, the Focus sequence, and the Focus timer remain in browser memory unless a scenario is explicitly applied to the planner.

- They are not automatically synchronized to another browser or device.
- Private browsing may delete them when the session closes.
- Clearing site data can remove them permanently.
- Another person using the same unlocked browser profile may be able to inspect them.
- The application does not automatically use them for model training.

When the bundled web client requests analysis or simulation, task and course names remain in the browser. The client replaces them with neutral placeholders and sends structural fields such as task identifiers, type, deadline, estimated hours, progress, priority, flexibility, reference date, and weekly capacity. The server processes that request in memory. A person or program calling the API directly constructs its own payload and must decide what text to include.

Use the application's clear action when available, and review the confirmation carefully. If you need a backup, create one only through a feature that explicitly describes what is exported and where it goes.

## 15. When not to use the result

Do not use StudyBalance AI for diagnosis, crisis assessment, student ranking, grading, attendance enforcement, discipline, admissions, scholarship decisions, surveillance, or reporting a student to another person or institution.

If academic demands are affecting your health or safety, seek appropriate human support, such as a trusted person, a student support service, or a qualified professional. StudyBalance AI is not an emergency service.

## 16. Troubleshooting

### The page does not open

Confirm that Node.js 22 or newer is installed, `npm start` is still running, and the terminal shows the local address. Check whether another application is already using port `3000`.

### My tasks disappeared

Confirm that you are using the same browser, browser profile, origin, and non-private session. Browser cleanup may have removed local site data. The MVP has no server backup.

### The forecast did not change as expected

Confirm that the edited task is unfinished and relevant to the current window. The model uses several standardized features, so a single edit may have a small effect or may be offset by another schedule property.

### The server rejects a task

Check every required task field, use a valid `YYYY-MM-DD` date, keep progress from zero through 100, use a supported task type and priority, and ensure task identifiers are unique.
