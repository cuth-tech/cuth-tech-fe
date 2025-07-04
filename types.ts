
export type AdminRole = 'superadmin' | 'manager' | 'editor';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string; 
  brand?: string; 
  tags?: string[]; 
  createdAt?: string; 
}

export interface Category {
  id: string;
  name:string;
  description?: string;
  order: number; 
}

export interface CartItem extends Product {
  quantity: number;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Invoice {
  id: string; // internal UUID
  invoiceNumber: string; // user-facing number
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: 'proforma' | 'completed'; // proforma from cart, completed from checkout
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string; // Full name for display
  email: string;
  password?: string; // Stored as plain text for localStorage persistence. In a real backend, this would be a hash.
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface DiscountCode {
  id: string;
  code: string;        
  type: 'percentage' | 'fixed'; 
  value: number;       
  isActive: boolean;   
  description?: string; 
  createdAt: string;
  expiresAt?: string;  
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminUserId: string;
  adminUsername: string;
  adminRole: AdminRole;
  action: string; // e.g., 'PRODUCT_CREATED', 'ADMIN_ROLE_UPDATED', 'CATEGORY_DELETED'
  entityType?: string; // e.g., 'Product', 'AdminUser', 'Category'
  entityIdOrName?: string; // ID or name of the affected entity
  details?: Record<string, any>; // For additional context, like old/new values
}