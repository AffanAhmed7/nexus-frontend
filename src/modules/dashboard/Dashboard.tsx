import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { useWorkspaceStore } from '../../store/workspaceStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useProjectTaskStore } from '../../store/projectTaskStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import { LogOut, Layout, Settings, Search, Bell, ChevronDown, Plus, BarChart3, Folder, Moon, Sun, Loader2, Users, Trash2, Archive, RefreshCw, Menu, X } from 'lucide-react';
import CreateWorkspaceModal from '../../components/modals/CreateWorkspaceModal';
import CreateProjectModal from '../../components/modals/CreateProjectModal';
import ActivityFeed from '../../components/common/ActivityFeed';
import KeyboardShortcuts from '../../components/common/KeyboardShortcuts';
import InfoModals from '../../components/modals/InfoModals';
import NotificationCenter from '../../components/common/NotificationCenter';
import SearchOverlay from '../../components/modals/SearchOverlay';
import KanbanBoard from './KanbanBoard';
import ProjectAnalytics from './ProjectAnalytics';
import UserSettings from './UserSettings';
import MemberManagement from './MemberManagement';
import TaskDetailModal from '../../components/modals/TaskDetailModal';
import api from '../../utils/api.js';
import { connectSocket, socket } from '../../utils/socket.js';
import { toast } from 'react-hot-toast';
import '../../styles/Dashboard.css';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const Dashboard = () => {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const accessToken = useAuthStore(state => state.accessToken);

    const workspaces = useWorkspaceStore(state => state.workspaces);
    const activeWorkspace = useWorkspaceStore(state => state.activeWorkspace);
    const members = useWorkspaceStore(state => state.members);
    const fetchWorkspaces = useWorkspaceStore(state => state.fetchWorkspaces);
    const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
    const workspacesLoading = useWorkspaceStore(state => state.loading);

    const fetchNotifications = useNotificationStore(state => state.fetchNotifications);
    const notifications = useNotificationStore(state => state.notifications);
    const markAllAsRead = useNotificationStore(state => state.markAllAsRead);

    const projects = useProjectTaskStore(state => state.projects);
    const fetchProjects = useProjectTaskStore(state => state.fetchProjects);
    const projectsLoading = useProjectTaskStore(state => state.loading);
    const activeView = useProjectTaskStore(state => state.activeView);
    const setActiveView = useProjectTaskStore(state => state.setActiveView);
    const archivedTasks = useProjectTaskStore(state => state.archivedTasks);
    const fetchTasks = useProjectTaskStore(state => state.fetchTasks);
    const unarchiveTask = useProjectTaskStore(state => state.unarchiveTask);

    const theme = useThemeStore(state => state.theme);
    const toggleTheme = useThemeStore(state => state.toggleTheme);

    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
    const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const workspaceDropdownRef = useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; type: 'DOCS' | 'PRIVACY' | 'SUPPORT' }>({
        isOpen: false,
        type: 'DOCS'
    });
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        danger?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        fetchWorkspaces();
        fetchNotifications();
    }, [fetchWorkspaces, fetchNotifications]);

    useEffect(() => {
        useNotificationStore.getState().initializeSocketListener();
        useWorkspaceStore.getState().initializeSocketListener();
        useProjectTaskStore.getState().initializeSocketListeners();
    }, []);

    useEffect(() => {
        if (accessToken) {
            connectSocket(accessToken);
        }
    }, [accessToken]);

    useEffect(() => {
        if (activeWorkspace) {
            fetchProjects(activeWorkspace.id);
            socket.emit('join-workspace', { workspaceId: activeWorkspace.id });
        }
    }, [activeWorkspace, fetchProjects]);

    useEffect(() => {
        if (selectedProjectId && activeView === 'ARCHIVE') {
            fetchTasks(selectedProjectId, true);
        }
    }, [selectedProjectId, activeView, fetchTasks]);

    // Auto-select first project if in detail view and none selected
    useEffect(() => {
        if ((activeView === 'KANBAN' || activeView === 'ANALYTICS') && !selectedProjectId && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
    }, [activeView, selectedProjectId, projects]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
                setIsWorkspaceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleWorkspaceSelect = (workspace: any) => {
        useProjectTaskStore.getState().resetState();
        setSelectedProjectId(null);
        setActiveView('OVERVIEW');
        setActiveWorkspace(workspace);
        setIsWorkspaceDropdownOpen(false);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case 'URGENT': return '#ef4444';
            case 'HIGH': return '#f97316';
            case 'MEDIUM': return '#3b82f6';
            case 'LOW': return '#10b981';
            default: return '#9ca3af';
        }
    };

    const canManageTask = (taskCreatorId: string) => {
        if (!user) return false;
        const isAdmin = members.find(m => m.userId === user.id)?.role === 'ADMIN';
        return isAdmin || taskCreatorId === user.id;
    };

    const handleCreateWorkspaceClick = () => {
        setIsWorkspaceDropdownOpen(false);
        setIsWorkspaceModalOpen(true);
    };

    const navItems = [
        {
            id: 'OVERVIEW',
            icon: <Layout size={18} />,
            label: 'Overview',
            action: () => {
                setActiveView('OVERVIEW');
                setSelectedProjectId(null);
            }
        },
        {
            id: 'KANBAN',
            icon: <Folder size={18} />,
            label: 'Kanban',
            action: () => {
                setActiveView('KANBAN');
                if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
            }
        },
        {
            id: 'ANALYTICS',
            icon: <BarChart3 size={18} />,
            label: 'Analytics',
            action: () => {
                setActiveView('ANALYTICS');
                if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
            }
        },
        { id: 'SEARCH', icon: <Search size={18} />, label: 'Search', action: () => setIsSearchOpen(true) },
        {
            id: 'MEMBERS',
            icon: <Users size={18} />,
            label: 'Members',
            action: () => { setActiveView('MEMBERS'); setSelectedProjectId(null); }
        },
        { id: 'SETTINGS', icon: <Settings size={18} />, label: 'Settings', action: () => { setActiveView('SETTINGS'); setSelectedProjectId(null); } }
    ];

    const isLoading = workspacesLoading || (activeWorkspace && projectsLoading && projects.length === 0);

    return (
        <div className="dashboard-container">
            {/* Top Navigation Bar */}
            <header className="dashboard-navbar glass">
                <div className="navbar-left">
                    <button className="mobile-menu-toggle" onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
                        {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className="dashboard-logo" onClick={() => { setSelectedProjectId(null); setActiveView('OVERVIEW'); }}>
                        NEXUS<span className="dashboard-logo-accent">.</span>
                    </div>

                    <div className="navbar-divider" />


                    {/* Workspace Switcher */}
                    <div className="workspace-switcher-relative" ref={workspaceDropdownRef}>
                        <div
                            className={`workspace-switcher-compact ${isWorkspaceDropdownOpen ? 'active' : ''}`}
                            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                        >
                            <div className="workspace-avatar">
                                {activeWorkspace?.name?.charAt(0) || (workspacesLoading ? '...' : 'W')}
                            </div>
                            <div className="workspace-details">
                                <span className="workspace-name-text">
                                    {activeWorkspace?.name || (workspacesLoading ? 'Loading...' : 'No Workspace')}
                                </span>
                            </div>
                            <ChevronDown size={14} className={`switcher-icon ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isWorkspaceDropdownOpen && (
                            <div className="workspace-dropdown-menu glass-solid animated-fade-in-up">
                                <div className="dropdown-section-label">Your Workspaces</div>
                                <div className="workspace-list-scrollable">
                                    {workspaces.map((ws) => (
                                        <div
                                            key={ws.id}
                                            className={`workspace-item ${activeWorkspace?.id === ws.id ? 'active' : ''}`}
                                            onClick={() => handleWorkspaceSelect(ws)}
                                        >
                                            <div className="workspace-item-avatar">
                                                {ws.name.charAt(0)}
                                            </div>
                                            <div className="workspace-item-info">
                                                <div className="workspace-item-name">{ws.name}</div>
                                                <div className="workspace-item-meta">
                                                    {ws._count?.projects || 0} {ws._count?.projects === 1 ? 'project' : 'projects'}
                                                </div>
                                            </div>
                                            {activeWorkspace?.id === ws.id && <div className="active-dot" />}
                                        </div>
                                    ))}
                                </div>
                                <div className="dropdown-divider" />
                                <button className="dropdown-action-btn" onClick={handleCreateWorkspaceClick}>
                                    <Plus size={16} /> Create New Workspace
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="navbar-center">
                    {navItems.map((item, i) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={i}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                                onClick={item.action}
                            >
                                {item.icon}
                                <span className="nav-label">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="navbar-right">
                    <div className="dashboard-actions-group">
                        <NotificationCenter
                            isOpen={isNotificationOpen}
                            onClose={() => setIsNotificationOpen(false)}
                            onToggle={() => setIsNotificationOpen(!isNotificationOpen)}
                            onViewAll={() => {
                                setIsNotificationOpen(false);
                                setActiveView('NOTIFICATIONS');
                                setSelectedProjectId(null);
                            }}
                        />
                        <div className="navbar-divider" />
                        <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>

                    <div className="user-profile-dropdown" onClick={() => { setActiveView('SETTINGS'); setSelectedProjectId(null); }}>
                        <div className="user-avatar-small overflow-hidden">
                            {user?.avatarUrl ? (
                                <img
                                    src={`${api.defaults.baseURL?.replace('/api', '')}${user.avatarUrl}`}
                                    alt={user.name}
                                    className="avatar-img-cover"
                                    onError={(e) => {
                                        (e.target as any).style.display = 'none';
                                    }}
                                />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="user-info-compact">
                            <span className="user-name-small">{user?.name?.split(' ')[0]}</span>
                            <span className="user-role-badge">{user?.role}</span>
                        </div>
                        <LogOut size={14} className="logout-icon-small" onClick={(e) => { e.stopPropagation(); logout(); }} />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="dashboard-main-content">
                <div className="content-container">
                    <header className="content-header">
                        <div className="header-breadcrumbs">
                            <span className="breadcrumb-root">Dashboard</span>
                            {activeWorkspace && (
                                <>
                                    <span className="breadcrumb-sep">/</span>
                                    <span className="breadcrumb-item">{activeWorkspace.name}</span>
                                </>
                            )}
                            {selectedProjectId && (
                                <>
                                    <span className="breadcrumb-sep">/</span>
                                    <span className="breadcrumb-active">{projects.find(p => p.id === selectedProjectId)?.name}</span>
                                </>
                            )}
                        </div>

                        <div className="header-main-row">
                            <div className="title-group">
                                <h1 className="main-title">
                                    {selectedProjectId
                                        ? projects.find(p => p.id === selectedProjectId)?.name
                                        : activeView === 'SETTINGS' ? 'Settings' : `Overview`}
                                </h1>
                                <p className="main-subtitle">
                                    {selectedProjectId
                                        ? (activeView === 'KANBAN' ? 'Manage your project tasks.' : 'Data and insights.')
                                        : activeView === 'SETTINGS' ? 'Account and preferences.' : "Manage all your projects and workspaces."}
                                </p>
                            </div>

                            <div className="header-actions">
                                {activeView === 'OVERVIEW' && (
                                    <>
                                        <button className="btn btn-primary btn-animated" onClick={() => setIsProjectModalOpen(true)}>
                                            <Plus size={18} /> New Project
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {isLoading ? (
                        <div className="dashboard-loader-full">
                            <div className="spinner-modern" />
                            <p>Syncing your workspace...</p>
                        </div>
                    ) : activeView === 'SETTINGS' ? (
                        <UserSettings />
                    ) : activeView === 'ARCHIVE' ? (
                        <div className="glass-card archive-view">
                            <div className="card-header">
                                <h3 className="card-title">Archived Tasks</h3>
                                <div className="archive-filters">
                                    <select
                                        value={selectedProjectId || ''}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="mini-select"
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="archive-list-container">
                                {archivedTasks.length === 0 ? (
                                    <div className="empty-archive animated-fade-in">
                                        <div className="empty-archive-icon">
                                            <Archive size={48} />
                                        </div>
                                        <h4>No archived tasks</h4>
                                        <p>Tasks you archive from the Kanban board will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="archive-grid">
                                        {archivedTasks.map(task => (
                                            <div key={task.id} className="archive-task-card glass-solid animated-fade-in-up">
                                                <div className="archive-task-header">
                                                    <div
                                                        className="priority-tag"
                                                        style={{ background: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}
                                                    >
                                                        {task.priority || 'MEDIUM'}
                                                    </div>
                                                    <span className="archive-date">
                                                        Archived {new Date(task.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="archive-task-body">
                                                    <h4>{task.title}</h4>
                                                    <p>{task.description || 'No description provided.'}</p>
                                                </div>
                                                <div className="archive-task-footer">
                                                    {canManageTask(task.creatorId) && (
                                                        <button
                                                            className="btn-restore-v2"
                                                            onClick={async () => {
                                                                await unarchiveTask(task.id);
                                                                toast.success('Task restored to board');
                                                            }}
                                                        >
                                                            <RefreshCw size={14} /> Restore to Board
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeView === 'NOTIFICATIONS' ? (
                        <div className="glass-card notification-full-view">
                            <div className="card-header">
                                <h3 className="card-title">All Notifications</h3>
                                <button className="btn btn-outline btn-sm" onClick={() => markAllAsRead()}>
                                    Mark all as read
                                </button>
                            </div>
                            <div className="notification-full-list">
                                {notifications.length === 0 ? (
                                    <p className="empty-text">No notifications yet.</p>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`notification-item-full ${n.isRead ? 'read' : 'unread'}`}>
                                            <div className="notif-header">
                                                <span className="notif-title">{n.title}</span>
                                                <span className="notif-time">{new Date(n.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="notif-message">{n.message}</p>
                                            {n.link && <a href={n.link} className="notif-link">View Details</a>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : activeView === 'MEMBERS' && activeWorkspace ? (
                        <MemberManagement workspaceId={activeWorkspace.id} />
                    ) : (activeView === 'KANBAN' || activeView === 'ANALYTICS') && selectedProjectId ? (
                        activeView === 'KANBAN'
                            ? <KanbanBoard projectId={selectedProjectId} />
                            : <ProjectAnalytics projectId={selectedProjectId} />
                    ) : activeView === 'OVERVIEW' ? (
                        <div className="dashboard-grid-layout">
                            <section className="dashboard-primary-column">
                                <div className="glass-card table-section">
                                    <div className="card-header">
                                        <h3 className="card-title">Projects Overview</h3>
                                        <span className="badge-count">{projects.length} Total</span>
                                    </div>

                                    {!activeWorkspace ? (
                                        <div className="empty-state-illustrative">
                                            <div className="empty-icon-ring"><Folder size={32} /></div>
                                            <h4>No Workspace Detected</h4>
                                            <p>Create a workspace to begin collaborative project management.</p>
                                            <button className="btn btn-outline" onClick={() => setIsWorkspaceModalOpen(true)}>
                                                Create Workspace
                                            </button>
                                        </div>
                                    ) : projects.length === 0 ? (
                                        <div className="empty-state-illustrative">
                                            <div className="empty-icon-ring"><Plus size={32} /></div>
                                            <h4>No Projects Found</h4>
                                            <p>Start by creating your first project in <strong>{activeWorkspace.name}</strong>.</p>
                                            {user?.role === 'ADMIN' && (
                                                <button className="btn btn-primary" onClick={() => setIsProjectModalOpen(true)}>
                                                    Launch New Project
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="modern-table-container">
                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th>Project Name</th>
                                                        <th>Progress</th>
                                                        <th>Tasks</th>
                                                        <th>Created</th>
                                                        <th className="text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {projects.map((p: any) => (
                                                        <tr key={p.id} onClick={() => { setSelectedProjectId(p.id); setActiveView('KANBAN'); }} className="table-row-hover">
                                                            <td data-label="Project">
                                                                <div className="table-cell-project">
                                                                    <div className="project-bullet" style={{ background: 'var(--primary)' }} />
                                                                    <div className="project-info">
                                                                        <span className="project-name">{p.name}</span>
                                                                        <span className="project-desc">{p.description || 'No description provided'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td data-label="Progress">
                                                                <div className="progress-mini">
                                                                    <div className="progress-bar-bg">
                                                                        <div
                                                                            className="progress-bar-fill"
                                                                            style={{
                                                                                width: `${p.totalTasks > 0 ? (p.completedTasks / p.totalTasks) * 100 : 0}%`
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="progress-text">
                                                                        {p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td data-label="Tasks">
                                                                <span className="task-count-pill">{p.totalTasks || 0}</span>
                                                            </td>
                                                            <td data-label="Created" className="table-text-muted">
                                                                {new Date(p.createdAt || Date.now()).toLocaleDateString()}
                                                            </td>
                                                            <td data-label="Actions" className="text-right">
                                                                <div className="table-actions-group" onClick={e => e.stopPropagation()}>
                                                                    <button className="btn-icon-table" onClick={() => { setSelectedProjectId(p.id); setActiveView('KANBAN'); }} title="Open Kanban">
                                                                        <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                                                                    </button>
                                                                    {(activeWorkspace?.ownerId === user?.id || user?.role === 'ADMIN') && (
                                                                        <button
                                                                            className="btn-icon-table"
                                                                            style={{ color: '#ff4d4d' }}
                                                                            onClick={() => {
                                                                                setConfirmModal({
                                                                                    isOpen: true,
                                                                                    title: 'Delete Project',
                                                                                    message: `Remove "${p.name}"? This action cannot be undone.`,
                                                                                    danger: true,
                                                                                    onConfirm: async () => {
                                                                                        try {
                                                                                            await useProjectTaskStore.getState().deleteProject(p.id);
                                                                                            toast.success('Project deleted');
                                                                                        } catch (err) {
                                                                                            toast.error('Failed to delete project');
                                                                                        }
                                                                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                                                    }
                                                                                });
                                                                            }}
                                                                            title="Delete Project"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <aside className="dashboard-secondary-column">
                                <ActivityFeed
                                    workspaceId={activeWorkspace?.id}
                                    limit={8}
                                    isAdmin={members.find(m => m.userId === user?.id)?.role === 'ADMIN'}
                                />

                                <div className="glass-card info-card animated-fade-in-up">
                                    <h4 className="card-subtitle">Quick Access</h4>
                                    <div className="quick-actions-grid">
                                        <button className="quick-btn" onClick={() => { setActiveView('SETTINGS'); setSelectedProjectId(null); }}>
                                            <Settings size={16} /> Preferences
                                        </button>
                                        <button className="quick-btn" onClick={() => setIsSearchOpen(true)}><Search size={16} /> Global Search</button>
                                        <button className="quick-btn" onClick={() => {
                                            setActiveView('ARCHIVE');
                                            setSelectedProjectId(projects[0]?.id || null);
                                        }}>
                                            <Folder size={16} /> Archive Vault
                                        </button>
                                        <button className="quick-btn" onClick={() => {
                                            setIsNotificationOpen(true);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}>
                                            <Bell size={16} /> Manage Alerts
                                        </button>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="empty-state-illustrative">
                            <div className="empty-icon-ring"><Folder size={32} /></div>
                            <h4>Select a Project</h4>
                            <p>Choose a project from the Overview to see details.</p>
                            <button className="btn btn-primary" onClick={() => setActiveView('OVERVIEW')}>Return to Overview</button>
                        </div>
                    )}
                </div>
            </main>

            {/* Dashboard Footer */}
            <footer className="dashboard-footer glass">
                <div className="footer-left">
                    <span className="footer-copyright">© 2026 Nexus Hub. Verified Secure Architecture.</span>
                </div>
                <div className="footer-right">
                    <div className="footer-links-row">
                        <button className="footer-link-btn" onClick={() => setInfoModal({ isOpen: true, type: 'DOCS' })}>Documentation</button>
                        <button className="footer-link-btn" onClick={() => setInfoModal({ isOpen: true, type: 'PRIVACY' })}>Privacy</button>
                        <button className="footer-link-btn" onClick={() => setInfoModal({ isOpen: true, type: 'SUPPORT' })}>Support</button>
                    </div>
                </div>
            </footer>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                danger={confirmModal.danger}
                confirmText="Delete"
            />

            {/* Modals */}
            <CreateWorkspaceModal isOpen={isWorkspaceModalOpen} onClose={() => setIsWorkspaceModalOpen(false)} />
            {
                activeWorkspace && (
                    <CreateProjectModal
                        isOpen={isProjectModalOpen}
                        onClose={() => setIsProjectModalOpen(false)}
                        workspaceId={activeWorkspace.id}
                        onSuccess={() => fetchProjects(activeWorkspace.id)}
                    />
                )
            }

            {
                isSearchOpen && (
                    <SearchOverlay
                        isOpen={isSearchOpen}
                        onClose={() => setIsSearchOpen(false)}
                        onSelectTask={(task) => {
                            setSelectedTask(task);
                            setIsSearchOpen(false);
                        }}
                    />
                )
            }
            <KeyboardShortcuts
                onSearch={() => setIsSearchOpen(true)}
                onNewTask={() => selectedProjectId && setIsProjectModalOpen(true)}
                onNewProject={() => setIsProjectModalOpen(true)}
            />
            <InfoModals
                isOpen={infoModal.isOpen}
                type={infoModal.type}
                onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
            />
            {
                selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={() => selectedProjectId && fetchProjects(activeWorkspace?.id || '')}
                    />
                )
            }

            {/* Mobile Navigation Sidebar */}
            {isMobileNavOpen && (
                <>
                    <div className="mobile-menu-overlay" onClick={() => setIsMobileNavOpen(false)} />
                    <div className="mobile-menu-sidebar">
                        <div className="mobile-menu-header">
                            <div className="dashboard-logo">
                                NEXUS<span className="dashboard-logo-accent">.</span>
                            </div>
                            <button onClick={() => setIsMobileNavOpen(false)} className="mobile-menu-close">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mobile-user-profile">
                            <div className="user-avatar-small">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="user-info-text">
                                <span className="user-name">{user?.name}</span>
                                <span className="user-email">{user?.email}</span>
                            </div>
                        </div>
                        <nav className="mobile-menu-nav">
                            {navItems.map((item, i) => {
                                const isActive = activeView === item.id;
                                return (
                                    <button
                                        key={i}
                                        className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            item.action();
                                            setIsMobileNavOpen(false);
                                        }}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                        <div className="mobile-menu-footer">
                            <button
                                className="mobile-nav-item logout-item"
                                onClick={() => {
                                    logout();
                                    setIsMobileNavOpen(false);
                                }}
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div >

    );
};

export default Dashboard;
