import { create } from 'zustand';
import { api } from '../services/api';

interface SpendingInsight {
  categories: any[];
  totalSpent: number;
  period: string;
  tip: string;
}

interface HealthScore {
  score: number;
  grade: string;
  advice: string;
  components: Record<string, number>;
}

interface AiState {
  insights: SpendingInsight | null;
  healthScore: HealthScore | null;
  isLoading: boolean;
  fetchInsights: () => Promise<void>;
  fetchHealthScore: () => Promise<void>;
}

export const useAiStore = create<AiState>((set) => ({
  insights: null,
  healthScore: null,
  isLoading: false,

  fetchInsights: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/ai/insights');
      set({ insights: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHealthScore: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/ai/health-score');
      set({ healthScore: data });
    } finally {
      set({ isLoading: false });
    }
  },
}));
