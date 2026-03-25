import { create } from "zustand";

interface Firm {
  id: string;
  name: string;
  city: string;
  category: string;
  rating: number | null; // ✅ null allowed — backend se null aa sakta hai
  image: string;
  phone?: string;
  email?: string;
  location?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

interface Category {
  id: string;
  name: string;
  image: string;
}

interface GuestState {
  firms: Firm[];
  categories: Category[];
  searchResults: Firm[];
  selectedFirm: Firm | null;

  setFirms: (firms: Firm[]) => void;
  setCategories: (categories: Category[]) => void;
  setSearchResults: (results: Firm[]) => void;
  setSelectedFirm: (firm: Firm | null) => void;
  clearGuest: () => void;
}

export const useGuestStore = create<GuestState>((set) => ({
  firms: [],
  categories: [],
  searchResults: [],
  selectedFirm: null,

  setFirms: (firms) => set({ firms }),
  setCategories: (categories) => set({ categories }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSelectedFirm: (firm) => set({ selectedFirm: firm }),

  clearGuest: () =>
    set({
      firms: [],
      categories: [],
      searchResults: [],
      selectedFirm: null,
    }),
}));