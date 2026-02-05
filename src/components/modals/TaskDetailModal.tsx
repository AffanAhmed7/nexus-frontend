import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare, History, AlertCircle, Trash2, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api.js';
import { socket } from '../../utils/socket.js';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useProjectTaskStore } from '../../store/projectTaskStore';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import '../../styles/modals/TaskDetailModal.css';

interface TaskDetailModalProps {
    task: any;
    onClose: () => void;
    onUpdate: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task: initialTask, onClose, onUpdate }) => {
    // Source task data from the store to ensure we have the latest version (including assignee updates)
    const taskIndex = useProjectTaskStore(state => state.tasks.findIndex(t => t.id === initialTask.id));
    const storeTask = useProjectTaskStore(state => state.tasks[taskIndex]);
    const task = storeTask || initialTask;

    const [comments, setComments] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const user = useAuthStore(state => state.user);
    const members = useWorkspaceStore(state => state.members);
    const deleteTask = useProjectTaskStore(state => state.deleteTask);
    const archiveTask = useProjectTaskStore(state => state.archiveTask);

    const canDelete = () => {
        if (!user) return false;
        const workspaceMembers = useWorkspaceStore.getState().members;
        const isAdmin = workspaceMembers.find(m => m.userId === user.id)?.role === 'ADMIN';
        return isAdmin || task.creatorId === user.id;
    };

    const canAssign = () => {
        if (!user) return false;
        const workspaceMembers = useWorkspaceStore.getState().members;
        return workspaceMembers.find(m => m.userId === user.id)?.role === 'ADMIN';
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteTask(task.id);
            toast.success('Task deleted');
            setShowDeleteConfirm(false);
            onClose();
        } catch (err) {
            toast.error('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleArchive = async () => {
        setLoading(true);
        try {
            await archiveTask(task.id);
            toast.success('Task archived');
            onClose();
        } catch (err) {
            toast.error('Failed to archive task');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
        fetchHistory();

        socket.on('comment_added', (data) => {
            if (data.taskId === task.id) fetchComments();
        });

        socket.on('comment_deleted', (data) => {
            if (data.taskId === task.id) fetchComments();
        });

        return () => {
            socket.off('comment_added');
            socket.off('comment_deleted');
        };
    }, [task.id]);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/comments/task/${task.id}`);
            setComments(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/tasks/${task.id}/history`);
            setHistory(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            // Correct API route is /comments, with taskId in the body
            await api.post('/comments', {
                text: newComment,
                taskId: task.id
            });
            setNewComment('');
            toast.success('Comment added');
            // Optimistic update or wait for socket is handled by manual fetch here for safety
            fetchComments();
        } catch (err: any) {
            console.error('Failed to add comment:', err.response?.data || err);
            toast.error(err.response?.data?.message || 'Failed to add comment');
        }
        finally { setLoading(false); }
    };

    const handleDeleteCommentClick = (commentId: string) => {
        setCommentToDelete(commentId);
    };

    const confirmDeleteComment = async () => {
        if (!commentToDelete) return;
        try {
            await api.delete(`/comments/${commentToDelete}`);
            toast.success('Comment deleted');
            fetchComments();
            setCommentToDelete(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete comment');
        }
    };

    const handleAssigneeChange = async (userId: string) => {
        setLoading(true);
        try {
            await useProjectTaskStore.getState().updateTask(task.id, { assigneeId: userId === 'unassigned' ? null : userId });
            toast.success('Assignee updated');
            onUpdate();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update assignee');
        } finally {
            setLoading(false);
        }
    };

    const handleDueDateChange = async (dateStr: string) => {
        try {
            await useProjectTaskStore.getState().updateTask(task.id, {
                dueDate: dateStr ? new Date(dateStr).toISOString() : null
            });
            toast.success('Due date updated');
            onUpdate();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update date');
        }
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

    return (
        <Modal isOpen={true} onClose={onClose} maxWidth="1000px">
            <div className="task-detail-container">
                {/* Main Content */}
                <div className="task-main-pane">
                    <div className="task-header-area">
                        <div className="task-id-badge">
                            Task #{taskIndex + 1}
                        </div>
                        <h2 className="task-title-main">{task.title}</h2>
                    </div>

                    <div className="task-desc-section">
                        <label className="section-label">Description</label>
                        <div className="task-desc-box">
                            {task.description || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No description provided.</span>}
                        </div>
                    </div>

                    <div className="task-tabs">
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`task-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                        >
                            <MessageSquare size={16} /> Comments ({comments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`task-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        >
                            <History size={16} /> History
                        </button>
                    </div>

                    {activeTab === 'comments' ? (
                        <div className="comments-area">
                            <div className="comments-list custom-scrollbar">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="comment-item">
                                        <div className="comment-avatar">
                                            {comment.author?.name?.[0] || '?'}
                                        </div>
                                        <div className="comment-bubble">
                                            <div className="comment-meta">
                                                <span className="comment-user">{comment.author?.name || 'Unknown User'}</span>
                                                <span className="comment-time">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                                            </div>
                                            <p className="comment-text">{comment.text}</p>
                                        </div>
                                        {(canDelete() || comment.authorId === user?.id) && (
                                            <button
                                                className="comment-delete-btn"
                                                onClick={() => handleDeleteCommentClick(comment.id)}
                                                title="Delete comment"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {comments.length === 0 && (
                                    <div className="search-empty">
                                        <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                                        <p style={{ fontSize: '14px' }}>No comments yet.</p>
                                    </div>
                                )}
                            </div>
                            <div className="comment-post-container">
                                <div className="comment-input-area">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="comment-textarea"
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                                    />
                                    <div className="comment-actions">
                                        <button
                                            onClick={handleAddComment}
                                            disabled={loading || !newComment.trim()}
                                            className="btn-primary comment-submit-btn"
                                        >
                                            {loading ? "..." : "Post Comment"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="history-list space-y-4">
                            {history.map((item) => (
                                <div key={item.id} className="history-item flex items-start gap-4">
                                    <div className="history-avatar">
                                        {item.user?.name?.[0] || '?'}
                                    </div>
                                    <div className="history-content">
                                        <p className="history-text">
                                            <span className="history-user-name">{item.user?.name || 'Someone'}</span>{' '}
                                            <span className="history-action">{item.action.toLowerCase().replace(/_/g, ' ')}</span>
                                        </p>
                                        <p className="history-time">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <div className="search-empty">
                                    <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                                    <p style={{ fontSize: '14px' }}>No activity recorded.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="task-sidebar">
                    <section className="sidebar-item">
                        <label className="section-label">Priority</label>
                        <div className="item-value-box">
                            <div className="priority-indicator" style={{ color: getPriorityColor(task.priority) }}>
                                <AlertCircle size={16} />
                                {task.priority || 'MEDIUM'}
                            </div>
                        </div>
                    </section>

                    <section className="sidebar-item">
                        <label className="section-label">Assignee</label>
                        {canAssign() ? (
                            <div className="item-value-box select-wrapper">
                                <select
                                    className="assignee-select"
                                    value={task.assigneeId || 'unassigned'}
                                    onChange={(e) => handleAssigneeChange(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="unassigned">Unassigned</option>
                                    {useWorkspaceStore.getState().members.map(m => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.user.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="select-chevron" />
                            </div>
                        ) : (
                            <div className="item-value-box assignee-box">
                                <div className="assignee-avatar">
                                    {task.assignee?.name?.[0] || '?'}
                                </div>
                                <div className="assignee-info">
                                    <p>{task.assignee?.name || 'Unassigned'}</p>
                                    <span>{task.assignee?.email || 'No email'}</span>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="sidebar-item">
                        <label className="section-label">Dates</label>
                        <div className="space-y-4">
                            <div className="date-row">
                                <Calendar size={16} style={{ color: '#6b7280' }} />
                                <div>
                                    <div className="date-label">Due Date</div>
                                    <input
                                        type="date"
                                        className="date-picker-input"
                                        value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleDueDateChange(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="date-row">
                                <Clock size={16} style={{ color: '#6b7280' }} />
                                <div>
                                    <div className="date-label">Created</div>
                                    <div className="date-value">{new Date(task.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="archive-btn-area">
                        {canDelete() && (
                            <button
                                className="btn-archive"
                                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: '12px' }}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 size={16} /> Delete Task
                            </button>
                        )}
                        {canDelete() && (
                            <button
                                className="btn-archive"
                                onClick={handleArchive}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Archive Task'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Task"
                message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                confirmText="Delete"
                danger
                loading={isDeleting}
            />

            <ConfirmationModal
                isOpen={!!commentToDelete}
                onClose={() => setCommentToDelete(null)}
                onConfirm={confirmDeleteComment}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </Modal>
    );
};

export default TaskDetailModal;
