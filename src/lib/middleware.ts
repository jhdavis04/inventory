import { db } from '../prisma/db';
import { businessId } from './tenant';

export const parseId = (value: unknown) : number | null => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
};

export const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const toDecimal = (n: number): string => n.toFixed(2);

const sqlState = (e: unknown) => (e instanceof Error && 'sqlState' in e ? e.sqlState : undefined);
export const isDuplicate = (e: unknown) => sqlState(e) === '23505'
export const isInUse = (e: unknown) => sqlState(e) === '23503'

export function defined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
};

export const ownsProduct = async (id: unknown) => {
    const n = parseId(id);
    return n !== null && (await db.orm.public.Product.where({ id: n, businessId }).first()) !== null;
};

export const ownsSupply = async (id: unknown) => {
    const n = parseId(id);
    return n !== null && (await db.orm.public.Supply.where({ id: n, businessId }).first()) !== null;
};

export const ownsChannel = async (id: unknown) => {
    const n = parseId(id);
    return n !== null && (await db.orm.public.SalesChannel.where({ id: n, businessId }).first()) !== null;
};