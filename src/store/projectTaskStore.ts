import { create } from 'zustand';
import api from '../utils/api.js';
import { socket } from '../utils/socket.js';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string | null;
    projectId: string;
    creatorId: string;
    assigneeId?: string | null;
    assignee?: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    } | null;
    position: number;
    labels: string[];
    isArchived: boolean;
    updatedAt: string;
    createdAt: string;
}

interface Project {
    id: string;
    name: string;
    description?: string;
    workspaceId: string;
    totalTasks: number;
    completedTasks: number;
}

type View = 'OVERVIEW' | 'KANBAN' | 'ANALYTICS' | 'SETTINGS' | 'MEMBERS' | 'NOTIFICATIONS' | 'ARCHIVE';

interface ProjectTaskState {
    activeView: View;
    setActiveView: (view: View) => void;
    projects: Project[];
    activeProject: Project | null;
    tasks: Task[];
    archivedTasks: Task[];
    loading: boolean;
    fetchProjects: (workspaceId: string) => Promise<void>;
    setActiveProject: (project: Project) => void;
    fetchTasks: (projectId: string, archived?: boolean) => Promise<void>;
    createTask: (projectId: string, title: string) => Promise<void>;
    updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    archiveTask: (taskId: string) => Promise<void>;
    unarchiveTask: (taskId: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    syncOfflineActions: () => Promise<void>;
    resetState: () => void;
    initializeSocketListeners: () => void;
}

interface OfflineAction {
    id: string;
    type: 'CREATE' | 'UPDATE_STATUS' | 'DELETE';
    payload: any;
}

export const useProjectTaskStore = create<ProjectTaskState>((set, get) => ({
    activeView: 'OVERVIEW',
    setActiveView: (view) => set({ activeView: view }),
    projects: [],
    activeProject: null,
    tasks: [],
    archivedTasks: [],
    loading: false,

    fetchProjects: async (workspaceId) => {
        set({ loading: true });
        try {
            const response = await api.get(`/projects/workspace/${workspaceId}`);
            // Backend returns { projects: [], pagination: {} }
            const projects = response.data.projects || response.data;
            set({ projects, loading: false });
        } catch (error) {
            set({ loading: false });
        }
    },

    setActiveProject: (project) => set({ activeProject: project }),

    fetchTasks: async (projectId, archived = false) => {
        set({ loading: true });
        try {
            const response = await api.get(`/tasks/project/${projectId}?archived=${archived}`);
            // Handle structure from backend: { tasks, pagination }
            const tasks = response.data.tasks || response.data;
            if (archived) {
                set({ archivedTasks: tasks, loading: false });
            } else {
                set({ tasks, loading: false });
            }
        } catch (error) {
            set({ loading: false });
        }
    },

    createTask: async (projectId, title) => {
        try {
            const response = await api.post('/tasks', { projectId, title });
            const newTask = response.data;
            set((state) => ({
                tasks: [...state.tasks, newTask],
                projects: state.projects.map(p =>
                    p.id === projectId
                        ? { ...p, totalTasks: (p.totalTasks || 0) + 1 }
                        : p
                )
            }));
        } catch (error) {
            console.error(error);
        }
    },

    updateTaskStatus: async (taskId, status) => {
        try {
            await api.patch(`/tasks/${taskId}`, { status });
            set((state) => {
                const oldTask = state.tasks.find(t => t.id === taskId);
                const wasDone = oldTask?.status === 'DONE';
                const isDone = status === 'DONE';

                // If status didn't essentially change in terms of completion, don't update projects
                if (wasDone === isDone) {
                    return {
                        tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t)
                    };
                }

                return {
                    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t),
                    projects: state.projects.map(p => {
                        if (p.id === oldTask?.projectId) {
                            return {
                                ...p,
                                completedTasks: isDone
                                    ? (p.completedTasks || 0) + 1
                                    : Math.max(0, (p.completedTasks || 0) - 1)
                            };
                        }
                        return p;
                    })
                };
            });
        } catch (error) {
            // Queue for offline
            const action: OfflineAction = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'UPDATE_STATUS',
                payload: { taskId, status }
            };
            const queue = JSON.parse(localStorage.getItem('nexus_offline_queue') || '[]');
            localStorage.setItem('nexus_offline_queue', JSON.stringify([...queue, action]));

            // Optimistic update
            set((state) => ({
                tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t)
            }));
        }
    },

    updateTask: async (taskId: string, updates: Partial<Task>) => {
        try {
            const response = await api.patch(`/tasks/${taskId}`, updates);
            set((state) => ({
                tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...response.data } : t)
            }));
        } catch (error) {
            console.error('Failed to update task:', error);
            throw error;
        }
    },

    deleteTask: async (taskId) => {
        try {
            await api.patch(`/tasks/${taskId}`, { isDeleted: true });
            set((state) => {
                const task = state.tasks.find(t => t.id === taskId);
                return {
                    tasks: state.tasks.filter(t => t.id !== taskId),
                    projects: state.projects.map(p => {
                        if (p.id === task?.projectId) {
                            return {
                                ...p,
                                totalTasks: Math.max(0, (p.totalTasks || 0) - 1),
                                completedTasks: task?.status === 'DONE'
                                    ? Math.max(0, (p.completedTasks || 0) - 1)
                                    : p.completedTasks
                            };
                        }
                        return p;
                    })
                };
            });
        } catch (error) {
            // Queue for offline
            const action: OfflineAction = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'DELETE',
                payload: { taskId }
            };
            const queue = JSON.parse(localStorage.getItem('nexus_offline_queue') || '[]');
            localStorage.setItem('nexus_offline_queue', JSON.stringify([...queue, action]));

            // Optimistic update
            set((state) => ({
                tasks: state.tasks.filter(t => t.id !== taskId)
            }));
        }
    },

    archiveTask: async (taskId) => {
        try {
            await api.post(`/tasks/${taskId}/archive`);
            set((state) => {
                const task = state.tasks.find(t => t.id === taskId);
                return {
                    tasks: state.tasks.filter(t => t.id !== taskId),
                    projects: state.projects.map(p => {
                        if (p.id === task?.projectId) {
                            return {
                                ...p,
                                totalTasks: Math.max(0, (p.totalTasks || 0) - 1),
                                completedTasks: task?.status === 'DONE'
                                    ? Math.max(0, (p.completedTasks || 0) - 1)
                                    : p.completedTasks
                            };
                        }
                        return p;
                    })
                };
            });
        } catch (error) {
            console.error('Failed to archive task:', error);
            throw error;
        }
    },

    unarchiveTask: async (taskId) => {
        try {
            const response = await api.post(`/tasks/${taskId}/unarchive`);
            const updatedTask = response.data;
            set((state) => ({
                archivedTasks: state.archivedTasks.filter(t => t.id !== taskId),
                tasks: state.activeProject?.id === updatedTask.projectId ? [...state.tasks, updatedTask] : state.tasks,
                projects: state.projects.map(p => {
                    if (p.id === updatedTask.projectId) {
                        return {
                            ...p,
                            totalTasks: (p.totalTasks || 0) + 1,
                            completedTasks: updatedTask.status === 'DONE'
                                ? (p.completedTasks || 0) + 1
                                : p.completedTasks
                        };
                    }
                    return p;
                })
            }));
        } catch (error) {
            console.error('Failed to unarchive task:', error);
            throw error;
        }
    },

    deleteProject: async (id) => {
        await api.delete(`/projects/${id}`);
        set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            activeProject: state.activeProject?.id === id ? null : state.activeProject
        }));
    },

    resetState: () => {
        set({
            projects: [],
            activeProject: null,
            tasks: [],
            archivedTasks: [],
            loading: false,
            activeView: 'OVERVIEW'
        });
    },

    syncOfflineActions: async () => {
        const queue: OfflineAction[] = JSON.parse(localStorage.getItem('nexus_offline_queue') || '[]');
        if (queue.length === 0) return;

        console.log('Syncing offline actions...', queue.length);
        const remaining: OfflineAction[] = [];

        for (const action of queue) {
            try {
                if (action.type === 'UPDATE_STATUS') {
                    await api.patch(`/tasks/${action.payload.taskId}`, { status: action.payload.status });
                } else if (action.type === 'DELETE') {
                    await api.patch(`/tasks/${action.payload.taskId}`, { isDeleted: true });
                } else if (action.type === 'CREATE') {
                    await api.post('/tasks', action.payload);
                }
            } catch (err) {
                remaining.push(action);
            }
        }

        localStorage.setItem('nexus_offline_queue', JSON.stringify(remaining));
        if (remaining.length === 0) {
            console.log('Sync complete');
        }
    },

    initializeSocketListeners: () => {
        if ((socket as any)._nexus_initialized) return;
        (socket as any)._nexus_initialized = true;

        socket.on('task_created', (task: Task) => {
            const state = get();

            // Always update project stats if we have the project loaded
            const projectExists = state.projects.some(p => p.id === task.projectId);

            if (projectExists) {
                set((state) => ({
                    projects: state.projects.map(p =>
                        p.id === task.projectId
                            ? { ...p, totalTasks: (p.totalTasks || 0) + 1 }
                            : p
                    )
                }));
            }

            if (task.projectId === state.activeProject?.id) {
                if (!state.tasks.some(t => t.id === task.id)) {
                    set((state) => ({ tasks: [...state.tasks, task] }));
                }
            }
        });

        socket.on('task_updated', (task: Task) => {
            const state = get();

            // Check if status changed regarding completion
            const oldTask = state.tasks.find(t => t.id === task.id);
            if (oldTask && oldTask.status !== task.status) {
                const wasDone = oldTask.status === 'DONE';
                const isDone = task.status === 'DONE';

                if (wasDone !== isDone) {
                    set((state) => ({
                        projects: state.projects.map(p => {
                            if (p.id === task.projectId) {
                                return {
                                    ...p,
                                    completedTasks: isDone
                                        ? (p.completedTasks || 0) + 1
                                        : Math.max(0, (p.completedTasks || 0) - 1)
                                };
                            }
                            return p;
                        })
                    }));
                }
            }

            if (task.projectId === state.activeProject?.id) {
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === task.id ? task : t)
                }));
            }
        });

        socket.on('task_deleted', (taskId: string) => {
            // finding task might be hard if it's already deleted in backend, 
            // but we might have it in local state
            const state = get();
            const task = state.tasks.find(t => t.id === taskId);

            if (task) {
                set((state) => ({
                    tasks: state.tasks.filter(t => t.id !== taskId),
                    projects: state.projects.map(p => {
                        if (p.id === task.projectId) {
                            return {
                                ...p,
                                totalTasks: Math.max(0, (p.totalTasks || 0) - 1),
                                completedTasks: task.status === 'DONE'
                                    ? Math.max(0, (p.completedTasks || 0) - 1)
                                    : p.completedTasks
                            };
                        }
                        return p;
                    })
                }));
            } else {
                set((state) => ({
                    tasks: state.tasks.filter(t => t.id !== taskId)
                }));
            }
        });

        socket.on('project_created', (project: Project) => {
            const state = get();
            if (project.workspaceId === state.projects[0]?.workspaceId) {
                if (!state.projects.some(p => p.id === project.id)) {
                    set((state) => ({ projects: [...state.projects, project] }));
                }
            }
        });

        socket.on('project_deleted', ({ projectId, workspaceId }: { projectId: string, workspaceId: string }) => {
            const state = get();
            const projects = state.projects.filter(p => p.id !== projectId);
            set({
                projects,
                activeProject: state.activeProject?.id === projectId ? null : state.activeProject
            });
        });
    }
}));

// Setup global online listener
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        useProjectTaskStore.getState().syncOfflineActions();
    });
}
