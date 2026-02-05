import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, User, Calendar, Tag } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore.js';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api.js';
import Modal from './Modal';
import { toast } from 'react-hot-toast';
import '../../styles/modals/CreateTaskModal.css';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    initialStatus?: string;
    onSuccess: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, projectId, initialStatus = 'TODO', onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [assigneeId, setAssigneeId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);

    const { activeWorkspace } = useWorkspaceStore();
    const { user } = useAuthStore();

    const isAdmin = () => {
        if (!user || !activeWorkspace) return false;
        if (activeWorkspace.ownerId === user.id) return true;
        // Check members from store or activeWorkspace
        const workspaceMembers = useWorkspaceStore.getState().members;
        const member = workspaceMembers.find(m => m.userId === user.id);
        return member?.role === 'ADMIN';
    };

    useEffect(() => {
        if (isOpen && activeWorkspace) {
            fetchMembers();
        }
    }, [isOpen, activeWorkspace]);

    const fetchMembers = async () => {
        try {
            const res = await api.get(`/workspaces/${activeWorkspace?.id}/members`);
            setMembers(res.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Title is required');
            return;
        }

        setLoading(true);
        try {
            await api.post('/tasks', {
                title,
                description,
                priority,
                assigneeId: assigneeId || null,
                dueDate: dueDate || null,
                projectId,
                status: initialStatus
            });

            toast.success('Task created successfully');
            onSuccess();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setPriority('MEDIUM');
            setAssigneeId('');
            setDueDate('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" maxWidth="600px">
            <form onSubmit={handleSubmit} className="task-form">
                <div className="task-field">
                    <label>Task Title</label>
                    <input
                        type="text"
                        placeholder="What needs to be done?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="task-input title-field"
                        autoFocus
                        required
                    />
                </div>

                <div className="task-field">
                    <label>Description</label>
                    <textarea
                        placeholder="Add more details about this task..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="task-textarea"
                    />
                </div>

                <div className="task-grid">
                    <div className="task-field">
                        <label><AlertCircle size={14} /> Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="task-select"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    {isAdmin() ? (
                        <div className="task-field">
                            <label><User size={14} /> Assignee</label>
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="task-select"
                            >
                                <option value="">Unassigned</option>
                                {useWorkspaceStore.getState().members.filter(m => m.status === 'ACCEPTED').map(member => (
                                    <option key={member.id} value={member.userId}>
                                        {member.user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="task-field">
                            <label><User size={14} /> Assignee</label>
                            <div className="task-input task-readonly">
                                Unassigned (Only Admins can assign)
                            </div>
                        </div>
                    )}

                    <div className="task-field">
                        <label><Calendar size={14} /> Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="task-input"
                        />
                    </div>

                    <div className="task-field">
                        <label><Tag size={14} /> Status</label>
                        <div className="task-input task-readonly">
                            {initialStatus.replace('_', ' ')}
                        </div>
                    </div>
                </div>

                <div className="task-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="task-btn-cancel"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ flex: 2 }}
                    >
                        {loading ? "Creating..." : <><Plus size={18} /> Create Task</>}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateTaskModal;
