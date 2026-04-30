import { create } from 'zustand';
import { api } from '../services/api';

interface SocialState {
  feed: any[];
  requests: any[];
  isLoading: boolean;
  fetchFeed: (page?: number) => Promise<void>;
  fetchRequests: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  feed: [],
  requests: [],
  isLoading: false,

  fetchFeed: async (page = 1) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/social/feed?page=${page}`);
      set({ feed: data.items });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRequests: async () => {
    const { data } = await api.get('/social/requests');
    set({ requests: data });
  },

  likePost: async (postId) => {
    await api.post(`/social/posts/${postId}/like`);
    // Optimistic update could go here
    const { feed } = get();
    set({
      feed: feed.map(p => p.id === postId ? { ...p, isLiked: true, _count: { ...p._count, likes: p._count.likes + 1 } } : p)
    });
  },

  followUser: async (userId) => {
    await api.post(`/social/follow/${userId}`);
  },
}));
