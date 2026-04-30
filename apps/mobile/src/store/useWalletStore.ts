import { create } from 'zustand';
import { api } from '../services/api';

interface WalletState {
  balance: number;
  transactions: any[];
  isLoading: boolean;
  fetchWallet: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  transactions: [],
  isLoading: false,

  fetchWallet: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/wallet/balance');
      set({ balance: data.balance });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async (page = 1) => {
    try {
      const { data } = await api.get(`/transactions?page=${page}`);
      set({ transactions: data.items });
    } catch (err) {
      console.error('Failed to fetch transactions');
    }
  },
}));
