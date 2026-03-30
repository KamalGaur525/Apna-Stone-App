// ==========================================
// COMMON API RESPONSES
// ==========================================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface HookError {
  message: string;
  status?: number;
}

export interface ActionResult {
  success: boolean;
  message?: string;
}
export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==========================================
// USER & ROLES
// ==========================================
export type Role = 'vendor' | 'guest' | 'admin';

export interface User {
  id: number;
  phone: string;
  role: Role;
  is_active: boolean;
}

// ==========================================
// ENTITIES
// ==========================================
export type Tier = 'stone_seller' | 'factory' | 'godown';
export interface Vendor {
  id: number;
  user_id: number;
  gst_number: string;
  firm_name: string;
  tier: Tier;
  logo_url: string | null;
  whatsapp: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  website: string | null;
  location: string | null;
  about: string | null;
  // Joined from users table
  phone?: string;
  is_active?: boolean;
}

export interface Guest {
  id: number;
  user_id: number;
  name: string;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  payment_status: 'pending' | 'completed' | 'paid' | 'failed';
  plan_type: 'monthly' | 'yearly' | null;
  expiry_date: string | null;
  // Joined from users table
  phone?: string;
  is_active?: boolean;
}

export type ProductStatus = 'pending' | 'approved' | 'rejected';

export interface Product {
  id: number;
  vendor_id: number;
  category_id: number;
  name: string;
  sub_category: string | null;
  third_category: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  status: ProductStatus;
  category_name: string | null;
  rejection_reason: string | null;
  created_at: string;          // <-- ADD
   
  firm_name?: string;
  vendor_phone?: string | null; // <-- ADD
}
export interface DashboardStats {
  totalVendors: number;
  totalGuests: number;
  totalProducts: number;
  pendingProducts: number;
}