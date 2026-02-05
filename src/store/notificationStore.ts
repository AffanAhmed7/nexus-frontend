import { create } from 'zustand';
import api from '../utils/api';
import { socket } from '../utils/socket';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAllNotifications: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    initializeSocketListener: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/notifications');
            const notifications = res.data;
            const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
            set({ notifications, unreadCount, loading: false });
        } catch (err) {
            set({ loading: false });
        }
    },

    markAsRead: async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            set((state) => {
                const notifications = state.notifications.map(n =>
                    n.id === id ? { ...n, isRead: true } : n
                );
                return {
                    notifications,
                    unreadCount: notifications.filter(n => !n.isRead).length
                };
            });
        } catch (err) {
            console.error(err);
        }
    },

    markAllAsRead: async () => {
        try {
            await api.patch('/notifications/read-all', {});
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        } catch (err) {
            console.error(err);
        }
    },

    clearAllNotifications: async () => {
        try {
            await api.delete('/notifications');
            set({ notifications: [], unreadCount: 0 });
        } catch (err) {
            console.error(err);
        }
    },

    addNotification: (notification) => {
        const state = get();
        if (state.notifications.some(n => n.id === notification.id)) return;

        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
        }));
    },

    initializeSocketListener: () => {
        socket.on('notification', (notification: Notification) => {
            get().addNotification(notification);
        });
    }
}));
