import { create } from "zustand";

interface VendorProfile {
  id: string;
  firmName: string;
  gstNumber: string;
  phone: string;
  city: string;
}

interface VendorProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  images: string[]; // ✅ array — Multer returns multiple images
}

interface SubscriptionPlan {
  isActive: boolean;
  planName: string | null;
  expiryDate: string | null; // ✅ expiry track karo
}

interface VendorState {
  profile: VendorProfile | null;
  products: VendorProduct[];
  subscription: SubscriptionPlan;

  setProfile: (profile: VendorProfile) => void;
  setProducts: (products: VendorProduct[]) => void;
  addProduct: (product: VendorProduct) => void;
  setSubscription: (plan: SubscriptionPlan) => void;
  clearVendor: () => void;
}

export const useVendorStore = create<VendorState>((set) => ({
  profile: null,
  products: [],
  subscription: {
    isActive: false,
    planName: null,
    expiryDate: null,
  },

  setProfile: (profile) => set({ profile }),

  setProducts: (products) => set({ products }),

  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),

  setSubscription: (plan) => set({ subscription: plan }),

  clearVendor: () =>
    set({
      profile: null,
      products: [],
      subscription: { isActive: false, planName: null, expiryDate: null },
    }),
}));