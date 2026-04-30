import { create } from 'zustand';
import { api } from '../services/api';

interface KycState {
  status: any;
  isLoading: boolean;
  fetchStatus: () => Promise<void>;
  submitL1: (data: { fullName: string; phone: string }) => Promise<void>;
  submitL2: (data: any) => Promise<void>;
}

export const useKycStore = create<KycState>((set, get) => ({
  status: null,
  isLoading: false,

  fetchStatus: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/kyc/status');
      set({ status: data });
    } finally {
      set({ isLoading: false });
    }
  },

  submitL1: async (data) => {
    set({ isLoading: true });
    try {
      const { data: res } = await api.post('/kyc/level1', data);
      set({ status: res });
    } finally {
      set({ isLoading: false });
    }
  },

  submitL2: async (data) => {
    set({ isLoading: true });
    try {
      // In a real app, this would be a multipart/form-data request for images
      const { data: res } = await api.post('/kyc/level2', data);
      set({ status: res });
    } finally {
      set({ isLoading: false });
    }
  },
}));
