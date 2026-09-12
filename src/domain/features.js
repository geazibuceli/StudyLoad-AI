import { addDays, differenceInDays, formatDate, parseDate } from "./date.js";

const FORECAST_DAYS = 7;
const EXAM_WINDOW_DAYS = 14;
const CLUSTER_WINDOW_DAYS = 3;

function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function remainingHoursForTask(task) {
  return task.estimatedHours * (1 - task.progress / 100);
}

export function plannedHoursForForecast(task, referenceDate) {
  if (task.progress >= 100) {
    return 0;
  }

  const remainingHours = remainingHoursForTask(task);
  const daysUntilDeadline = differenceInDays(parseDate(task.deadline), referenceDate);

  if (daysUntilDeadline < FORECAST_DAYS) {
    return remainingHours;
  }

  const pacingShare = FORECAST_DAYS / (daysUntilDeadline + 1);
  return remainingHours * Math.min(1, pacingShare);
}

function calculateDeadlineCluster(tasks, referenceDate) {
  const deadlineOffsets = tasks
    .filter((task) => task.progress < 100)
    .map((task) => differenceInDays(parseDate(task.deadline), referenceDate))
    .filter((offset) => offset < EXAM_WINDOW_DAYS)
    .map((offset) => Math.max(0, offset));

  let maximumCluster = 0;
  for (let start = 0; start < EXAM_WINDOW_DAYS; start += 1) {
    const end = start + CLUSTER_WINDOW_DAYS;
    const count = deadlineOffsets.filter((offset) => offset >= start && offset < end).length;
    maximumCluster = Math.max(maximumCluster, count);
  }

  return maximumCluster;
}

export function buildDailyLoad(tasks, weeklyAvailableHours, referenceDate) {
  const dailyAvailability = weeklyAvailableHours / FORECAST_DAYS;
  const days = Array.from({ length: FORECAST_DAYS }, (_, index) => ({
    date: formatDate(addDays(referenceDate, index)),
    plannedHours: 0,
    availableHours: dailyAvailability,
    taskIds: new Set(),
  }));

  const activeTasks = tasks
    .filter((task) => task.progress < 100 && remainingHoursForTask(task) > 0)
    .sort((first, second) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const deadlineDifference = first.deadline.localeCompare(second.deadline);
      return deadlineDifference || priorityOrder[first.priority] - priorityOrder[second.priority];
    });

  for (const task of activeTasks) {
    const daysUntilDeadline = differenceInDays(parseDate(task.deadline), referenceDate);
    const lastEligibleDay = Math.min(FORECAST_DAYS - 1, Math.max(0, daysUntilDeadline));
    const eligibleDayCount = lastEligibleDay + 1;
    const taskHoursThisWeek = plannedHoursForForecast(task, referenceDate);
    const hoursPerDay = taskHoursThisWeek / eligibleDayCount;

    for (let index = 0; index <= lastEligibleDay; index += 1) {
      days[index].plannedHours += hoursPerDay;
      days[index].taskIds.add(task.id);
    }
  }

  return days.map((day) => ({
    date: day.date,
    plannedHours: round(day.plannedHours),
    availableHours: round(day.availableHours),
    loadRatio: round(day.plannedHours / day.availableHours),
    taskIds: [...day.taskIds],
    taskCount: day.taskIds.size,
  }));
}

export function extractFeatures(tasks, weeklyAvailableHours, referenceDate) {
  const pendingTasks = tasks.filter((task) => task.progress < 100);
  const completedTasks = tasks.filter((task) => task.progress >= 100);
  const offsets = pendingTasks.map((task) => ({
    task,
    daysUntilDeadline: differenceInDays(parseDate(task.deadline), referenceDate),
    remainingHours: remainingHoursForTask(task),
  }));

  const overdueTasks = offsets.filter(({ daysUntilDeadline }) => daysUntilDeadline < 0);
  const dueWithin7Days = offsets.filter(
    ({ daysUntilDeadline }) => daysUntilDeadline >= 0 && daysUntilDeadline < FORECAST_DAYS,
  );
  const examsWithin14Days = offsets.filter(
    ({ task, daysUntilDeadline }) =>
      task.type === "exam" && daysUntilDeadline >= 0 && daysUntilDeadline < EXAM_WINDOW_DAYS,
  );
  const plannedWeeklyHours = pendingTasks.reduce(
    (total, task) => total + plannedHoursForForecast(task, referenceDate),
    0,
  );
  const nearestDeadlineDays =
    offsets.length === 0
      ? 30
      : Math.min(
          30,
          Math.max(0, Math.min(...offsets.map(({ daysUntilDeadline }) => daysUntilDeadline))),
        );
  const averageProgress =
    pendingTasks.length === 0
      ? 100
      : pendingTasks.reduce((total, task) => total + task.progress, 0) / pendingTasks.length;

  return Object.freeze({
    pendingTaskCount: pendingTasks.length,
    completedTaskCount: completedTasks.length,
    overdueTaskCount: overdueTasks.length,
    dueWithin7DaysCount: dueWithin7Days.length,
    examWithin14DaysCount: examsWithin14Days.length,
    remainingHours: round(offsets.reduce((total, item) => total + item.remainingHours, 0)),
    dueWithin7DaysHours: round(
      dueWithin7Days.reduce((total, item) => total + item.remainingHours, 0),
    ),
    weeklyAvailableHours: round(weeklyAvailableHours),
    loadRatio: round(plannedWeeklyHours / weeklyAvailableHours, 4),
    deadlineCluster3Days: calculateDeadlineCluster(tasks, referenceDate),
    highPriorityTaskCount: pendingTasks.filter((task) => task.priority === "high").length,
    nearestDeadlineDays,
    averageProgress: round(averageProgress),
  });
}
