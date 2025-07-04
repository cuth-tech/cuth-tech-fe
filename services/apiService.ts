import { Product, Category, AdminUser, Invoice, DiscountCode, InvoiceItem } from '../types';
import { addAuditLog } from './auditLogService';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_BASE_URL) {
  console.error("VITE_BACKEND_URL is not defined in the environment.");
}

const logAction = (actor: AdminUser | null, action: string, entityType: string, entityIdOrName: string, details?: Record<string, any>) => {
    if (actor) {
        addAuditLog({
            adminUserId: actor.id,
            adminUsername: actor.username,
            adminRole: actor.role,
            action,
            entityType,
            entityIdOrName,
            details
        });
    }
};

// --- App Initialization ---
export const initializeProductsFromSheet = async (): Promise<{ success: boolean; message?: string; }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/products/initialize-from-sheet`, {
            method: 'POST',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to initialize products from sheet.");
        }
        return await response.json();
    } catch (error: any) {
        console.error("Error initializing products from sheet:", error);
        return { success: false, message: error.message };
    }
};


// --- Discount Management ---
export const validateDiscountCode = async (code: string): Promise<{ isValid: boolean; discount?: DiscountCode; message?: string }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/discounts/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        const result = await response.json();
        if (!response.ok) {
            return { isValid: false, message: result.message || "Invalid or expired code." };
        }
        return { isValid: true, discount: result.discount, message: "Code applied!" };
    } catch (error: any) {
        console.error("Error validating discount code:", error);
        return { isValid: false, message: "Could not connect to the server to validate code." };
    }
};


// --- Category Management ---
export const getCategories = async (): Promise<Category[] | null> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/categories`);
        if (!response.ok) throw new Error("Failed to fetch categories");
        return await response.json();
    } catch (error) {
        console.error("Error in getCategories:", error);
        return null;
    }
};

export const getCategoryByName = async (name: string): Promise<Category | null> => {
    try {
        const categories = await getCategories();
        if (!categories) {
            return null;
        }
        const foundCategory = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
        return foundCategory || null;
    } catch (error) {
        console.error(`Error fetching category by name "${name}":`, error);
        return null;
    }
};

export const addCategory = async (categoryData: Omit<Category, 'id'>, actor: AdminUser): Promise<Category> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error("Failed to add category");
    const newCategory = await response.json();
    logAction(actor, 'CATEGORY_ADDED', 'Category', newCategory.name, { id: newCategory.id });
    return newCategory;
};

export const updateCategory = async (id: string, categoryData: Partial<Omit<Category, 'id'>>, actor: AdminUser): Promise<Category> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error("Failed to update category");
    const updatedCategory = await response.json();
    logAction(actor, 'CATEGORY_UPDATED', 'Category', updatedCategory.name, { id: updatedCategory.id });
    return updatedCategory;
};

export const deleteCategory = async (id: string, actor: AdminUser): Promise<void> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error("Failed to delete category");
    logAction(actor, 'CATEGORY_DELETED', 'Category', `ID: ${id}`);
};

export const updateCategoryOrder = async (orderedIds: string[], actor: AdminUser): Promise<boolean> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/categories/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
    });
    if (!response.ok) return false;
    logAction(actor, 'CATEGORY_REORDERED', 'Category', 'List');
    return true;
};


// --- Tag Management ---
export const getManagedTags = async (): Promise<string[]> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/tags`);
        if (!response.ok) throw new Error("Failed to fetch managed tags");
        const tags = await response.json();
        return Array.isArray(tags) ? tags.sort((a, b) => a.localeCompare(b)) : [];
    } catch (error) {
        console.error("Error in getManagedTags:", error);
        return [];
    }
};

export const addNewManagedTag = async (tagName: string, actor: AdminUser): Promise<{ success: boolean; message?: string; tag?: string }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagName }),
        });
        const result = await response.json();
        if (response.ok) {
            logAction(actor, 'TAG_ADDED', 'Tag', tagName);
            return { success: true, ...result };
        } else {
            return { success: false, message: result.message || "Server error" };
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const deleteManagedTag = async (tagName: string, actor: AdminUser): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/tags/${encodeURIComponent(tagName)}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok) {
            logAction(actor, 'TAG_DELETED', 'Tag', tagName);
            return { success: true, ...result };
        } else {
            return { success: false, message: result.message || "Server error" };
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const renameManagedTag = async (oldName: string, newName: string, actor: AdminUser): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/tags/${encodeURIComponent(oldName)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName }),
        });
        const result = await response.json();
        if (response.ok) {
            logAction(actor, 'TAG_RENAMED', 'Tag', newName, { from: oldName });
            return { success: true, ...result };
        } else {
            return { success: false, message: result.message || "Server error" };
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const deleteManagedTagsBulk = async (tagNames: string[], actor: AdminUser): Promise<{ success: boolean; deletedCount: number; message?: string }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/tags/delete-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagNames }),
        });
        const result = await response.json();
        if (response.ok) {
            logAction(actor, 'TAG_BULK_DELETED', 'Tag', `Count: ${result.deletedCount}`, { deletedTags: tagNames });
            return { success: true, deletedCount: result.deletedCount };
        } else {
            return { success: false, deletedCount: 0, message: result.message || "Server error" };
        }
    } catch (error: any) {
        return { success: false, deletedCount: 0, message: error.message };
    }
};


// --- Product Management ---
export const getProducts = async (): Promise<Product[] | null> => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products from backend');
      const products: Product[] = await response.json();
      return Array.isArray(products) ? products : [];
    } catch(error) {
      console.error("Failed to get products:", error);
      return null;
    }
};

export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/products/${id}`);
        if (!response.ok) throw new Error("Failed to fetch product");
        return await response.json();
    } catch (error) {
        console.error(`Error fetching product with ID ${id}:`, error);
        return null;
    }
};

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, actor: AdminUser): Promise<Product> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error("Failed to add product");
    const newProduct = await response.json();
    logAction(actor, 'PRODUCT_ADDED', 'Product', newProduct.name, { id: newProduct.id });
    return newProduct;
};

export const updateProduct = async (id: string, productData: Partial<Product>, actor: AdminUser): Promise<Product> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error("Failed to update product");
    const updatedProduct = await response.json();
    logAction(actor, 'PRODUCT_UPDATED', 'Product', updatedProduct.name, { id: updatedProduct.id });
    return updatedProduct;
};

export const deleteProduct = async (id: string, actor: AdminUser | null): Promise<boolean> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error("Failed to delete product");
    const result = await response.json();
    logAction(actor, 'PRODUCT_DELETED', 'Product', `ID: ${id}`, { result });
    return result.success;
};

export const deleteProductsBulk = async (ids: string[], actor: AdminUser | null): Promise<{ success: boolean; deletedCount: number }> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/products/delete-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error("Failed to bulk delete products");
    const result = await response.json();
    logAction(actor, 'PRODUCT_BULK_DELETED', 'Product', `Count: ${result.deletedCount}`, { deletedIds: ids });
    return result;
};

export const fetchProductsFromSheetForPreview = async (): Promise<{ success: boolean; products?: Product[]; message?: string; }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/products/preview-from-sheet`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch preview from sheet.");
        }
        return await response.json();
    } catch (error: any) {
        console.error("Error fetching products from sheet for preview:", error);
        return { success: false, message: error.message };
    }
};

export const replaceAllProducts = async (products: Product[], actor: AdminUser): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/products/replace-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server failed to replace products.');
        }

        const result = await response.json();
        logAction(actor, 'PRODUCTS_REPLACED_ALL', 'Product', `Count: ${products.length}`);
        return result;

    } catch (error: any) {
        console.error("Error replacing all products:", error);
        return { success: false, message: error.message };
    }
};

export const bulkUploadProducts = async (file: File, actor: AdminUser): Promise<{ success: boolean; message: string; count?: number }> => {
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/products/bulk-upload`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            return { success: false, message: result.message || "An error occurred on the server." };
        }

        logAction(actor, 'PRODUCTS_BULK_UPLOADED', 'Product', `Count: ${result.count || 0}`, { fileName: file.name });
        return { success: true, message: result.message || 'Upload successful!', count: result.count };

    } catch (error: any) {
        console.error("Bulk upload failed:", error);
        return { success: false, message: error.message || "An unknown error occurred." };
    }
};


// --- Invoice & Receipt Management ---
export const getInvoices = async (params: { searchTerm?: string }, actor?: AdminUser | null): Promise<{ invoices: Invoice[] }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/invoices`);
        if (!response.ok) throw new Error('Failed to fetch invoices from backend');
        let allInvoices: Invoice[] = await response.json();

        if (params.searchTerm) {
            const lowerSearchTerm = params.searchTerm.toLowerCase();
            allInvoices = allInvoices.filter(inv =>
                inv.invoiceNumber.toLowerCase().includes(lowerSearchTerm) ||
                inv.customerName.toLowerCase().includes(lowerSearchTerm) ||
                inv.customerEmail.toLowerCase().includes(lowerSearchTerm)
            );
        }

        if (actor) {
            logAction(actor, 'INVOICES_VIEWED', 'Invoice', 'List View', { filters: { searchTerm: params.searchTerm } });
        }

        const sortedInvoices = allInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { invoices: sortedInvoices };

    } catch (error) {
        console.error("Failed to get invoices:", error);
        return { invoices: [] };
    }
};

export const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>): Promise<Invoice> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
    });
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || "Failed to create invoice");
    }
    return await response.json();
};

export const getReceipts = async (params: { searchTerm?: string }, actor?: AdminUser | null): Promise<{ receipts: Invoice[] }> => {
    try {
        const { invoices } = await getInvoices(params, null);
        const receipts = invoices.filter(invoice => invoice.status === 'completed');
        
        if (actor) {
            logAction(actor, 'RECEIPTS_VIEWED', 'Receipt', 'List View', { filters: { searchTerm: params.searchTerm } });
        }
        
        return { receipts };

    } catch (error) {
        console.error("Failed to get receipts:", error);
        return { receipts: [] };
    }
};


export const deleteInvoice = async (id: string, actor: AdminUser | null): Promise<boolean> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/invoices/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        console.error("Failed to delete invoice from backend.");
        return false;
    }
    const result = await response.json();
    logAction(actor, 'INVOICE_DELETED', 'Invoice', `ID: ${id}`, { result });
    return result.success ?? false;
};

export const deleteInvoicesBulk = async (ids: string[], actor: AdminUser | null): Promise<{ success: boolean; deletedCount: number }> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/invoices/delete-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error("Failed to bulk delete invoices");
    const result = await response.json();
    logAction(actor, 'INVOICE_BULK_DELETED', 'Invoice', `Count: ${result.deletedCount}`, { deletedIds: ids });
    return result;
};



// --- Unique Data Helpers ---
// FIXED: This function now correctly handles tags being a string or an array.
export const getAllUniqueTags = async (): Promise<string[] | null> => {
    try {
      const products = await getProducts();
      if (!products) return [];
      const allTags = new Set<string>();
      
      products.forEach(p => {
        const tags = p.tags as unknown; // Cast to unknown to satisfy TypeScript
        if (tags && typeof tags === 'string') {
          tags.split(',').forEach((tag: string) => { // Added explicit type for tag
            const trimmedTag = tag.trim();
            if (trimmedTag) allTags.add(trimmedTag);
          });
        } else if (Array.isArray(tags)) {
          tags.forEach((tag: string) => { // Added explicit type for tag
            const trimmedTag = tag.trim();
            if (trimmedTag) allTags.add(trimmedTag);
          });
        }
      });
      
      return Array.from(allTags).sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    } catch(error) {
      console.error("Failed to get unique tags:", error);
      return null;
    }
};

export const getAllUniqueBrands = async (): Promise<string[] | null> => {
  try {
    const products = await getProducts();
    if (!products) return [];
    const allBrands = new Set<string>();
    products.forEach(p => {
        if (p.brand) {
            allBrands.add(p.brand.trim());
        }
    });
    return Array.from(allBrands).sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  } catch(error) {
    console.error("Failed to get unique brands:", error);
    return null;
  }
};

// --- Generic Data Service ---
export const fetchData = async <T>(filename: string): Promise<T | null> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/data/${filename}`);
        if (!response.ok) {
            if (response.status === 404) return null; // File not found is not an error here
            throw new Error(`Failed to fetch data for ${filename}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data for ${filename}:`, error);
        return null;
    }
};

export const saveData = async <T>(filename: string, data: T): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/data/${filename}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save data.');
        }
        return { success: true, ...(await response.json()) };
    } catch (error: any) {
        console.error(`Error saving data for ${filename}:`, error);
        return { success: false, message: error.message };
    }
};

// --- Discount Management ---
export const getDiscountCodes = async (): Promise<DiscountCode[]> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/discounts`);
        if (!response.ok) throw new Error("Failed to fetch discount codes");
        return await response.json();
    } catch (error) {
        console.error("Error in getDiscountCodes:", error);
        return [];
    }
};

export const addDiscountCode = async (discountData: Omit<DiscountCode, 'id'>, actor: AdminUser): Promise<DiscountCode> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add discount code');
    }
    const newDiscount = await response.json();
    logAction(actor, 'DISCOUNT_ADDED', 'DiscountCode', newDiscount.code, { id: newDiscount.id });
    return newDiscount;
};

export const updateDiscountCode = async (id: string, updates: Partial<Omit<DiscountCode, 'id' | 'code'>>, actor: AdminUser): Promise<DiscountCode> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update discount code');
    }
    const updatedDiscount = await response.json();
    logAction(actor, 'DISCOUNT_UPDATED', 'DiscountCode', updatedDiscount.code, { id: updatedDiscount.id });
    // FIXED: Corrected variable name from updatedProduct to updatedDiscount
    return updatedDiscount;
};

export const deleteDiscountCode = async (id: string, actor: AdminUser): Promise<{ success: boolean }> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/discounts/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error("Failed to delete discount code");
    logAction(actor, 'DISCOUNT_DELETED', 'DiscountCode', `ID: ${id}`);
    return { success: true };
};

export const deleteDiscountCodesBulk = async (ids: string[], actor: AdminUser): Promise<{ success: boolean, deletedCount: number }> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/discounts/delete-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error("Failed to bulk delete discount codes");
    const result = await response.json();
    logAction(actor, 'DISCOUNT_BULK_DELETED', 'DiscountCode', `Count: ${result.deletedCount}`, { deletedIds: ids });
    return result;
};
