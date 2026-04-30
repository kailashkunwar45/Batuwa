import { create } from 'zustand';
import { api } from '../services/api';

interface FamilyMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface FamilyLink {
  id: string;
  child: FamilyMember;
  dailyLimit: number;
  monthlyLimit: number;
  allowedCategories: string[];
  isActive: boolean;
}

interface FamilyState {
  links: FamilyLink[];
  isLoading: boolean;
  fetchLinks: () => Promise<void>;
  addMember: (phone: string, limits: any) => Promise<void>;
  updateLimits: (linkId: string, limits: any) => Promise<void>;
  removeMember: (childId: string) => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  links: [],
  isLoading: false,

  fetchLinks: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/family/links');
      set({ links: data.asParent });
    } finally {
      set({ isLoading: false });
    }
  },

  addMember: async (phone, limits) => {
    // In a real app, we'd first search for the user by phone
    // For now, we assume the backend handles it or we have a childId
    await api.post('/family/link', { phone, ...limits });
    await get().fetchLinks();
  },

  updateLimits: async (linkId, limits) => {
    await api.patch(`/family/links/${linkId}`, limits);
    await get().fetchLinks();
  },

  removeMember: async (childId) => {
    await api.delete(`/family/links/${childId}`);
    await get().fetchLinks();
  },
}));
