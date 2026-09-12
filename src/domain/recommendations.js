import { differenceInDays, parseDate } from "./date.js";

function pendingTasks(tasks) {
  return tasks.filter((task) => task.progress < 100);
}

function taskIdsForWindow(tasks, referenceDate, minimumDay, maximumDay) {
  return pendingTasks(tasks)
    .filter((task) => {
      const offset = differenceInDays(parseDate(task.deadline), referenceDate);
      return offset >= minimumDay && offset <= maximumDay;
    })
    .map((task) => task.id);
}

function recommendation({
  id,
  priority,
  title,
  message,
  action,
  feature,
  operator,
  threshold,
  actual,
  relatedTaskIds,
}) {
  return Object.freeze({
    id,
    priority,
    title,
    message,
    action,
    trigger: Object.freeze({ feature, operator, threshold, actual }),
    relatedTaskIds: Object.freeze(relatedTaskIds),
  });
}

export function buildRecommendations(tasks, features, risk, referenceDate) {
  const recommendations = [];

  if (features.overdueTaskCount > 0) {
    recommendations.push(
      recommendation({
        id: "triage-overdue-work",
        priority: "high",
        title: "Triage overdue work first",
        message:
          "Choose the overdue task with the highest academic priority and define its next concrete step.",
        action:
          "Reserve one focused block for the highest-priority overdue task, then review any deadline that is no longer realistic.",
        feature: "overdueTaskCount",
        operator: ">",
        threshold: 0,
        actual: features.overdueTaskCount,
        relatedTaskIds: taskIdsForWindow(tasks, referenceDate, -10_000, -1),
      }),
    );
  }

  if (features.loadRatio > 1) {
    recommendations.push(
      recommendation({
        id: "rebalance-weekly-capacity",
        priority: "high",
        title: "Bring planned work closer to available time",
        message: `The current plan uses about ${Math.round(features.loadRatio * 100)}% of the study time available this week.`,
        action:
          "Split large tasks into smaller blocks and move a flexible, lower-priority block outside the busiest days.",
        feature: "loadRatio",
        operator: ">",
        threshold: 1,
        actual: features.loadRatio,
        relatedTaskIds: pendingTasks(tasks)
          .filter((task) => task.flexible)
          .sort((first, second) => second.estimatedHours - first.estimatedHours)
          .slice(0, 3)
          .map((task) => task.id),
      }),
    );
  }

  if (features.deadlineCluster3Days >= 3) {
    recommendations.push(
      recommendation({
        id: "spread-deadline-cluster",
        priority: "high",
        title: "Start the deadline cluster early",
        message: `${features.deadlineCluster3Days} deadlines fall inside the busiest three-day window.`,
        action:
          "Advance one flexible task or complete its first milestone before the cluster begins.",
        feature: "deadlineCluster3Days",
        operator: ">=",
        threshold: 3,
        actual: features.deadlineCluster3Days,
        relatedTaskIds: taskIdsForWindow(tasks, referenceDate, 0, 6),
      }),
    );
  }

  if (features.examWithin14DaysCount >= 2) {
    recommendations.push(
      recommendation({
        id: "protect-exam-review-blocks",
        priority: "medium",
        title: "Protect short exam review blocks",
        message: `${features.examWithin14DaysCount} exams are scheduled in the next fourteen days.`,
        action:
          "Reserve repeated review blocks now instead of concentrating all preparation immediately before each exam.",
        feature: "examWithin14DaysCount",
        operator: ">=",
        threshold: 2,
        actual: features.examWithin14DaysCount,
        relatedTaskIds: pendingTasks(tasks)
          .filter((task) => task.type === "exam")
          .filter((task) => {
            const offset = differenceInDays(parseDate(task.deadline), referenceDate);
            return offset >= 0 && offset < 14;
          })
          .map((task) => task.id),
      }),
    );
  }

  if (features.highPriorityTaskCount >= 3) {
    recommendations.push(
      recommendation({
        id: "limit-active-priorities",
        priority: "medium",
        title: "Limit simultaneous top priorities",
        message: `${features.highPriorityTaskCount} pending tasks are currently marked as high priority.`,
        action:
          "Select at most two immediate priorities and temporarily rank the others by deadline and remaining effort.",
        feature: "highPriorityTaskCount",
        operator: ">=",
        threshold: 3,
        actual: features.highPriorityTaskCount,
        relatedTaskIds: pendingTasks(tasks)
          .filter((task) => task.priority === "high")
          .map((task) => task.id),
      }),
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      recommendation({
        id: "maintain-sustainable-plan",
        priority: "low",
        title: "Keep the plan sustainable",
        message: "No workload rule currently indicates a concentrated academic demand.",
        action: "Review the plan when a deadline, available study time, or task estimate changes.",
        feature: "loadRatio",
        operator: "<=",
        threshold: 1,
        actual: features.loadRatio,
        relatedTaskIds: [],
      }),
    );
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((first, second) => priorityOrder[first.priority] - priorityOrder[second.priority])
    .slice(0, risk.level === "high" ? 5 : 4);
}
