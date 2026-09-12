import { currentUtcDate, formatDate, parseDate } from "./date.js";

export const TASK_TYPES = Object.freeze(["assignment", "exam", "reading", "project", "other"]);

export const PRIORITY_LEVELS = Object.freeze(["low", "medium", "high"]);

function assertPlainObject(value, fieldName) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${fieldName} must be an object.`);
  }
}

function requiredText(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function finiteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${fieldName} must be a finite number.`);
  }

  return value;
}

export function normalizeTask(task, index = 0) {
  const fieldPrefix = `tasks[${index}]`;
  assertPlainObject(task, fieldPrefix);

  const id = requiredText(task.id, `${fieldPrefix}.id`);
  const title = requiredText(task.title, `${fieldPrefix}.title`);
  const subject = requiredText(task.subject, `${fieldPrefix}.subject`);

  if (!TASK_TYPES.includes(task.type)) {
    throw new RangeError(`${fieldPrefix}.type must be one of: ${TASK_TYPES.join(", ")}.`);
  }

  if (!PRIORITY_LEVELS.includes(task.priority)) {
    throw new RangeError(`${fieldPrefix}.priority must be one of: ${PRIORITY_LEVELS.join(", ")}.`);
  }

  const estimatedHours = finiteNumber(task.estimatedHours, `${fieldPrefix}.estimatedHours`);
  if (estimatedHours < 0) {
    throw new RangeError(`${fieldPrefix}.estimatedHours cannot be negative.`);
  }

  const progress = finiteNumber(task.progress, `${fieldPrefix}.progress`);
  if (progress < 0 || progress > 100) {
    throw new RangeError(`${fieldPrefix}.progress must be between 0 and 100.`);
  }

  if (typeof task.flexible !== "boolean") {
    throw new TypeError(`${fieldPrefix}.flexible must be a boolean.`);
  }

  return Object.freeze({
    id,
    title,
    subject,
    type: task.type,
    deadline: formatDate(parseDate(task.deadline, `${fieldPrefix}.deadline`)),
    estimatedHours,
    progress,
    priority: task.priority,
    flexible: task.flexible,
  });
}

export function normalizeScheduleInput(payload) {
  assertPlainObject(payload, "payload");

  if (!Array.isArray(payload.tasks)) {
    throw new TypeError("payload.tasks must be an array.");
  }

  const tasks = payload.tasks.map(normalizeTask);
  const ids = new Set();
  for (const task of tasks) {
    if (ids.has(task.id)) {
      throw new RangeError(`Task id "${task.id}" is duplicated.`);
    }
    ids.add(task.id);
  }

  const weeklyAvailableHours = finiteNumber(
    payload.weeklyAvailableHours,
    "payload.weeklyAvailableHours",
  );
  if (weeklyAvailableHours <= 0 || weeklyAvailableHours > 168) {
    throw new RangeError("payload.weeklyAvailableHours must be greater than 0 and at most 168.");
  }

  const referenceDate =
    payload.referenceDate === undefined
      ? currentUtcDate()
      : parseDate(payload.referenceDate, "payload.referenceDate");

  return Object.freeze({
    tasks: Object.freeze(tasks),
    weeklyAvailableHours,
    referenceDate,
    referenceDateIso: formatDate(referenceDate),
  });
}

export function normalizeSimulationAdjustments(adjustments, tasks) {
  if (adjustments === undefined) {
    adjustments = {};
  }
  assertPlainObject(adjustments, "payload.adjustments");

  const taskUpdates = adjustments.taskUpdates ?? [];
  const removeTaskIds = adjustments.removeTaskIds ?? [];

  if (!Array.isArray(taskUpdates)) {
    throw new TypeError("payload.adjustments.taskUpdates must be an array.");
  }
  if (!Array.isArray(removeTaskIds)) {
    throw new TypeError("payload.adjustments.removeTaskIds must be an array.");
  }

  const taskIds = new Set(tasks.map((task) => task.id));
  const normalizedUpdates = taskUpdates.map((update, index) => {
    assertPlainObject(update, `payload.adjustments.taskUpdates[${index}]`);
    const id = requiredText(update.id, `payload.adjustments.taskUpdates[${index}].id`);
    if (!taskIds.has(id)) {
      throw new RangeError(`Cannot update unknown task id "${id}".`);
    }

    const original = tasks.find((task) => task.id === id);
    return normalizeTask({ ...original, ...update, id }, index);
  });

  const normalizedRemoveIds = removeTaskIds.map((id, index) => {
    const normalizedId = requiredText(id, `payload.adjustments.removeTaskIds[${index}]`);
    if (!taskIds.has(normalizedId)) {
      throw new RangeError(`Cannot remove unknown task id "${normalizedId}".`);
    }
    return normalizedId;
  });

  const duplicateUpdateIds = new Set();
  for (const update of normalizedUpdates) {
    if (duplicateUpdateIds.has(update.id)) {
      throw new RangeError(`Task id "${update.id}" has multiple updates.`);
    }
    duplicateUpdateIds.add(update.id);
  }

  const removed = new Set(normalizedRemoveIds);
  for (const update of normalizedUpdates) {
    if (removed.has(update.id)) {
      throw new RangeError(
        `Task id "${update.id}" cannot be updated and removed in one simulation.`,
      );
    }
  }

  let weeklyAvailableHours;
  if (adjustments.weeklyAvailableHours !== undefined) {
    weeklyAvailableHours = finiteNumber(
      adjustments.weeklyAvailableHours,
      "payload.adjustments.weeklyAvailableHours",
    );
    if (weeklyAvailableHours <= 0 || weeklyAvailableHours > 168) {
      throw new RangeError(
        "payload.adjustments.weeklyAvailableHours must be greater than 0 and at most 168.",
      );
    }
  }

  return Object.freeze({
    taskUpdates: Object.freeze(normalizedUpdates),
    removeTaskIds: Object.freeze([...new Set(normalizedRemoveIds)]),
    weeklyAvailableHours,
  });
}
