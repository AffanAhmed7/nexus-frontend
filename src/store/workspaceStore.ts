import { create } from 'zustand';
import api from '../utils/api.js';
import { socket } from '../utils/socket.js';

interface Workspace {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    _count?: {
        members: number;
        projects: number;
    };
    members?: WorkspaceMember[];
}

interface WorkspaceMember {
    id: string;
    workspaceId: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER';
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    };
}

interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    members: WorkspaceMember[];
    loading: boolean;
    error: string | null;
    fetchWorkspaces: () => Promise<void>;
    fetchMembers: (workspaceId: string) => Promise<void>;
    setActiveWorkspace: (workspace: Workspace) => void;
    createWorkspace: (name: string, description?: string) => Promise<void>;
    inviteUser: (workspaceId: string, email: string, role: string) => Promise<void>;
    updateMemberRole: (workspaceId: string, userId: string, role: string) => Promise<void>;
    respondToInvitation: (workspaceId: string, accept: boolean) => Promise<void>;
    removeMember: (workspaceId: string, userId: string) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    initializeSocketListener: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    workspaces: [],
    activeWorkspace: null,
    members: [],
    loading: false,
    error: null,

    fetchWorkspaces: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/workspaces');
            const workspaces = response.data;
            set({ workspaces, loading: false });
            if (workspaces.length > 0 && !get().activeWorkspace) {
                const firstWorkspace = workspaces[0];
                set({
                    activeWorkspace: firstWorkspace,
                    members: firstWorkspace.members || []
                });
            }
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchMembers: async (workspaceId) => {
        try {
            const res = await api.get(`/workspaces/${workspaceId}`);
            set({ members: res.data.members || [] });
        } catch (error: any) {
            console.error(error);
        }
    },

    setActiveWorkspace: (workspace) => {
        set({
            activeWorkspace: workspace,
            members: workspace.members || []
        });
    },

    createWorkspace: async (name, description) => {
        try {
            const response = await api.post('/workspaces', { name, description });
            const newWorkspace = response.data;
            set((state) => ({
                workspaces: [...state.workspaces, newWorkspace],
                activeWorkspace: state.activeWorkspace || newWorkspace
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    inviteUser: async (workspaceId, email, role) => {
        await api.post('/workspaces/invite', { workspaceId, email, role });
        await get().fetchMembers(workspaceId);
    },

    updateMemberRole: async (workspaceId, userId, role) => {
        await api.patch('/workspaces/update-role', { workspaceId, userId, role });
        await get().fetchMembers(workspaceId);
    },

    respondToInvitation: async (workspaceId, accept) => {
        await api.post('/workspaces/respond', { workspaceId, accept });
        await get().fetchWorkspaces();
    },

    removeMember: async (workspaceId, userId) => {
        await api.post('/workspaces/remove-member', { workspaceId, userId });
        await get().fetchMembers(workspaceId);
    },

    deleteWorkspace: async (id) => {
        await api.delete(`/workspaces/${id}`);
        const workspaces = get().workspaces.filter(w => w.id !== id);
        set({
            workspaces,
            activeWorkspace: workspaces.length > 0 ? workspaces[0] : null
        });
    },

    initializeSocketListener: () => {
        socket.on('workspace_list_updated', () => {
            get().fetchWorkspaces();
        });

        socket.on('kicked_from_workspace', ({ workspaceId }: { workspaceId: string }) => {
            const state = get();
            if (state.activeWorkspace?.id === workspaceId) {
                const workspaces = state.workspaces.filter(w => w.id !== workspaceId);
                set({
                    workspaces,
                    activeWorkspace: workspaces.length > 0 ? workspaces[0] : null
                });
            } else {
                get().fetchWorkspaces();
            }
        });

        socket.on('workspace_deleted', ({ workspaceId }: { workspaceId: string }) => {
            const state = get();
            const workspaces = state.workspaces.filter(w => w.id !== workspaceId);
            set({
                workspaces,
                activeWorkspace: state.activeWorkspace?.id === workspaceId
                    ? (workspaces.length > 0 ? workspaces[0] : null)
                    : state.activeWorkspace
            });
        });
    }
}));
