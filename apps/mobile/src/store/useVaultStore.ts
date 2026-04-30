import { create } from 'zustand';
import { api } from '../services/api';

interface Vault {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  isCompleted: boolean;
  targetDate?: string;
}

interface VaultState {
  vaults: Vault[];
  isLoading: boolean;
  fetchVaults: () => Promise<void>;
  createVault: (data: any) => Promise<void>;
  deposit: (vaultId: string, amount: number) => Promise<void>;
  withdraw: (vaultId: string, amount: number) => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaults: [],
  isLoading: false,

  fetchVaults: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/vaults');
      set({ vaults: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createVault: async (data) => {
    await api.post('/vaults', data);
    await get().fetchVaults();
  },

  deposit: async (vaultId, amount) => {
    await api.post(`/vaults/${vaultId}/deposit`, { amount });
    await get().fetchVaults();
  },

  withdraw: async (vaultId, amount) => {
    await api.post(`/vaults/${vaultId}/withdraw`, { amount });
    await get().fetchVaults();
  },
}));
