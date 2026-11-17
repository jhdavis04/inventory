export const businessId = 1;

import type { Response } from "express";
export type AuthUser = { id: number; businessId: number; role: string };

// only usable if requireAuth is ran first
export const currentUser = (res: Response): AuthUser => res.locals.user;