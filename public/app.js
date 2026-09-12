const STORAGE_KEY = "study-balance-ai:schedule:v1";
const VIEW_STORAGE_KEY = "study-balance-ai:view:v1";
const DAY_IN_MS = 86_400_000;

const TYPE_LABELS = {
  assignment: "Assignment",
  exam: "Exam",
  project: "Project",
  reading: "Reading",
  other: "Other",
};

const RISK_COPY = {
  low: {
    label: "Low demand",
    message:
      "Your current schedule stays within the capacity and timing thresholds used by this prototype. Keep reviewing it as deadlines change.",
  },
  moderate: {
    label: "Moderate demand",
    message:
      "Your week has some pressure points relative to the study time you entered. Review where work is concentrating before deadlines.",
  },
  high: {
    label: "High demand",
    message:
      "Your plan concentrates more modeled academic work than the study time you entered. Review the planning options below.",
  },
};

const elements = {
  actionCount: document.querySelector("#action-count"),
  addTaskButton: document.querySelector("#add-task-button"),
  applySimulationButton: document.querySelector("#apply-simulation-button"),
  cancelTaskButton: document.querySelector("#cancel-task-button"),
  capacityInput: document.querySelector("#capacity-input"),
  chartCapacityLabel: document.querySelector("#chart-capacity-label"),
  clearDataButton: document.querySelector("#clear-data-button"),
  clearFiltersButton: document.querySelector("#clear-filters-button"),
  closeTaskDialog: document.querySelector("#close-task-dialog"),
  commandButton: document.querySelector("#command-button"),
  commandDialog: document.querySelector("#command-dialog"),
  commandList: document.querySelector("#command-list"),
  commandSearch: document.querySelector("#command-search"),
  dataBadge: document.querySelector("#data-badge"),
  emptyAddButton: document.querySelector("#empty-add-button"),
  emptyClearButton: document.querySelector("#empty-clear-button"),
  emptyDemoButton: document.querySelector("#empty-demo-button"),
  exportButton: document.querySelector("#export-button"),
  factorList: document.querySelector("#factor-list"),
  filterCountAll: document.querySelector("#filter-count-all"),
  filterCountHigh: document.querySelector("#filter-count-high"),
  filterCountOpen: document.querySelector("#filter-count-open"),
  filterCountWeek: document.querySelector("#filter-count-week"),
  focusButton: document.querySelector("#focus-button"),
  focusClock: document.querySelector("#focus-clock"),
  focusDialog: document.querySelector("#focus-dialog"),
  focusPlanList: document.querySelector("#focus-plan-list"),
  focusResetButton: document.querySelector("#focus-reset-button"),
  focusStartButton: document.querySelector("#focus-start-button"),
  focusTaskSelect: document.querySelector("#focus-task-select"),
  focusTime: document.querySelector("#focus-time"),
  footerPrivacyButton: document.querySelector("#footer-privacy-button"),
  forecastPeriod: document.querySelector("#forecast-period"),
  gaugeValue: document.querySelector("#gauge-value"),
  heroAnalyzeButton: document.querySelector("#hero-analyze-button"),
  loadChart: document.querySelector("#load-chart"),
  loadDemoButton: document.querySelector("#load-demo-button"),
  metricCapacity: document.querySelector("#metric-capacity"),
  metricCapacityCaption: document.querySelector("#metric-capacity-caption"),
  metricDueCaption: document.querySelector("#metric-due-caption"),
  metricDueWeek: document.querySelector("#metric-due-week"),
  metricHours: document.querySelector("#metric-hours"),
  metricHoursCaption: document.querySelector("#metric-hours-caption"),
  metricOpenCaption: document.querySelector("#metric-open-caption"),
  metricOpenTasks: document.querySelector("#metric-open-tasks"),
  mobileAddButton: document.querySelector("#mobile-add-button"),
  mobileFocusButton: document.querySelector("#mobile-focus-button"),
  privacyButton: document.querySelector("#privacy-button"),
  privacyDialog: document.querySelector("#privacy-dialog"),
  probabilityHigh: document.querySelector("#probability-high"),
  probabilityHighValue: document.querySelector("#probability-high-value"),
  probabilityLow: document.querySelector("#probability-low"),
  probabilityLowValue: document.querySelector("#probability-low-value"),
  probabilityModerate: document.querySelector("#probability-moderate"),
  probabilityModerateValue: document.querySelector("#probability-moderate-value"),
  progressOutput: document.querySelector("#progress-output"),
  recommendationList: document.querySelector("#recommendation-list"),
  refreshButton: document.querySelector("#refresh-button"),
  riskBadge: document.querySelector("#risk-badge"),
  riskGauge: document.querySelector("#risk-gauge"),
  riskInfoButton: document.querySelector("#risk-info-button"),
  scoreDialog: document.querySelector("#score-dialog"),
  riskMessage: document.querySelector("#risk-message"),
  riskPanel: document.querySelector("#risk-panel"),
  riskScore: document.querySelector("#risk-score"),
  confidenceLabel: document.querySelector("#confidence-label"),
  simulateButton: document.querySelector("#simulate-button"),
  simulationDeltas: document.querySelector("#simulation-deltas"),
  simulationAfter: document.querySelector("#simulation-after"),
  simulationBefore: document.querySelector("#simulation-before"),
  simulationDescription: document.querySelector("#simulation-description"),
  simulationPlaceholder: document.querySelector("#simulation-placeholder"),
  simulationResult: document.querySelector("#simulation-result"),
  plannerResultCount: document.querySelector("#planner-result-count"),
  previewScenarioButton: document.querySelector("#preview-scenario-button"),
  resetScenarioButton: document.querySelector("#reset-scenario-button"),
  scenarioCapacity: document.querySelector("#scenario-capacity"),
  scenarioCapacityOutput: document.querySelector("#scenario-capacity-output"),
  scenarioShift: document.querySelector("#scenario-shift"),
  scenarioShiftOutput: document.querySelector("#scenario-shift-output"),
  scenarioTaskSelect: document.querySelector("#scenario-task-select"),
  selectedDayLabel: document.querySelector("#selected-day-label"),
  selectedDaySummary: document.querySelector("#selected-day-summary"),
  selectedDayTasks: document.querySelector("#selected-day-tasks"),
  taskDeadline: document.querySelector("#task-deadline"),
  taskDialog: document.querySelector("#task-dialog"),
  taskDialogTitle: document.querySelector("#task-dialog-title"),
  taskEmpty: document.querySelector("#task-empty"),
  taskFlexible: document.querySelector("#task-flexible"),
  taskForm: document.querySelector("#task-form"),
  taskHours: document.querySelector("#task-hours"),
  taskId: document.querySelector("#task-id"),
  taskList: document.querySelector("#task-list"),
  taskPriority: document.querySelector("#task-priority"),
  taskProgress: document.querySelector("#task-progress"),
  taskSubject: document.querySelector("#task-subject"),
  taskTitle: document.querySelector("#task-title"),
  taskType: document.querySelector("#task-type"),
  taskSearch: document.querySelector("#task-search"),
  taskSearchClear: document.querySelector("#task-search-clear"),
  taskSort: document.querySelector("#task-sort"),
  toastRegion: document.querySelector("#toast-region"),
  updateList: document.querySelector("#update-list"),
  weekDayGrid: document.querySelector("#week-day-grid"),
};

const APP_UPDATES = [
  {
    version: "v1.2",
    date: "2026-09-12",
    title: "Daily release: UI polish and app changelog",
    items: [
      "Added a new app log section to document the improvements made today.",
      "Improved the page structure and visual hierarchy to make updates easier to follow.",
      "Polished the layout with clearer spacing, cards, and consistency across sections.",
      "Prepared the interface for future version tracking and release-style notes.",
    ],
  },
];

const state = {
  analysis: null,
  analysisController: null,
  analysisSequence: 0,
  analysisStatus: "idle",
  analysisStale: false,
  demoMode: true,
  filter: "open",
  focus: {
    durationSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    intervalId: null,
    running: false,
  },
  referenceDate: todayISO(),
  search: "",
  selectedDate: null,
  simulation: null,
  simulationController: null,
  simulationSequence: 0,
  sort: "deadline",
  tasks: [],
  undoSnapshot: null,
  weeklyAvailableHours: 18,
};

function todayISO() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(date) {
  return new Date(`${date}T12:00:00.000Z`);
}

function addDays(date, amount) {
  return new Date(parseDate(date).getTime() + amount * DAY_IN_MS).toISOString().slice(0, 10);
}

function daysBetween(first, second) {
  return Math.round((parseDate(first).getTime() - parseDate(second).getTime()) / DAY_IN_MS);
}

function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    ...options,
  }).format(parseDate(date));
}

function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
}

function titleCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeTaskId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function structuralTask(task) {
  return {
    id: task.id,
    title: "Private task",
    subject: "Private course",
    type: task.type,
    deadline: task.deadline,
    estimatedHours: task.estimatedHours,
    progress: task.progress,
    priority: task.priority,
    flexible: task.flexible,
  };
}

function structuralAdjustments(adjustments) {
  if (!adjustments) return undefined;
  return {
    ...adjustments,
    taskUpdates: adjustments.taskUpdates?.map((task) => structuralTask(task)),
  };
}

function currentPayload(extra = {}) {
  return {
    tasks: state.tasks.map(structuralTask),
    weeklyAvailableHours: state.weeklyAvailableHours,
    referenceDate: state.referenceDate,
    ...extra,
    ...(extra.adjustments ? { adjustments: structuralAdjustments(extra.adjustments) } : {}),
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed with status ${response.status}.`);
  return body;
}

function saveLocalState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      demoMode: state.demoMode,
      tasks: state.tasks,
      weeklyAvailableHours: state.weeklyAvailableHours,
    }),
  );
  localStorage.setItem(
    VIEW_STORAGE_KEY,
    JSON.stringify({
      filter: state.filter,
      search: state.search,
      sort: state.sort,
    }),
  );
}

function clonePlannerState() {
  return {
    demoMode: state.demoMode,
    tasks: structuredClone(state.tasks),
    weeklyAvailableHours: state.weeklyAvailableHours,
  };
}

function captureUndo(label) {
  state.undoSnapshot = { label, value: clonePlannerState() };
}

async function undoLastChange() {
  if (!state.undoSnapshot) return;
  const snapshot = state.undoSnapshot;
  state.undoSnapshot = null;
  state.tasks = snapshot.value.tasks;
  state.weeklyAvailableHours = snapshot.value.weeklyAvailableHours;
  state.demoMode = snapshot.value.demoMode;
  state.simulation = null;
  saveLocalState();
  resetScenario();
  renderLocalState();
  await analyzeSchedule();
  showToast(`${snapshot.label} was undone.`);
}

function isStoredTaskValid(task) {
  return (
    task &&
    typeof task === "object" &&
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.subject === "string" &&
    Object.hasOwn(TYPE_LABELS, task.type) &&
    /^\d{4}-\d{2}-\d{2}$/.test(task.deadline) &&
    Number.isFinite(task.estimatedHours) &&
    task.estimatedHours >= 0 &&
    Number.isFinite(task.progress) &&
    task.progress >= 0 &&
    task.progress <= 100 &&
    ["low", "medium", "high"].includes(task.priority) &&
    typeof task.flexible === "boolean"
  );
}

function restoreLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      !saved ||
      !Array.isArray(saved.tasks) ||
      saved.tasks.some((task) => !isStoredTaskValid(task))
    )
      return false;
    const hours = Number(saved.weeklyAvailableHours);
    state.tasks = saved.tasks;
    state.weeklyAvailableHours = Number.isFinite(hours) && hours > 0 ? hours : 18;
    state.demoMode = Boolean(saved.demoMode);
    const view = JSON.parse(localStorage.getItem(VIEW_STORAGE_KEY) ?? "null");
    if (view && typeof view === "object") {
      if (["open", "week", "high", "all"].includes(view.filter)) state.filter = view.filter;
      if (["deadline", "priority", "effort", "progress"].includes(view.sort))
        state.sort = view.sort;
      if (typeof view.search === "string") state.search = view.search.slice(0, 80);
    }
    return true;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

function showToast(message, type = "success", action = null) {
  if (action)
    elements.toastRegion
      .querySelectorAll(".toast-action")
      .forEach((button) => button.closest(".toast")?.remove());
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon(type === "error" ? "info" : "check")}</span><div></div>`;
  toast.querySelector("div").textContent = message;
  if (action) {
    const button = document.createElement("button");
    button.className = "toast-action";
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", async () => {
      toast.remove();
      await action.callback();
    });
    toast.append(button);
  }
  elements.toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), action ? 30_000 : 4_000);
}

function setButtonBusy(button, busy, busyLabel) {
  if (!button.dataset.label) button.dataset.label = button.innerHTML;
  button.disabled = busy;
  button.innerHTML = busy ? `${icon("refresh")} ${busyLabel}` : button.dataset.label;
}

async function analyzeSchedule({ announce = false } = {}) {
  state.analysisController?.abort();
  const controller = new AbortController();
  const sequence = ++state.analysisSequence;
  state.analysisController = controller;
  state.analysisStatus = "pending";
  state.analysisStale = true;
  document.body.classList.add("analysis-pending", "analysis-stale");
  document.body.classList.remove("analysis-error");
  document
    .querySelectorAll(".week-day-card, .load-day, .recommendation-action")
    .forEach((button) => {
      button.disabled = true;
    });
  renderDataBadge();
  renderMetrics();
  setButtonBusy(elements.refreshButton, true, "Analyzing…");
  try {
    const analysis = await fetchJson("/api/analyze", {
      method: "POST",
      body: JSON.stringify(currentPayload()),
      signal: controller.signal,
    });
    if (sequence !== state.analysisSequence) return false;
    state.analysis = analysis;
    state.analysisStatus = "idle";
    state.analysisStale = false;
    renderAll();
    if (announce) showToast("Your workload forecast has been updated.");
    return true;
  } catch (error) {
    if (error.name === "AbortError") return false;
    console.error(error);
    state.analysisStatus = "error";
    showToast(
      state.analysis
        ? "Forecast update failed. The previous forecast remains visible but inactive."
        : error.message,
      "error",
    );
    renderLocalState();
    renderWeekExplorer();
    renderLoadChart();
    renderRecommendations();
    return false;
  } finally {
    if (sequence === state.analysisSequence) {
      document.body.classList.remove("analysis-pending");
      document.body.classList.toggle("analysis-stale", state.analysisStale);
      document.body.classList.toggle("analysis-error", state.analysisStatus === "error");
      setButtonBusy(elements.refreshButton, false, "Analyzing…");
    }
  }
}

async function loadDemo({ announce = true } = {}) {
  if (announce && !state.demoMode && state.tasks.length > 0) {
    const confirmed = window.confirm(
      "Replace your current local planner with artificial sample data? You can undo this change from the confirmation message.",
    );
    if (!confirmed) return;
  }
  setButtonBusy(elements.loadDemoButton, true, "Loading…");
  try {
    const demo = await fetchJson(
      `/api/demo?referenceDate=${encodeURIComponent(state.referenceDate)}`,
    );
    const canUndo = state.tasks.length > 0;
    if (canUndo) captureUndo("Loading sample data");
    else state.undoSnapshot = null;
    state.tasks = demo.tasks;
    state.weeklyAvailableHours = demo.weeklyAvailableHours;
    state.demoMode = true;
    resetScenario();
    saveLocalState();
    renderLocalState();
    await analyzeSchedule();
    if (announce)
      showToast(
        "Artificial sample schedule loaded.",
        "success",
        canUndo ? { label: "Undo", callback: undoLastChange } : null,
      );
  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  } finally {
    setButtonBusy(elements.loadDemoButton, false, "Loading…");
  }
}

function renderAll() {
  renderLocalState();
  renderRisk();
  renderWeekExplorer();
  renderLoadChart();
  renderFactors();
  renderRecommendations();
  renderSimulation();
}

function renderUpdates() {
  if (!elements.updateList) return;

  elements.updateList.innerHTML = APP_UPDATES.map(
    (update) => `
      <article class="update-card">
        <div class="update-topline">
          <span class="update-version">${escapeHtml(update.version)}</span>
          <span class="update-date">${escapeHtml(update.date)}</span>
        </div>
        <h3>${escapeHtml(update.title)}</h3>
        <ul>
          ${update.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
    `,
  ).join("");
}

function renderLocalState() {
  elements.capacityInput.value = state.weeklyAvailableHours;
  renderPeriod();
  renderDataBadge();
  renderMetrics();
  renderTasks();
  renderScenarioOptions();
  renderFocusPlan();
}

function renderPeriod() {
  const endDate = addDays(state.referenceDate, 6);
  elements.forecastPeriod.textContent = `${formatDate(state.referenceDate, { weekday: "long" })} through ${formatDate(endDate, { weekday: "long", year: "numeric" })}.`;
}

function renderDataBadge() {
  const source = state.demoMode ? "Sample data" : "Your local data";
  const status =
    state.analysisStatus === "pending"
      ? " · refreshing forecast"
      : state.analysisStatus === "error"
        ? " · update failed"
        : "";
  elements.dataBadge.textContent = `${source}${status}`;
  elements.dataBadge.classList.toggle("personal", !state.demoMode);
}

function remainingHours(task) {
  return task.estimatedHours * (1 - task.progress / 100);
}

function renderMetrics() {
  const openTasks = state.tasks.filter((task) => task.progress < 100);
  const dueThisWeek = openTasks.filter((task) => {
    const days = daysBetween(task.deadline, state.referenceDate);
    return days >= 0 && days <= 6;
  });
  const hours = openTasks.reduce((sum, task) => sum + remainingHours(task), 0);
  const loadRatio = state.analysis?.features?.loadRatio ?? 0;

  elements.metricOpenTasks.textContent = openTasks.length;
  elements.metricOpenCaption.textContent =
    openTasks.length === 1 ? "task in your planner" : "tasks in your planner";
  elements.metricDueWeek.textContent = dueThisWeek.length;
  elements.metricDueCaption.textContent =
    dueThisWeek.length === 1 ? "deadline in 7 days" : "deadlines in 7 days";
  elements.metricHours.textContent = `${formatNumber(hours)} h`;
  elements.metricHoursCaption.textContent = "across open tasks";
  if (state.analysisStale) {
    elements.metricCapacity.textContent = "—";
    elements.metricCapacityCaption.textContent =
      state.analysisStatus === "error" ? "forecast update failed" : "forecast refreshing";
  } else {
    elements.metricCapacity.textContent = `${Math.round(loadRatio * 100)}%`;
    elements.metricCapacityCaption.textContent =
      loadRatio > 1 ? "above weekly capacity" : "of weekly capacity";
  }
}

function renderRisk() {
  if (!state.analysis) return;
  const { risk } = state.analysis;
  const copy = RISK_COPY[risk.level] ?? RISK_COPY.moderate;
  elements.riskPanel.classList.remove("risk-low", "risk-moderate", "risk-high");
  elements.riskPanel.classList.add(`risk-${risk.level}`);
  elements.riskScore.textContent = risk.score;
  elements.riskGauge.setAttribute("aria-valuenow", String(risk.score));
  elements.riskGauge.setAttribute("aria-valuetext", `${risk.score} out of 100, ${copy.label}`);
  elements.gaugeValue.setAttribute("stroke-dashoffset", String(100 - risk.score));
  elements.riskBadge.textContent = copy.label;
  elements.riskMessage.textContent = copy.message;
  elements.confidenceLabel.textContent = `${Math.round(risk.confidence * 100)}% confidence in the predicted class · synthetic model`;

  for (const level of ["low", "moderate", "high"]) {
    const percentage = Math.round((risk.probabilities[level] ?? 0) * 100);
    elements[`probability${titleCase(level)}`].value = percentage;
    elements[`probability${titleCase(level)}`].setAttribute(
      "aria-label",
      `${titleCase(level)} demand probability: ${percentage}%`,
    );
    elements[`probability${titleCase(level)}Value`].textContent = `${percentage}%`;
  }
}

function renderLoadChart() {
  elements.loadChart.replaceChildren();
  const days = state.analysis?.dailyLoad ?? [];
  const maximum =
    Math.max(1, ...days.flatMap((day) => [day.plannedHours, day.availableHours])) * 1.15;
  for (const [index, day] of days.entries()) {
    const container = document.createElement("button");
    container.type = "button";
    container.className = "load-day";
    container.dataset.date = day.date;
    container.disabled = state.analysisStale;
    if (index === 0) container.classList.add("today");
    if (day.plannedHours > day.availableHours) container.classList.add("over-capacity");
    if (day.date === state.selectedDate) container.classList.add("selected");
    container.setAttribute("aria-pressed", String(day.date === state.selectedDate));
    container.addEventListener("click", () => selectDay(day.date, { focusOrigin: "chart" }));

    const hours = document.createElement("span");
    hours.className = "load-day-value";
    hours.textContent = `${formatNumber(day.plannedHours)}h`;
    const bar = document.createElement("progress");
    bar.max = maximum;
    bar.value = day.plannedHours;
    bar.setAttribute(
      "aria-label",
      `${formatDate(day.date, { weekday: "long" })}: ${formatNumber(day.plannedHours)} planned hours`,
    );
    const label = document.createElement("span");
    label.className = "load-day-label";
    label.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "UTC",
    }).format(parseDate(day.date));
    container.append(hours, bar, label);
    elements.loadChart.append(container);
  }
  elements.chartCapacityLabel.textContent = `Daily guide: ${formatNumber(state.weeklyAvailableHours / 7)} h`;
}

function renderWeekExplorer() {
  const days = state.analysis?.dailyLoad ?? [];
  elements.weekDayGrid.replaceChildren();
  if (days.length === 0) return;
  if (!days.some((day) => day.date === state.selectedDate)) state.selectedDate = days[0].date;

  for (const [index, day] of days.entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "week-day-card";
    button.dataset.date = day.date;
    button.disabled = state.analysisStale;
    button.setAttribute("aria-pressed", String(day.date === state.selectedDate));
    if (day.plannedHours > day.availableHours) button.classList.add("over-capacity");
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
      parseDate(day.date),
    );
    const status =
      day.plannedHours > day.availableHours ? "Above daily guide" : "Within daily guide";
    const barMaximum = Math.max(1, day.availableHours * 1.5, day.plannedHours);
    button.setAttribute(
      "aria-label",
      `${formatDate(day.date, { weekday: "long" })}: ${formatNumber(day.plannedHours)} modeled hours across ${day.taskCount} tasks. ${status}.`,
    );
    button.innerHTML = `
      <span class="week-day-top"><span>${index === 0 ? "Today" : escapeHtml(weekday)}</span><strong>${escapeHtml(formatDate(day.date))}</strong></span>
      <span class="week-day-load"><strong>${formatNumber(day.plannedHours)}h</strong><small>of ${formatNumber(day.availableHours)}h</small></span>
      <progress class="week-capacity-track" max="${barMaximum}" value="${day.plannedHours}" aria-hidden="true"></progress>
      <span class="week-day-footer"><span>${day.taskCount} ${day.taskCount === 1 ? "task" : "tasks"}</span><span class="week-day-status">${status}</span></span>
    `;
    button.addEventListener("click", () => selectDay(day.date, { focusOrigin: "week" }));
    button.addEventListener("dragover", (event) => {
      const task = state.tasks.find((candidate) => candidate.id === state.draggedTaskId);
      if (!task?.flexible) return;
      event.preventDefault();
      button.classList.add("drop-ready");
    });
    button.addEventListener("dragleave", () => button.classList.remove("drop-ready"));
    button.addEventListener("drop", async (event) => {
      event.preventDefault();
      button.classList.remove("drop-ready");
      await rescheduleDraggedTask(day.date);
    });
    elements.weekDayGrid.append(button);
  }
  renderDayDrilldown();
}

function selectDay(date, { revealPlanner = false, focusOrigin = null } = {}) {
  state.selectedDate = date;
  renderWeekExplorer();
  renderLoadChart();
  if (focusOrigin) {
    const selector =
      focusOrigin === "chart"
        ? `.load-day[data-date="${CSS.escape(date)}"]`
        : `.week-day-card[data-date="${CSS.escape(date)}"]`;
    document.querySelector(selector)?.focus({ preventScroll: true });
  }
  if (revealPlanner) document.querySelector("#planner").scrollIntoView({ behavior: "smooth" });
}

function renderDayDrilldown() {
  const day = state.analysis?.dailyLoad?.find((candidate) => candidate.date === state.selectedDate);
  elements.selectedDayTasks.replaceChildren();
  if (!day) return;
  elements.selectedDayLabel.textContent = formatDate(day.date, {
    weekday: "long",
    year: "numeric",
  });
  elements.selectedDaySummary.textContent = `${formatNumber(day.plannedHours)} modeled hours across ${day.taskCount} ${day.taskCount === 1 ? "task" : "tasks"}; daily guide ${formatNumber(day.availableHours)} hours.`;
  const tasks = day.taskIds.map((id) => state.tasks.find((task) => task.id === id)).filter(Boolean);
  if (tasks.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-inline";
    empty.textContent = "No task contributes modeled effort to this day.";
    elements.selectedDayTasks.append(empty);
    return;
  }
  for (const task of tasks) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "day-task-chip";
    chip.innerHTML = `<i></i><span>${escapeHtml(task.title)}</span>`;
    chip.addEventListener("click", () => focusTasks([task.id]));
    elements.selectedDayTasks.append(chip);
  }
}

async function rescheduleDraggedTask(date) {
  const task = state.tasks.find((candidate) => candidate.id === state.draggedTaskId);
  state.draggedTaskId = null;
  if (!task || !task.flexible || task.deadline === date) return;
  captureUndo("Rescheduling the task");
  task.deadline = date;
  state.demoMode = false;
  resetScenario();
  saveLocalState();
  renderLocalState();
  await analyzeSchedule();
  showToast(`“${task.title}” moved to ${formatDate(date)}.`, "success", {
    label: "Undo",
    callback: undoLastChange,
  });
}

function renderFactors() {
  elements.factorList.replaceChildren();
  const factors = state.analysis?.explanations ?? [];
  if (factors.length === 0) {
    elements.factorList.innerHTML =
      '<div class="empty-inline">No material factor changed the estimate.</div>';
    return;
  }

  for (const [index, factor] of factors.entries()) {
    const item = document.createElement("div");
    item.className = "factor-item";
    const impact = Number(factor.impactPoints ?? 0);
    const sign = impact > 0 ? "+" : "";
    item.innerHTML = `
      <span class="factor-rank">0${index + 1}</span>
      <div class="factor-copy"><strong>${escapeHtml(titleCase(factor.label))}</strong><small>${escapeHtml(factor.message)}</small></div>
      <span class="impact-pill ${impact < 0 ? "protective" : ""}">${sign}${impact} pp</span>
    `;
    elements.factorList.append(item);
  }
}

function renderRecommendations() {
  elements.recommendationList.replaceChildren();
  const recommendations = state.analysis?.recommendations ?? [];
  elements.actionCount.textContent = `${recommendations.length} ${recommendations.length === 1 ? "action" : "actions"}`;
  if (recommendations.length === 0) {
    elements.recommendationList.innerHTML =
      '<div class="empty-inline">No planning action is needed yet.</div>';
    return;
  }

  for (const recommendation of recommendations) {
    const item = document.createElement("div");
    item.className = "recommendation-item";
    const relatedCount = recommendation.relatedTaskIds?.length ?? 0;
    const actionLabel =
      relatedCount > 0
        ? `Review ${relatedCount} ${relatedCount === 1 ? "task" : "tasks"}`
        : "Open scenario lab";
    item.innerHTML = `
      <span class="recommendation-check">${icon("arrow")}</span>
      <div class="recommendation-copy">
        <span class="${escapeHtml(recommendation.priority)}">${escapeHtml(recommendation.priority)} priority</span>
        <strong>${escapeHtml(recommendation.title)}</strong>
        <small>${escapeHtml(recommendation.action ?? recommendation.message)}</small>
        <button class="recommendation-action" type="button">${escapeHtml(actionLabel)} ${icon("arrow")}</button>
      </div>
    `;
    item.querySelector(".recommendation-action").addEventListener("click", () => {
      if (relatedCount > 0) focusTasks(recommendation.relatedTaskIds);
      else document.querySelector("#simulator").scrollIntoView({ behavior: "smooth" });
    });
    item.querySelector(".recommendation-action").disabled = state.analysisStale;
    elements.recommendationList.append(item);
  }
}

function updateFilterButtons() {
  for (const button of document.querySelectorAll(".filter-button")) {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function focusTasks(taskIds) {
  state.filter = "all";
  state.search = "";
  elements.taskSearch.value = "";
  saveLocalState();
  updateFilterButtons();
  renderTasks();
  document.querySelector("#planner").scrollIntoView({ behavior: "smooth" });
  window.setTimeout(() => {
    const matchedCards = taskIds
      .map((id) => document.querySelector(`[data-task-id="${CSS.escape(id)}"]`))
      .filter(Boolean);
    for (const card of matchedCards) card.classList.add("attention");
    if (matchedCards[0]) {
      matchedCards[0].tabIndex = -1;
      matchedCards[0].focus({ preventScroll: true });
    }
    showToast(
      `${matchedCards.length} related ${matchedCards.length === 1 ? "task is" : "tasks are"} shown in the planner.`,
    );
    window.setTimeout(
      () =>
        document
          .querySelectorAll(".task-card.attention")
          .forEach((card) => card.classList.remove("attention")),
      2_500,
    );
  }, 450);
}

function filteredTasks() {
  const query = state.search.trim().toLocaleLowerCase("en-US");
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return state.tasks
    .filter((task) => {
      if (state.filter === "open") return task.progress < 100;
      if (state.filter === "week") {
        const days = daysBetween(task.deadline, state.referenceDate);
        return task.progress < 100 && days >= 0 && days <= 6;
      }
      if (state.filter === "high") return task.progress < 100 && task.priority === "high";
      return true;
    })
    .filter(
      (task) =>
        !query ||
        `${task.title} ${task.subject} ${TYPE_LABELS[task.type]}`
          .toLocaleLowerCase("en-US")
          .includes(query),
    )
    .sort((first, second) => {
      if (first.progress >= 100 !== second.progress >= 100) return first.progress >= 100 ? 1 : -1;
      if (state.sort === "priority")
        return (
          priorityOrder[first.priority] - priorityOrder[second.priority] ||
          first.deadline.localeCompare(second.deadline)
        );
      if (state.sort === "effort")
        return (
          remainingHours(second) - remainingHours(first) ||
          first.deadline.localeCompare(second.deadline)
        );
      if (state.sort === "progress")
        return first.progress - second.progress || first.deadline.localeCompare(second.deadline);
      return first.deadline.localeCompare(second.deadline);
    });
}

function deadlineDescription(task) {
  const days = daysBetween(task.deadline, state.referenceDate);
  if (task.progress >= 100) return "Completed";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

function renderTasks() {
  elements.taskList.replaceChildren();
  const tasks = filteredTasks();
  const openTasks = state.tasks.filter((task) => task.progress < 100);
  const weekTasks = openTasks.filter((task) => {
    const days = daysBetween(task.deadline, state.referenceDate);
    return days >= 0 && days <= 6;
  });
  elements.filterCountOpen.textContent = openTasks.length;
  elements.filterCountWeek.textContent = weekTasks.length;
  elements.filterCountHigh.textContent = openTasks.filter(
    (task) => task.priority === "high",
  ).length;
  elements.filterCountAll.textContent = state.tasks.length;

  const summaryParts = [];
  if (state.search.trim()) summaryParts.push(`search: “${state.search.trim()}”`);
  if (state.filter === "week") summaryParts.push("due this week");
  else if (state.filter === "high") summaryParts.push("high priority");
  else if (state.filter === "all") summaryParts.push("all tasks");

  elements.plannerResultCount.textContent = summaryParts.length
    ? `${tasks.length} ${tasks.length === 1 ? "result" : "results"} · ${summaryParts.join(" · ")}`
    : `${tasks.length} ${tasks.length === 1 ? "result" : "results"}`;

  elements.taskEmpty.classList.toggle("hidden", tasks.length > 0);
  elements.taskList.classList.toggle("hidden", tasks.length === 0);
  elements.taskSearchClear.classList.toggle("hidden", !state.search.trim());
  elements.clearFiltersButton.innerHTML = state.search.trim()
    ? `${icon("refresh")} <span>Clear search</span>`
    : state.filter === "all"
      ? `${icon("refresh")} <span>Show open tasks</span>`
      : `${icon("refresh")} <span>Clear filters</span>`;
  elements.clearFiltersButton.classList.toggle(
    "hidden",
    !(state.search.trim() || state.filter !== "open"),
  );
  elements.exportButton.disabled = state.tasks.length === 0;
  if (tasks.length === 0) {
    const hasPlannerTasks = state.tasks.length > 0;
    const allTasksCompleted = hasPlannerTasks && state.tasks.every((task) => task.progress >= 100);
    const hasActiveFilters = Boolean(state.search.trim()) || state.filter !== "open";
    const query = state.search.trim();

    elements.emptyClearButton.innerHTML = allTasksCompleted
      ? `${icon("eye")} <span>Show all tasks</span>`
      : query
        ? `${icon("refresh")} <span>Clear search</span>`
        : `${icon("refresh")} <span>Clear filters</span>`;

    elements.taskEmpty.querySelector("h3").textContent = !hasPlannerTasks
      ? "Your planner is ready"
      : allTasksCompleted
        ? "Everything is completed"
        : query
          ? "No tasks match your search"
          : state.filter === "week"
            ? "No tasks are due this week"
            : state.filter === "high"
              ? "No open high-priority tasks"
              : "No tasks match this view";

    elements.taskEmpty.querySelector("p").textContent = !hasPlannerTasks
      ? "Add a deadline, exam, or study task to build your first workload forecast."
      : allTasksCompleted
        ? "Add a new task or reopen one to keep planning the week."
        : query
          ? `No task title, subject, or type includes “${query}”.`
          : state.filter === "week"
            ? "Try another filter or add a task with a deadline in the next 7 days."
            : state.filter === "high"
              ? "Try another filter or mark a task as open with high priority."
              : hasActiveFilters
                ? "Try another filter or clear the search to see more tasks."
                : "Add a new task or load sample data to continue planning.";

    elements.emptyAddButton.innerHTML = !hasPlannerTasks
      ? `${icon("plus")} <span>Add your first task</span>`
      : `${icon("plus")} <span>Add another task</span>`;
    elements.emptyAddButton.classList.toggle("hidden", !(!hasPlannerTasks || allTasksCompleted));
    elements.emptyClearButton.classList.toggle("hidden", !hasPlannerTasks);
    elements.emptyDemoButton.classList.toggle("hidden", !(!hasPlannerTasks || allTasksCompleted));
  }

  for (const task of tasks) {
    const item = document.createElement("article");
    item.className = `task-card ${task.progress >= 100 ? "completed" : ""}`;
    item.dataset.taskId = task.id;
    item.draggable = task.flexible && task.progress < 100;
    if (item.draggable) item.title = "Drag this flexible task onto a day in the interactive week.";
    item.innerHTML = `
      <button class="task-complete" data-action="complete" type="button" aria-label="${task.progress >= 100 ? "Reopen" : "Complete"} ${escapeHtml(task.title)}">${icon("check")}</button>
      <div class="task-main"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.subject)}</small><span class="task-mobile-meta">${escapeHtml(formatDate(task.deadline))} · ${formatNumber(remainingHours(task))} h left · ${escapeHtml(task.priority)} priority</span><label class="inline-progress"><span class="sr-only">Progress for ${escapeHtml(task.title)}</span><input type="range" min="0" max="100" step="5" value="${task.progress}" data-progress-id="${escapeHtml(task.id)}"><output>${Math.round(task.progress)}%</output></label></div>
      <div class="task-meta"><span class="task-type ${escapeHtml(task.type)}">${escapeHtml(TYPE_LABELS[task.type] ?? "Other")}</span><small class="priority-dot ${escapeHtml(task.priority)}">${escapeHtml(task.priority)}</small></div>
      <div class="task-deadline"><span>${escapeHtml(formatDate(task.deadline))}</span><small>${escapeHtml(deadlineDescription(task))}</small></div>
      <div class="task-hours"><span>${formatNumber(remainingHours(task))} h left</span><small>${formatNumber(task.estimatedHours)} h estimated</small></div>
      <div class="task-actions"><button class="icon-button" data-action="edit" type="button" aria-label="Edit ${escapeHtml(task.title)}">${icon("edit")}</button><button class="icon-button" data-action="delete" type="button" aria-label="Delete ${escapeHtml(task.title)}">${icon("trash")}</button></div>
    `;
    const progressControl = item.querySelector("[data-progress-id]");
    progressControl.addEventListener("input", () => {
      progressControl.nextElementSibling.textContent = `${progressControl.value}%`;
    });
    progressControl.addEventListener("change", async () => {
      const taskId = task.id;
      captureUndo("Updating task progress");
      const previousProgress = task.progress;
      task.progress = Number(progressControl.value);
      if (task.progress >= 100 && previousProgress < 100) task.previousProgress = previousProgress;
      if (task.progress < 100) delete task.previousProgress;
      state.demoMode = false;
      resetScenario();
      saveLocalState();
      await analyzeSchedule();
      const restoredControl = document.querySelector(`[data-progress-id="${CSS.escape(taskId)}"]`);
      if (restoredControl) restoredControl.focus({ preventScroll: true });
      else elements.taskSearch.focus({ preventScroll: true });
      showToast(`Progress updated to ${task.progress}%.`, "success", {
        label: "Undo",
        callback: undoLastChange,
      });
    });
    item.addEventListener("dragstart", () => {
      state.draggedTaskId = task.id;
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => {
      state.draggedTaskId = null;
      item.classList.remove("dragging");
      document
        .querySelectorAll(".drop-ready")
        .forEach((target) => target.classList.remove("drop-ready"));
    });
    elements.taskList.append(item);
  }
}

function renderSimulation() {
  const hasSimulation = Boolean(state.simulation);
  elements.simulationPlaceholder.classList.toggle("hidden", hasSimulation);
  elements.simulationResult.classList.toggle("hidden", !hasSimulation);
  if (!hasSimulation) {
    elements.applySimulationButton.disabled = true;
    return;
  }
  elements.simulationBefore.textContent = state.simulation.response.baseline.risk.score;
  elements.simulationAfter.textContent = state.simulation.response.simulated.risk.score;
  elements.simulationDescription.textContent = state.simulation.description;
  const comparison = state.simulation.response.comparison;
  const signed = (value, suffix = "") =>
    `${value > 0 ? "+" : ""}${formatNumber(value, 2)}${suffix}`;
  elements.simulationDeltas.innerHTML = `
    <div class="simulation-delta"><span>Score change</span><strong>${signed(comparison.riskScoreDelta)}</strong></div>
    <div class="simulation-delta"><span>Peak day</span><strong>${signed(comparison.peakDailyHoursDelta, "h")}</strong></div>
    <div class="simulation-delta"><span>Load ratio</span><strong>${signed(comparison.loadRatioDelta)}</strong></div>
  `;
  elements.applySimulationButton.disabled = !state.simulation.hasChange;
  elements.applySimulationButton.textContent = state.simulation.hasChange
    ? "Apply this scenario"
    : "Adjust a control to apply";
}

function renderScenarioOptions() {
  const selectedId = elements.scenarioTaskSelect.value;
  const tasks = state.tasks
    .filter((task) => task.progress < 100 && task.flexible && task.type !== "exam")
    .sort((first, second) => first.deadline.localeCompare(second.deadline));
  elements.scenarioTaskSelect.replaceChildren(new Option("Capacity only", ""));
  for (const task of tasks)
    elements.scenarioTaskSelect.add(
      new Option(`${task.title} · ${formatDate(task.deadline)}`, task.id),
    );
  if (tasks.some((task) => task.id === selectedId)) elements.scenarioTaskSelect.value = selectedId;
  elements.scenarioCapacity.max = String(
    Math.min(168, Math.max(60, Math.ceil(state.weeklyAvailableHours * 2))),
  );
  if (!elements.scenarioCapacity.dataset.initialized) {
    elements.scenarioCapacity.value = state.weeklyAvailableHours;
    elements.scenarioCapacity.dataset.initialized = "true";
  }
  elements.scenarioCapacityOutput.textContent = `${elements.scenarioCapacity.value} h`;
  elements.scenarioShift.disabled = !elements.scenarioTaskSelect.value;
  elements.scenarioShiftOutput.textContent = `+${elements.scenarioShift.value} days`;
}

function openTaskDialog(task = null) {
  elements.taskForm.reset();
  elements.taskId.value = task?.id ?? "";
  elements.taskDialogTitle.textContent = task ? "Edit academic task" : "Add an academic task";
  elements.taskTitle.value = task?.title ?? "";
  elements.taskSubject.value = task?.subject ?? "";
  elements.taskType.value = task?.type ?? "assignment";
  elements.taskDeadline.value = task?.deadline ?? addDays(state.referenceDate, 7);
  elements.taskHours.value = task?.estimatedHours ?? 2;
  elements.taskProgress.value = task?.progress ?? 0;
  elements.progressOutput.textContent = `${task?.progress ?? 0}%`;
  elements.taskPriority.value = task?.priority ?? "medium";
  elements.taskFlexible.checked = task?.flexible ?? true;
  elements.taskDialog.showModal();
  window.setTimeout(() => elements.taskTitle.focus(), 0);
}

async function saveTask(event) {
  event.preventDefault();
  const task = {
    id: elements.taskId.value || makeTaskId(),
    title: elements.taskTitle.value.trim(),
    subject: elements.taskSubject.value.trim(),
    type: elements.taskType.value,
    deadline: elements.taskDeadline.value,
    estimatedHours: Number(elements.taskHours.value),
    progress: Number(elements.taskProgress.value),
    priority: elements.taskPriority.value,
    flexible: elements.taskFlexible.checked,
  };
  const existingIndex = state.tasks.findIndex((candidate) => candidate.id === task.id);
  captureUndo(existingIndex >= 0 ? "Editing the task" : "Adding the task");
  if (existingIndex >= 0) state.tasks.splice(existingIndex, 1, task);
  else state.tasks.push(task);
  state.demoMode = false;
  resetScenario();
  saveLocalState();
  elements.taskDialog.close();
  renderLocalState();
  await analyzeSchedule();
  showToast(existingIndex >= 0 ? "Task updated." : "Task added to your planner.", "success", {
    label: "Undo",
    callback: undoLastChange,
  });
}

async function handleTaskAction(event) {
  const button = event.target.closest("[data-action]");
  const card = event.target.closest("[data-task-id]");
  if (!button || !card) return;
  const task = state.tasks.find((candidate) => candidate.id === card.dataset.taskId);
  if (!task) return;

  if (button.dataset.action === "edit") {
    openTaskDialog(task);
    return;
  }
  if (button.dataset.action === "delete") {
    if (!window.confirm(`Delete “${task.title}” from your local planner?`)) return;
    captureUndo("Deleting the task");
    state.tasks = state.tasks.filter((candidate) => candidate.id !== task.id);
  }
  if (button.dataset.action === "complete") {
    captureUndo(task.progress >= 100 ? "Reopening the task" : "Completing the task");
    if (task.progress >= 100) {
      task.progress = Number.isFinite(task.previousProgress) ? task.previousProgress : 0;
      delete task.previousProgress;
    } else {
      task.previousProgress = task.progress;
      task.progress = 100;
    }
  }
  state.demoMode = false;
  resetScenario();
  saveLocalState();
  renderLocalState();
  await analyzeSchedule();
  const message =
    button.dataset.action === "delete"
      ? "Task deleted from this browser."
      : task.progress >= 100
        ? "Task marked complete."
        : `Task reopened at ${task.progress}% progress.`;
  showToast(message, "success", { label: "Undo", callback: undoLastChange });
}

async function updateCapacity() {
  const value = Number(elements.capacityInput.value);
  if (!Number.isFinite(value) || value < 1 || value > 168) {
    elements.capacityInput.value = state.weeklyAvailableHours;
    showToast("Weekly capacity must be between 1 and 168 hours.", "error");
    return;
  }
  captureUndo("Changing weekly capacity");
  state.weeklyAvailableHours = value;
  state.demoMode = false;
  saveLocalState();
  resetScenario();
  renderLocalState();
  await analyzeSchedule();
  showToast(`Weekly capacity updated to ${value} hours.`, "success", {
    label: "Undo",
    callback: undoLastChange,
  });
}

function simulationCandidates() {
  return state.tasks
    .filter((task) => task.progress < 100 && task.flexible && task.type !== "exam")
    .filter((task) => {
      const days = daysBetween(task.deadline, state.referenceDate);
      return days >= 0 && days <= 7;
    })
    .sort((first, second) => remainingHours(second) - remainingHours(first))
    .slice(0, 3);
}

function startSimulationRequest(button, busyLabel) {
  state.simulationController?.abort();
  const controller = new AbortController();
  const sequence = ++state.simulationSequence;
  state.simulationController = controller;
  state.simulation = null;
  renderSimulation();
  setButtonBusy(elements.simulateButton, false, "Simulating…");
  setButtonBusy(elements.previewScenarioButton, false, "Previewing…");
  setButtonBusy(button, true, busyLabel);
  return { controller, sequence };
}

function cancelSimulationRequest() {
  state.simulationController?.abort();
  state.simulationController = null;
  state.simulationSequence += 1;
  setButtonBusy(elements.simulateButton, false, "Simulating…");
  setButtonBusy(elements.previewScenarioButton, false, "Previewing…");
}

async function runSimulation() {
  const candidates = simulationCandidates();
  if (candidates.length === 0) {
    showToast("Mark at least one upcoming non-exam task as flexible to run a scenario.", "error");
    return;
  }
  const { controller, sequence } = startSimulationRequest(elements.simulateButton, "Simulating…");
  try {
    const scenarios = await Promise.all(
      candidates.map(async (task) => {
        const updatedTask = { ...task, deadline: addDays(task.deadline, 7) };
        const response = await fetchJson("/api/simulate", {
          method: "POST",
          body: JSON.stringify(currentPayload({ adjustments: { taskUpdates: [updatedTask] } })),
          signal: controller.signal,
        });
        return { response, task, updatedTask };
      }),
    );
    if (sequence !== state.simulationSequence) return;
    const best = scenarios.sort(
      (first, second) => first.response.simulated.risk.score - second.response.simulated.risk.score,
    )[0];
    state.simulation = {
      ...best,
      hasChange: true,
      weeklyAvailableHours: state.weeklyAvailableHours,
      description: `Move “${best.task.title}” from ${formatDate(best.task.deadline)} to ${formatDate(best.updatedTask.deadline)}.`,
    };
    elements.scenarioCapacity.value = state.weeklyAvailableHours;
    elements.scenarioCapacityOutput.textContent = `${state.weeklyAvailableHours} h`;
    elements.scenarioTaskSelect.value = best.task.id;
    elements.scenarioShift.value = 7;
    elements.scenarioShift.disabled = false;
    elements.scenarioShiftOutput.textContent = "+7 days";
    renderSimulation();
    showToast(
      best.response.comparison.improved
        ? "A lower-score scenario is ready to inspect."
        : "The tested scenario is ready; its score did not decrease.",
    );
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error(error);
    showToast(error.message, "error");
  } finally {
    if (sequence === state.simulationSequence) {
      state.simulationController = null;
      setButtonBusy(elements.simulateButton, false, "Simulating…");
    }
  }
}

async function previewScenario() {
  const weeklyAvailableHours = Number(elements.scenarioCapacity.value);
  const task =
    state.tasks.find((candidate) => candidate.id === elements.scenarioTaskSelect.value) ?? null;
  const shiftDays = task ? Number(elements.scenarioShift.value) : 0;
  const updatedTask =
    task && shiftDays !== 0 ? { ...task, deadline: addDays(task.deadline, shiftDays) } : null;
  const hasCapacityChange = weeklyAvailableHours !== state.weeklyAvailableHours;
  const hasChange = hasCapacityChange || Boolean(updatedTask);
  const { controller, sequence } = startSimulationRequest(
    elements.previewScenarioButton,
    "Previewing…",
  );
  try {
    const adjustments = {
      weeklyAvailableHours,
      taskUpdates: updatedTask ? [updatedTask] : [],
    };
    const response = await fetchJson("/api/simulate", {
      method: "POST",
      body: JSON.stringify(currentPayload({ adjustments })),
      signal: controller.signal,
    });
    if (sequence !== state.simulationSequence) return;
    const descriptions = [];
    if (hasCapacityChange) descriptions.push(`test ${weeklyAvailableHours} available hours`);
    if (updatedTask)
      descriptions.push(`move “${task.title}” to ${formatDate(updatedTask.deadline)}`);
    state.simulation = {
      response,
      task,
      updatedTask,
      weeklyAvailableHours,
      hasChange,
      description:
        descriptions.length > 0
          ? `Temporarily ${descriptions.join(" and ")}.`
          : "No temporary change is selected.",
    };
    renderSimulation();
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error(error);
    showToast(error.message, "error");
  } finally {
    if (sequence === state.simulationSequence) {
      state.simulationController = null;
      setButtonBusy(elements.previewScenarioButton, false, "Previewing…");
    }
  }
}

function resetScenario() {
  cancelSimulationRequest();
  state.simulation = null;
  elements.scenarioCapacity.value = state.weeklyAvailableHours;
  elements.scenarioCapacityOutput.textContent = `${state.weeklyAvailableHours} h`;
  elements.scenarioTaskSelect.value = "";
  elements.scenarioShift.value = 0;
  elements.scenarioShift.disabled = true;
  elements.scenarioShiftOutput.textContent = "+0 days";
  renderSimulation();
}

function invalidateScenarioPreview() {
  cancelSimulationRequest();
  state.simulation = null;
  renderSimulation();
}

async function applySimulation() {
  if (!state.simulation?.hasChange) return;
  captureUndo("Applying the scenario");
  if (state.simulation.updatedTask) {
    const index = state.tasks.findIndex((task) => task.id === state.simulation.updatedTask.id);
    if (index >= 0)
      state.tasks.splice(index, 1, {
        ...state.tasks[index],
        deadline: state.simulation.updatedTask.deadline,
      });
  }
  state.weeklyAvailableHours = state.simulation.weeklyAvailableHours;
  state.demoMode = false;
  saveLocalState();
  resetScenario();
  renderLocalState();
  await analyzeSchedule();
  showToast("The scenario was applied to your planner.", "success", {
    label: "Undo",
    callback: undoLastChange,
  });
  document.querySelector("#planner").scrollIntoView({ behavior: "smooth" });
}

function exportCsv() {
  if (state.tasks.length === 0) return;
  const headers = [
    "title",
    "subject",
    "type",
    "deadline",
    "estimated_hours",
    "progress_percent",
    "priority",
    "flexible",
  ];
  const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = state.tasks.map((task) =>
    [
      task.title,
      task.subject,
      task.type,
      task.deadline,
      task.estimatedHours,
      task.progress,
      task.priority,
      task.flexible,
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `study-balance-plan-${state.referenceDate}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Planner exported as CSV.");
}

async function clearLocalData() {
  if (
    !window.confirm(
      "Clear every task stored by StudyBalance in this browser? You can undo immediately from the confirmation message.",
    )
  )
    return;
  captureUndo("Clearing local data");
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VIEW_STORAGE_KEY);
  state.tasks = [];
  state.weeklyAvailableHours = 18;
  state.demoMode = false;
  state.filter = "open";
  state.search = "";
  elements.taskSearch.value = "";
  updateFilterButtons();
  resetScenario();
  renderLocalState();
  await analyzeSchedule();
  showToast("All planner data was removed from browser storage.", "success", {
    label: "Undo",
    callback: undoLastChange,
  });
}

function rankedOpenTasks() {
  const priorityScore = { high: 0, medium: 1, low: 2 };
  return state.tasks
    .filter((task) => task.progress < 100)
    .sort((first, second) => {
      const firstDays = Math.max(-1, daysBetween(first.deadline, state.referenceDate));
      const secondDays = Math.max(-1, daysBetween(second.deadline, state.referenceDate));
      return (
        firstDays - secondDays ||
        priorityScore[first.priority] - priorityScore[second.priority] ||
        remainingHours(second) - remainingHours(first)
      );
    });
}

function renderFocusPlan() {
  const tasks = rankedOpenTasks();
  const selectedId = elements.focusTaskSelect.value;
  elements.focusTaskSelect.replaceChildren();
  if (tasks.length === 0) {
    elements.focusTaskSelect.add(new Option("No open tasks", ""));
    elements.focusTaskSelect.disabled = true;
  } else {
    elements.focusTaskSelect.disabled = false;
    for (const task of tasks)
      elements.focusTaskSelect.add(
        new Option(`${task.title} · ${deadlineDescription(task)}`, task.id),
      );
    if (tasks.some((task) => task.id === selectedId)) elements.focusTaskSelect.value = selectedId;
  }

  elements.focusPlanList.replaceChildren();
  const selectedTask = tasks.find((task) => task.id === elements.focusTaskSelect.value);
  const sequence = selectedTask
    ? [selectedTask, ...tasks.filter((task) => task.id !== selectedTask.id)]
    : tasks;
  for (const task of sequence.slice(0, 3)) {
    const sessionMinutes = Math.max(
      15,
      Math.min(50, Math.round((Math.min(remainingHours(task), 1) * 60) / 5) * 5),
    );
    const item = document.createElement("li");
    item.innerHTML = `<span><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.subject)} · ${escapeHtml(deadlineDescription(task))}</small></span><time>${sessionMinutes} min</time>`;
    elements.focusPlanList.append(item);
  }
  if (tasks.length === 0) {
    const item = document.createElement("li");
    item.innerHTML =
      "<span><strong>No open work to sequence</strong><small>Add or reopen a task when you are ready.</small></span><time>—</time>";
    elements.focusPlanList.append(item);
  }
}

function updateFocusClock() {
  const minutes = Math.floor(state.focus.remainingSeconds / 60);
  const seconds = state.focus.remainingSeconds % 60;
  elements.focusTime.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  elements.focusClock.setAttribute(
    "aria-label",
    `${minutes} minutes and ${seconds} seconds remaining`,
  );
  elements.focusClock.classList.toggle("running", state.focus.running);
  elements.focusStartButton.innerHTML = state.focus.running
    ? `${icon("pause")}<span>Pause session</span>`
    : `${icon("play")}<span>${state.focus.remainingSeconds < state.focus.durationSeconds ? "Resume session" : "Start session"}</span>`;
}

function pauseFocusTimer() {
  if (!state.focus.running) return;
  window.clearInterval(state.focus.intervalId);
  state.focus.running = false;
  updateFocusClock();
}

function setFocusDuration(minutes) {
  window.clearInterval(state.focus.intervalId);
  state.focus.running = false;
  state.focus.durationSeconds = minutes * 60;
  state.focus.remainingSeconds = minutes * 60;
  document.querySelectorAll(".focus-duration button").forEach((button) => {
    const active = Number(button.dataset.minutes) === minutes;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  updateFocusClock();
}

function toggleFocusTimer() {
  if (elements.focusTaskSelect.disabled) {
    showToast("Add an open task before starting a focus session.", "error");
    return;
  }
  if (state.focus.running) {
    window.clearInterval(state.focus.intervalId);
    state.focus.running = false;
    updateFocusClock();
    return;
  }
  if (state.focus.remainingSeconds <= 0) state.focus.remainingSeconds = state.focus.durationSeconds;
  state.focus.running = true;
  updateFocusClock();
  state.focus.intervalId = window.setInterval(() => {
    state.focus.remainingSeconds -= 1;
    if (state.focus.remainingSeconds <= 0) {
      state.focus.remainingSeconds = 0;
      state.focus.running = false;
      window.clearInterval(state.focus.intervalId);
      showToast("Focus session finished. Choose your next step when ready.");
    }
    updateFocusClock();
  }, 1_000);
}

function resetFocusTimer() {
  window.clearInterval(state.focus.intervalId);
  state.focus.running = false;
  state.focus.remainingSeconds = state.focus.durationSeconds;
  updateFocusClock();
}

function openFocusMode() {
  renderFocusPlan();
  updateFocusClock();
  elements.focusDialog.showModal();
}

function showPrivacyDialog() {
  elements.privacyDialog.showModal();
}

function showScoreDialog() {
  elements.scoreDialog.showModal();
}

function openCommandPalette() {
  if (elements.commandDialog.open) {
    elements.commandSearch.focus();
    return;
  }
  elements.commandSearch.value = "";
  filterCommands();
  elements.commandDialog.showModal();
  window.setTimeout(() => elements.commandSearch.focus(), 0);
}

function filterCommands() {
  const query = elements.commandSearch.value.trim().toLocaleLowerCase("en-US");
  const buttons = [...elements.commandList.querySelectorAll("[data-command]")];
  let firstVisible = null;
  for (const button of buttons) {
    const visible = !query || button.textContent.toLocaleLowerCase("en-US").includes(query);
    button.classList.toggle("hidden", !visible);
    button.classList.remove("active");
    button.tabIndex = -1;
    if (visible && !firstVisible) firstVisible = button;
  }
  if (firstVisible) {
    firstVisible.classList.add("active");
    firstVisible.tabIndex = 0;
  }
}

async function executeCommand(command) {
  if (elements.commandDialog.open) elements.commandDialog.close();
  if (command === "add") openTaskDialog();
  if (command === "forecast") {
    document.querySelector("#overview").scrollIntoView({ behavior: "smooth" });
    await analyzeSchedule({ announce: true });
  }
  if (command === "focus") openFocusMode();
  if (command === "planner") {
    document.querySelector("#planner").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => elements.taskSearch.focus(), 450);
  }
  if (command === "sample") await loadDemo();
  if (command === "privacy") showPrivacyDialog();
}

function handleCommandKeys(event) {
  const visible = [...elements.commandList.querySelectorAll("[data-command]:not(.hidden)")];
  if (visible.length === 0) return;
  const focusedIndex = visible.indexOf(document.activeElement);
  const activeIndex = visible.findIndex((button) => button.classList.contains("active"));
  const currentIndex = Math.max(0, focusedIndex >= 0 ? focusedIndex : activeIndex);
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const startIndex = focusedIndex >= 0 ? currentIndex : event.key === "ArrowDown" ? -1 : 0;
    const next = visible[(startIndex + direction + visible.length) % visible.length];
    visible.forEach((button) => {
      const active = button === next;
      button.classList.toggle("active", active);
      button.tabIndex = active ? 0 : -1;
    });
    next.focus();
    next.scrollIntoView({ block: "nearest" });
  }
  if (event.key === "Enter") {
    event.preventDefault();
    visible[currentIndex]?.click();
  }
}

function isEditableTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable
  );
}

function handleGlobalShortcut(event) {
  if (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLocaleLowerCase("en-US") === "k"
  ) {
    if (document.querySelector("dialog[open]") && !elements.commandDialog.open) return;
    event.preventDefault();
    if (elements.commandDialog.open) {
      elements.commandDialog.close();
      return;
    }
    openCommandPalette();
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (isEditableTarget(event.target) || document.querySelector("dialog[open]")) return;
  const key = event.key.toLocaleLowerCase("en-US");
  if (key === "/") {
    event.preventDefault();
    document.querySelector("#planner").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => elements.taskSearch.focus(), 400);
  }
  if (key === "n") openTaskDialog();
  if (key === "f") openFocusMode();
  if (key === "r") analyzeSchedule({ announce: true });
  if (key === "p") document.querySelector("#planner").scrollIntoView({ behavior: "smooth" });
}

function setupRevealAnimations() {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  )
    return;
  const targets = document.querySelectorAll(".metric-card, .panel, .principle-grid article");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.08 },
  );
  targets.forEach((target) => {
    if (target.classList.contains("revealed")) return;
    target.classList.add("reveal-ready");
    observer.observe(target);
  });
}

function bindEvents() {
  elements.addTaskButton.addEventListener("click", () => openTaskDialog());
  elements.emptyAddButton.addEventListener("click", () => openTaskDialog());
  elements.emptyClearButton.addEventListener("click", () => {
    const allTasksCompleted =
      state.tasks.length > 0 && state.tasks.every((task) => task.progress >= 100);
    const query = state.search.trim();

    if (query) {
      state.search = "";
      elements.taskSearch.value = "";
    } else if (allTasksCompleted) {
      state.filter = "all";
      state.search = "";
      elements.taskSearch.value = "";
    } else {
      state.filter = "open";
      state.search = "";
      elements.taskSearch.value = "";
    }

    saveLocalState();
    updateFilterButtons();
    renderTasks();
  });
  elements.emptyDemoButton.addEventListener("click", () => loadDemo());
  elements.mobileAddButton.addEventListener("click", () => openTaskDialog());
  elements.cancelTaskButton.addEventListener("click", () => elements.taskDialog.close());
  elements.closeTaskDialog.addEventListener("click", () => elements.taskDialog.close());
  elements.taskForm.addEventListener("submit", saveTask);
  elements.taskProgress.addEventListener("input", () => {
    elements.progressOutput.textContent = `${elements.taskProgress.value}%`;
  });
  elements.taskList.addEventListener("click", handleTaskAction);
  elements.capacityInput.addEventListener("change", updateCapacity);
  elements.refreshButton.addEventListener("click", () => analyzeSchedule({ announce: true }));
  elements.loadDemoButton.addEventListener("click", () => loadDemo());
  elements.heroAnalyzeButton.addEventListener("click", async () => {
    document.querySelector("#overview").scrollIntoView({ behavior: "smooth" });
    await analyzeSchedule({ announce: true });
  });
  elements.simulateButton.addEventListener("click", runSimulation);
  elements.previewScenarioButton.addEventListener("click", previewScenario);
  elements.resetScenarioButton.addEventListener("click", resetScenario);
  elements.scenarioCapacity.addEventListener("input", () => {
    elements.scenarioCapacityOutput.textContent = `${elements.scenarioCapacity.value} h`;
    invalidateScenarioPreview();
  });
  elements.scenarioCapacity.addEventListener("change", previewScenario);
  elements.scenarioShift.addEventListener("input", () => {
    elements.scenarioShiftOutput.textContent = `+${elements.scenarioShift.value} days`;
    invalidateScenarioPreview();
  });
  elements.scenarioShift.addEventListener("change", previewScenario);
  elements.scenarioTaskSelect.addEventListener("change", () => {
    invalidateScenarioPreview();
    elements.scenarioShift.disabled = !elements.scenarioTaskSelect.value;
    if (!elements.scenarioTaskSelect.value) {
      elements.scenarioShift.value = 0;
      elements.scenarioShiftOutput.textContent = "+0 days";
    }
  });
  elements.applySimulationButton.addEventListener("click", applySimulation);
  elements.exportButton.addEventListener("click", exportCsv);
  elements.clearDataButton.addEventListener("click", clearLocalData);
  elements.clearFiltersButton.addEventListener("click", () => {
    state.filter = "open";
    state.search = "";
    elements.taskSearch.value = "";
    saveLocalState();
    updateFilterButtons();
    renderTasks();
  });
  elements.privacyButton.addEventListener("click", showPrivacyDialog);
  elements.footerPrivacyButton.addEventListener("click", showPrivacyDialog);
  elements.riskInfoButton.addEventListener("click", showScoreDialog);
  elements.focusButton.addEventListener("click", openFocusMode);
  elements.mobileFocusButton.addEventListener("click", openFocusMode);
  document
    .querySelector(".focus-close")
    .addEventListener("click", () => elements.focusDialog.close());
  elements.focusDialog.addEventListener("close", pauseFocusTimer);
  elements.focusStartButton.addEventListener("click", toggleFocusTimer);
  elements.focusResetButton.addEventListener("click", resetFocusTimer);
  elements.focusTaskSelect.addEventListener("change", renderFocusPlan);
  document
    .querySelectorAll(".focus-duration button")
    .forEach((button) =>
      button.addEventListener("click", () => setFocusDuration(Number(button.dataset.minutes))),
    );

  elements.commandButton.addEventListener("click", openCommandPalette);
  elements.commandSearch.addEventListener("input", filterCommands);
  elements.commandSearch.addEventListener("keydown", handleCommandKeys);
  elements.commandList.addEventListener("keydown", handleCommandKeys);
  elements.commandList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-command]");
    if (button) executeCommand(button.dataset.command);
  });
  document.addEventListener("keydown", handleGlobalShortcut);

  elements.taskSearch.addEventListener("input", () => {
    state.search = elements.taskSearch.value;
    saveLocalState();
    renderTasks();
  });
  elements.taskSearchClear.addEventListener("click", () => {
    state.search = "";
    elements.taskSearch.value = "";
    saveLocalState();
    renderTasks();
    elements.taskSearch.focus({ preventScroll: true });
  });
  elements.taskSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();

    if (elements.taskSearch.value.trim()) {
      state.search = "";
      elements.taskSearch.value = "";
      saveLocalState();
      renderTasks();
      return;
    }

    if (state.filter !== "open") {
      state.filter = "open";
      saveLocalState();
      updateFilterButtons();
      renderTasks();
    }
  });
  elements.taskSort.addEventListener("change", () => {
    state.sort = elements.taskSort.value;
    saveLocalState();
    renderTasks();
  });

  for (const button of document.querySelectorAll(".filter-button")) {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      saveLocalState();
      updateFilterButtons();
      renderTasks();
    });
  }

  for (const button of document.querySelectorAll(".modal-close")) {
    button.addEventListener("click", () => button.closest("dialog").close());
  }

  for (const dialog of document.querySelectorAll("dialog")) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }
}

async function initialize() {
  bindEvents();
  renderUpdates();
  const restored = restoreLocalState();
  elements.capacityInput.value = state.weeklyAvailableHours;
  elements.taskSearch.value = state.search;
  elements.taskSort.value = state.sort;
  updateFilterButtons();
  if (restored) await analyzeSchedule();
  else await loadDemo({ announce: false });
  setupRevealAnimations();
}

initialize();
