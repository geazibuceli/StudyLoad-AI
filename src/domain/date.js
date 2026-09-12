const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const MILLISECONDS_PER_DAY = 86_400_000;

export function parseDate(value, fieldName = "date") {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new RangeError(`${fieldName} must be a valid date.`);
    }

    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  if (typeof value !== "string") {
    throw new TypeError(`${fieldName} must use the YYYY-MM-DD format.`);
  }

  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    throw new TypeError(`${fieldName} must use the YYYY-MM-DD format.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new RangeError(`${fieldName} must be a valid calendar date.`);
  }

  return parsed;
}

export function formatDate(value) {
  const date = value instanceof Date ? value : parseDate(value);
  return date.toISOString().slice(0, 10);
}

export function addDays(value, numberOfDays) {
  const date = value instanceof Date ? value : parseDate(value);
  return new Date(date.getTime() + numberOfDays * MILLISECONDS_PER_DAY);
}

export function differenceInDays(laterValue, earlierValue) {
  const later = laterValue instanceof Date ? laterValue : parseDate(laterValue);
  const earlier = earlierValue instanceof Date ? earlierValue : parseDate(earlierValue);
  return Math.round((later.getTime() - earlier.getTime()) / MILLISECONDS_PER_DAY);
}

export function currentUtcDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
