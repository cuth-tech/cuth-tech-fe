import { AdminUser, AdminRole } from './types';

export const APP_NAME = "CUTH-TECH";

// API Endpoints (Reference)
export const API_BASE_URL = "/api";
export const AUTH_LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;
export const PRODUCTS_ENDPOINT = `${API_BASE_URL}/products`;
export const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`;
export const BULK_UPLOAD_ENDPOINT = `${API_BASE_URL}/products/bulk-upload`;

// Admin Roles
export const ADMIN_ROLES: { [key: string]: AdminRole } = {
  SUPERADMIN: 'superadmin',
  MANAGER: 'manager',
  EDITOR: 'editor',
};

// Defines the default admin accounts. This is used ONLY on the first time the app runs to populate localStorage. Subsequent runs will use the data from localStorage, making all changes to admin users persistent.
export const INITIAL_ADMIN_USERS: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    username: 'cuth-tech',
    password: 'Silence@1',
    role: ADMIN_ROLES.SUPERADMIN as AdminRole,
    name: 'CUTH TECH Admin',
    email: 'superadmin@example.com',
    isActive: true,
  },
  {
    username: 'manager',
    password: 'Manager@12', // User requested manager@1, using Manager@12 for consistency
    role: ADMIN_ROLES.MANAGER as AdminRole,
    name: 'Store Manager',
    email: 'manager@example.com',
    isActive: true,
  },
  {
    username: 'editor',
    password: 'Editor@123',
    role: ADMIN_ROLES.EDITOR as AdminRole,
    name: 'Content Editor',
    email: 'editor@example.com',
    isActive: true,
  },
];


export const MOCK_CATEGORIES = [
  { id: 'cat_lcd', name: 'Lcd', description: '', order: 0 },
  { id: 'cat_touch', name: 'Touch Screen', description: '', order: 1 },
  { id: 'cat_flexy', name: 'Flexy', description: '', order: 2 },
  { id: 'cat_batteries', name: 'Batteries', description: '', order: 3 },
  { id: 'cat_tools', name: 'Tools', description: '', order: 4 },
  { id: 'cat_machines', name: 'Machines', description: '', order: 5 },
  { id: 'cat_ports', name: 'Ports', description: '', order: 6 },
  { id: 'cat_cam_glass', name: 'Camera Glass', description: '', order: 7 },
  { id: 'cat_fingerprint', name: 'Fingerprint', description: '', order: 8 },
  { id: 'cat_connector', name: 'Connector', description: '', order: 9 },
];

export const MOCK_INITIAL_PRODUCTS_COUNT: number = 10;