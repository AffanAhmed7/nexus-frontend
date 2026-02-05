import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle, MessageSquare, Trash2 } from 'lucide-react';
import api from '../../utils/api.js';
import { formatDistanceToNow } from 'date-fns';
import ConfirmationModal from '../modals/ConfirmationModal';
import '../../styles/ActivityFeed.css';

interface ActivityFeedProps {
    projectId?: string;
    workspaceId?: string;
    limit?: number;
    isAdmin?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ projectId, workspaceId, limit = 10, isAdmin = false }) => {
    const [showClearConfirm, setShowClearConfirm] = React.useState(false);
    const { data: activities, isLoading, refetch } = useQuery({
        queryKey: ['activities', projectId, workspaceId],
        queryFn: async () => {
            let url = '';
            if (projectId) {
                url = `/audit/project/${projectId}`;
            } else if (workspaceId) {
                url = `/audit/workspace/${workspaceId}`;
            } else {
                return [];
            }
            const res = await api.get(url);
            return res.data.slice(0, limit);
        },
        enabled: !!(projectId || workspaceId),
        refetchInterval: 30000,
    });

    const handleClearLogs = async () => {
        setShowClearConfirm(true);
    };

    const confirmClearLogs = async () => {

        try {
            if (projectId) {
                await api.delete(`/audit/project/${projectId}`);
            } else if (workspaceId) {
                await api.delete(`/audit/workspace/${workspaceId}`);
            }
            refetch();
        } catch (error) {
            console.error('Failed to clear logs', error);
        } finally {
            setShowClearConfirm(false);
        }
    };

    if (isLoading) {
        return (
            <div className="activity-feed">
                <div className="activity-feed-header">
                    <Activity size={18} />
                    <h3>Recent Activity</h3>
                </div>

                <div className="activity-feed-list">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="activity-item skeleton">
                            <div className="skeleton-avatar" />
                            <div className="activity-content">
                                <div className="skeleton-text skeleton-text-lg" />
                                <div className="skeleton-text skeleton-text-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const getActivityIcon = (action: string) => {
        if (action.includes('CREATED') || action.includes('ASSIGNED')) {
            return <CheckCircle size={16} className="activity-icon-primary" />;
        }
        if (action.includes('COMMENT')) {
            return <MessageSquare size={16} className="activity-icon-warning" />;
        }
        return <Activity size={16} className="activity-icon-muted" />;
    };

    return (
        <div className="activity-feed">
            <div className="activity-feed-header">
                <Activity size={18} />
                <h3>Recent Activity</h3>
                {isAdmin && (activities && activities.length > 0) && (
                    <button
                        onClick={handleClearLogs}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        title="Clear Activity Log"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            <div className="activity-feed-list">
                {activities && activities.length > 0 ? (
                    activities.map((activity: any) => (
                        <div key={activity.id} className="activity-item">
                            <div className="activity-icon">
                                {getActivityIcon(activity.action)}
                            </div>

                            <div className="activity-content">
                                <p className="activity-text">
                                    <span className="activity-user">
                                        {activity.user?.name || 'Unknown'}
                                    </span>{' '}
                                    <span className="activity-action">
                                        {(() => {
                                            const act = activity.action;
                                            if (act === 'CREATED') return 'created';
                                            if (act === 'ARCHIVED') return 'archived';
                                            if (act === 'UNARCHIVED') return 'restored';
                                            if (act === 'COMMENT_ADDED') return 'commented on';
                                            if (act === 'ASSIGNED') return 'was assigned to';
                                            if (act === 'UNASSIGNED') return 'was unassigned from';
                                            if (act.startsWith('MOVED_TO_')) {
                                                return `changed status to ${act.replace('MOVED_TO_', '').replace('_', ' ')}`;
                                            }
                                            return 'updated';
                                        })()}
                                    </span>

                                    {activity.task && (
                                        <span className="activity-task">
                                            {' '}task <strong>{activity.task.title?.substring(0, 30)}</strong>
                                        </span>
                                    )}
                                </p>

                                <span className="activity-time">
                                    {formatDistanceToNow(new Date(activity.createdAt))} ago
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="activity-empty">
                        <Activity size={32} className="activity-empty-icon" />
                        <p>No recent activity</p>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={confirmClearLogs}
                title="Clear Activity Log"
                message="Are you sure? This will clear the activity history for EVERYONE in this view. This action cannot be undone."
                confirmText="Clear Log"
                danger={true}
            />
        </div>
    );
};

export default ActivityFeed;
