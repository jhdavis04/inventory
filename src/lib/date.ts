// function for parsing dates
/* export function parseDate(v: unknown): Temporal.PlainDate | undefined {
    if (typeof v === 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    try {
        return Temporal.PlainDate.from(v, { overflow: 'reject' });
    } catch {
        return undefined;
    }
} */