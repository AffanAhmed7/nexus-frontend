import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { UserPlus, Shield, User, Mail, MoreVertical, Check, X, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api.js';
import '../../styles/MemberManagement.css';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const MemberManagement = ({ workspaceId }: { workspaceId: string }) => {
    const { members, fetchMembers, inviteUser, updateMemberRole, removeMember, deleteWorkspace, activeWorkspace } = useWorkspaceStore();
    const { user } = useAuthStore();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
    const [isInviting, setIsInviting] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'REMOVE_MEMBER' | 'DELETE_WORKSPACE';
        userId: string | null;
    }>({ isOpen: false, type: 'REMOVE_MEMBER', userId: null });

    useEffect(() => {
        if (workspaceId) {
            fetchMembers(workspaceId);
        }
    }, [workspaceId, fetchMembers]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsInviting(true);
        try {
            await inviteUser(workspaceId, email, role);
            toast.success('Invitation sent successfully!');
            setEmail('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRoleChange = async (targetUserId: string, newRole: string) => {
        try {
            await updateMemberRole(workspaceId, targetUserId, newRole);
            toast.success('Member role updated');
        } catch (error: any) {
            toast.error('Failed to update role');
        }
    };

    const handleConfirmAction = async () => {
        if (confirmModal.type === 'REMOVE_MEMBER') {
            if (!confirmModal.userId) return;
            try {
                await removeMember(workspaceId, confirmModal.userId);
                toast.success('Member removed');
            } catch (error: any) {
                toast.error('Failed to remove member');
            }
        } else if (confirmModal.type === 'DELETE_WORKSPACE') {
            try {
                await deleteWorkspace(workspaceId);
                toast.success('Workspace deleted');
            } catch (error: any) {
                toast.error('Failed to delete workspace');
            }
        }
        setConfirmModal({ isOpen: false, type: 'REMOVE_MEMBER', userId: null });
    };

    const isAdmin = members.find(m => m.userId === user?.id)?.role === 'ADMIN';

    return (
        <div className="member-management-container">
            {isAdmin && (
                <section className="invite-section animated-fade-in">
                    <div className="section-header-compact">
                        <UserPlus size={18} color="var(--primary)" />
                        <h3 className="card-title">Invite Team Member</h3>
                    </div>
                    <form className="invite-form" onSubmit={handleInvite}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="email"
                                placeholder="team.member@nexus.hub"
                                className="invite-input"
                                style={{ paddingLeft: '40px' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <select
                            className="role-select"
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                        >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <button className="btn btn-primary" type="submit" disabled={isInviting}>
                            {isInviting ? <Loader2 className="spinner-mini" /> : 'Send Invite'}
                        </button>
                    </form>
                </section>
            )}

            <section className="members-list-section">
                <div className="card-header">
                    <h3 className="card-title">Workspace Members</h3>
                    <span className="badge-count">{members.length} Total</span>
                </div>

                <div className="members-grid">
                    {members.map((member) => (
                        <div key={member.id} className="member-card">
                            <div className="member-info">
                                <div className="member-avatar overflow-hidden">
                                    {member.user.avatarUrl ? (
                                        <img
                                            src={`${api.defaults.baseURL?.replace('/api', '')}${member.user.avatarUrl}`}
                                            alt={member.user.name}
                                            className="avatar-img-cover"
                                            onError={(e) => {
                                                (e.target as any).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        member.user.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="member-details">
                                    <span className="member-name">
                                        {member.user.name}
                                        {member.userId === user?.id && <span style={{ opacity: 0.5, fontSize: '12px' }}> (You)</span>}
                                    </span>
                                    <span className="member-email">{member.user.email}</span>
                                </div>
                            </div>

                            <div className="member-actions">
                                <span className={`status-pill ${member.status.toLowerCase()}`}>
                                    {member.status}
                                </span>

                                {isAdmin && member.userId !== user?.id ? (
                                    <div className="role-select-wrapper">
                                        <select
                                            className={`role-badge ${member.role.toLowerCase()}`}
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                        >
                                            <option value="MEMBER">MEMBER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                ) : (
                                    <span className={`role-badge ${member.role.toLowerCase()}`}>
                                        {member.role}
                                    </span>
                                )}

                                {isAdmin && member.userId !== user?.id && (
                                    <button
                                        className="remove-member-btn"
                                        onClick={() => setConfirmModal({ isOpen: true, type: 'REMOVE_MEMBER', userId: member.userId })}
                                        title="Remove member"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {isAdmin && (
                <section className="danger-zone-section animated-fade-in">
                    <div className="danger-zone-header">
                        <AlertTriangle size={20} color="#ef4444" />
                        <h3 className="danger-title">Danger Zone</h3>
                    </div>
                    <div className="danger-zone-card">
                        <div className="danger-info">
                            <h4 className="danger-action-name">Delete this workspace</h4>
                            <p className="danger-action-desc">
                                Once you delete a workspace, there is no going back. Please be certain.
                                All projects, tasks, and data within <strong>{activeWorkspace?.name}</strong> will be permanently removed.
                            </p>
                        </div>
                        <button
                            className="btn btn-danger-outline"
                            onClick={() => setConfirmModal({ isOpen: true, type: 'DELETE_WORKSPACE', userId: null })}
                        >
                            Delete Workspace
                        </button>
                    </div>
                </section>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, type: 'REMOVE_MEMBER', userId: null })}
                onConfirm={handleConfirmAction}
                title={confirmModal.type === 'DELETE_WORKSPACE' ? 'Delete Workspace' : 'Remove Member'}
                message={confirmModal.type === 'DELETE_WORKSPACE'
                    ? `Are you sure you want to delete "${activeWorkspace?.name}"? All associated data will be permanently wiped.`
                    : "Are you sure you want to remove this member from the workspace? They will lose access to all projects and tasks."
                }
                danger={true}
                confirmText={confirmModal.type === 'DELETE_WORKSPACE' ? 'Delete Permanently' : 'Remove'}
            />
        </div>
    );
};

export default MemberManagement;
