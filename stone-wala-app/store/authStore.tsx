import { useGuestStore } from "@/store/guestStore";
import { useVendorStore } from "@/store/vendorStore";
import {
  clearStorage,
  getRole,
  getToken,
  saveRole,
  saveToken,
} from "@/utils/storage";
import { create } from "zustand";

interface AuthUser {
  id: string;
  role: "vendor" | "guest" | "admin";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isHydrated: boolean;

  login: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  isHydrated: false,

  // ── Login ──────────────────────────────────────────
  login: async (userData, authToken) => {
    await saveToken(authToken);
    await saveRole(userData.role);
    set({
      user: userData,
      token: authToken,
      isLoggedIn: true,
    });
  },

 // authStore.ts — logout action update karo
logout: async () => {
  await clearStorage();
  useVendorStore.getState().clearVendor(); // ✅
  useGuestStore.getState().clearGuest();   // ✅
  set({
    user: null,
    token: null,
    isLoggedIn: false,
  });
},

  // ── Hydrate on App Start ───────────────────────────
  hydrate: async () => {
    const token = await getToken();
    const role = await getRole();

    if (token && role) {
      set({
        token,
        user: { id: "", role: role as AuthUser["role"] },
        isLoggedIn: true,
      });
    }

    set({ isHydrated: true });
  },
}));