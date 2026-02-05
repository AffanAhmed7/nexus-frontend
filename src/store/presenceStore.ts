import { create } from 'zustand';

interface OnlineUser {
    id: string;
    name: string;
    initials: string;
}

interface PresenceState {
    onlineUsers: OnlineUser[];
    setOnlineUsers: (users: OnlineUser[]) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
    onlineUsers: [],
    setOnlineUsers: (users) => set({ onlineUsers: users }),
}));
