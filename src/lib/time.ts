// The one place that knows how your Prisma install represents DateTime columns.
// Reading: your install returns a JavaScript Date. The Prisma 8 docs describe Temporal.Instant,
// so these helpers accept either one.
export const toMillis = (value: Date | Temporal.Instant): number =>
  value instanceof Date ? value.getTime() : value.epochMilliseconds;

export const toInstant = (value: Date | Temporal.Instant): Temporal.Instant =>
  Temporal.Instant.fromEpochMilliseconds(toMillis(value));

// Writing: a Date. If a later version wants Temporal.Instant instead, change just this line:
//   return Temporal.Instant.fromEpochMilliseconds(millis);
export const toDbTime = (millis: number): Date => new Date(millis);


// date parser used for finding real dates and it will return undefined if date does not exist
// might be a better way to handle this
export function parseDate(v: unknown): Temporal.PlainDate | undefined {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined
    try {
        return Temporal.PlainDate.from(v, { overflow: 'reject' });
    } catch {
        return undefined
    }
};