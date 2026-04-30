import { create } from 'zustand';
import { api } from '../services/api';

interface Merchant {
  id: string;
  businessName: string;
  businessType: string;
  isVerified: boolean;
}

interface MerchantState {
  currentMerchant: Merchant | null;
  isLoading: boolean;
  lookupMerchant: (qrCode: string) => Promise<Merchant>;
  payMerchant: (qrCode: string, amount: number) => Promise<void>;
}

export const useMerchantStore = create<MerchantState>((set) => ({
  currentMerchant: null,
  isLoading: false,

  lookupMerchant: async (qrCode) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/merchants/lookup/${qrCode}`);
      set({ currentMerchant: data });
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  payMerchant: async (qrCode, amount) => {
    set({ isLoading: true });
    try {
      await api.post('/merchants/pay', { qrCode, amount });
    } finally {
      set({ isLoading: false });
    }
  },
}));
