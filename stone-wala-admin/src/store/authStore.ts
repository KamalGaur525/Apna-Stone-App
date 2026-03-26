import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  _hasHydrated: boolean;                    // tracks when persist has loaded from localStorage
  setHasHydrated: (val: boolean) => void;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      login:  (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    {
      name: 'admin-auth',
      // Called once localStorage is read and state is restored
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);