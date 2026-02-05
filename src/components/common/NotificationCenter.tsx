import React, { useState } from 'react';
import { Bell, CheckCircle, Clock, ExternalLink, MailOpen, RefreshCw, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useWorkspaceStore } from '../../store/workspaceStore.js';
import { useProjectTaskStore } from '../../store/projectTaskStore.js';
import ConfirmationModal from '../modals/ConfirmationModal';
import '../../styles/modals/NotificationCenter.css';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onToggle: () => void;
    onViewAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, onToggle, onViewAll }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotificationStore();
    const { respondToInvitation, fetchWorkspaces } = useWorkspaceStore();
    const { fetchProjects } = useProjectTaskStore();

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const refreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchNotifications(),
            fetchWorkspaces(),
        ]);
        setIsRefreshing(false);
    };

    const handleInviteResponse = async (n: any, accept: boolean) => {
        const workspaceId = new URLSearchParams(n.link?.split('?')[1]).get('workspaceId');
        if (workspaceId) {
            await respondToInvitation(workspaceId, accept);
            markAsRead(n.id);
        }
    };

    const displayNotifications = notifications;
    const effectiveUnreadCount = unreadCount;

    return (
        <div className="notification-center-wrapper">
            <button
                onClick={onToggle}
                className="btn-icon notification-trigger"
            >
                <Bell size={18} className={effectiveUnreadCount > 0 ? 'bell-glow' : ''} />
                {effectiveUnreadCount > 0 && (
                    <span className="notification-badge-mini">
                        {effectiveUnreadCount > 9 ? '9+' : effectiveUnreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="dropdown-overlay"
                        onClick={onClose}
                    />
                    <div className="notification-dropdown-portal">
                        <header className="dropdown-header">
                            <button
                                onClick={refreshAll}
                                className={`refresh-btn-v2 ${isRefreshing ? 'spinning' : ''}`}
                                disabled={isRefreshing}
                                title="Refresh all data"
                            >
                                <RefreshCw size={14} />
                            </button>

                            <h4 className="dropdown-title">
                                Notifications
                                {effectiveUnreadCount > 0 && (
                                    <span className="title-unread-count">
                                        {effectiveUnreadCount}
                                    </span>
                                )}
                            </h4>

                            <div className="header-right-actions">
                                {effectiveUnreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="mark-all-btn"
                                        title="Mark all as read"
                                    >
                                        <MailOpen size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="mark-all-btn"
                                    title="Clear all notifications"
                                    style={{ marginLeft: '4px', color: '#ef4444' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="mark-all-btn close-dropdown-btn"
                                    title="Close"
                                    style={{ marginLeft: '4px' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </header>

                        <div className="notification-list">
                            {displayNotifications.length === 0 ? (
                                <div className="notification-empty-state">
                                    <Bell size={40} className="empty-bell-icon" />
                                    <p>All caught up for now!</p>
                                </div>
                            ) : (
                                displayNotifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            if (!n.isRead && n.type !== 'INVITATION') markAsRead(n.id);
                                        }}
                                        className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                                    >
                                        <div className="unread-dot-container">
                                            {!n.isRead && <div className="unread-dot" />}
                                        </div>
                                        <div className="item-icon-wrapper">
                                            {n.type === 'TASK_ASSIGNED' ? <CheckCircle size={16} color="#6366f1" /> :
                                                n.type === 'INVITATION' ? <MailOpen size={16} color="#10b981" /> :
                                                    <Clock size={16} color="#f59e0b" />}
                                        </div>
                                        <div className="item-details">
                                            <div className="item-header">
                                                <span className="item-title">{n.title}</span>
                                            </div>
                                            <p className="item-message">{n.message}</p>
                                            <div className="item-footer">
                                                <span className="item-time">
                                                    <Clock size={10} /> {formatDistanceToNow(new Date(n.createdAt))} ago
                                                </span>
                                            </div>
                                            {(n.type === 'INVITATION' || n.title?.includes('Invitation')) && (
                                                <div className="invitation-actions" onClick={e => e.stopPropagation()}>
                                                    {!n.isRead ? (
                                                        <>
                                                            <button
                                                                className="invite-btn accept"
                                                                onClick={() => handleInviteResponse(n, true)}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                className="invite-btn decline"
                                                                onClick={() => handleInviteResponse(n, false)}
                                                            >
                                                                Decline
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="item-time">Invitation Processed</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="dropdown-footer-link" onClick={onViewAll}>
                            View All Notifications
                        </div>
                    </div>
                </>
            )}

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={() => {
                    useNotificationStore.getState().clearAllNotifications();
                    setShowClearConfirm(false);
                }}
                title="Clear Notifications"
                message="Are you sure you want to clear all notifications? This action cannot be undone."
                confirmText="Clear All"
                danger={true}
            />
        </div>
    );
};

export default NotificationCenter;
