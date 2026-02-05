import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api.js';
import { socket } from '../utils/socket.js';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string;
    notificationPrefs?: {
        email: boolean;
        inApp: boolean;
        taskAssigned: boolean;
        taskComment: boolean;
    };
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    updateAccessToken: (token: string) => void;
    updateUser: (user: Partial<User>) => void;
    deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            setAuth: (user, accessToken, refreshToken) =>
                set({ user, accessToken, refreshToken, isAuthenticated: true }),
            logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
            updateAccessToken: (accessToken) => set({ accessToken }),
            updateUser: (updatedUser) => set((state) => ({
                user: state.user ? { ...state.user, ...updatedUser } : null
            })),
            deleteAccount: async () => {
                await api.delete('/auth/delete-account');
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },
        }),
        {
            name: 'nexus-auth-storage',
        }
    )
);
