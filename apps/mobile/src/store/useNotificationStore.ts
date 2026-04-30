import { create } from 'zustand';
import { api } from '../services/api';

interface NotificationState {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/notifications?page=${page}`);
      set({ 
        notifications: data.items, 
        unreadCount: data.unread 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    const { notifications, unreadCount } = get();
    set({
      notifications: notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, unreadCount - 1)
    });
  },
}));
