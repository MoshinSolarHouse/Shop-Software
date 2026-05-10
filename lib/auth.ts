import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'bizmanager-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  shopIds: string[];
  permissions: Record<string, string[]>;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function hasPermission(user: JWTPayload, resource: string, action: string): boolean {
  if (user.role === 'super-admin') return true;
  const perms = user.permissions;
  if (!perms || !perms[resource]) return false;
  return perms[resource].includes(action);
}

export function canAccessShop(user: JWTPayload, shopId: string): boolean {
  if (user.role === 'super-admin') return true;
  return user.shopIds.includes(shopId);
}

export const RESOURCES = [
  'dashboard', 'shops', 'products', 'categories', 'customers', 'sales',
  'payments', 'reports', 'users', 'permissions',
] as const;

export const ACTIONS = ['create', 'read', 'update', 'delete'] as const;

export const DEFAULT_PERMISSIONS: Record<string, Record<string, string[]>> = {
  'super-admin': Object.fromEntries(RESOURCES.map(r => [r, [...ACTIONS]])),
  'admin': Object.fromEntries(RESOURCES.map(r => [r, [...ACTIONS]])),
  'sales-man': {
    dashboard: ['read'],
    products: ['read'],
    categories: ['read'],
    customers: ['read', 'create'],
    sales: ['read', 'create'],
    payments: ['read', 'create'],
    reports: [],
    shops: ['read'],
    users: [],
    permissions: [],
  },
};
