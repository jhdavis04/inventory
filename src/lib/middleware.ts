import { db } from '../prisma/db';
import { businessId } from './tenant';

export const parseId = (value: unknown) : number | null => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
};

export const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const round2 = (n: number) => Math.round(n * 100) / 100;
export type Numeric<P extends number, S extends number> = string & {
  readonly __numericPrecision: P;
  readonly __numericScale: S;
};

// toDecimal(24.99)  -> "24.99" for a Numeric(10, 2) column
// toDecimal(0.005, 4) -> "0.0050" for a Numeric(10, 4) column
export const toDecimal = <P extends number = 10, S extends number = 2>(n: number, scale: S = 2 as S) =>
  n.toFixed(scale) as Numeric<P, S>;

export function defined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
};

export const ownsSupply = async (id: unknown) => {
    const n = parseId(id);
    return n !== null && (await db.orm.public.Supply.where({ id: n, businessId }).first()) !== null;
};