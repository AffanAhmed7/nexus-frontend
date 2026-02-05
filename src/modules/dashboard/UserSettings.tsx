import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { User, Shield, Bell, HardDrive, Save, Camera, Check, X, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import '../../styles/UserSettings.css';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const UserSettings = () => {
    const { user, updateUser, deleteAccount } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRemoveAvatarModalOpen, setIsRemoveAvatarModalOpen] = useState(false);

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Notification State
    const [notificationPrefs, setNotificationPrefs] = useState({
        email: user?.notificationPrefs?.email ?? true,
        inApp: user?.notificationPrefs?.inApp ?? true,
        taskAssigned: user?.notificationPrefs?.taskAssigned ?? true,
        taskComment: user?.notificationPrefs?.taskComment ?? true
    });

    useEffect(() => {
        if (user) {
            setName(user.name);
            setNotificationPrefs({
                email: user.notificationPrefs?.email ?? true,
                inApp: user.notificationPrefs?.inApp ?? true,
                taskAssigned: user.notificationPrefs?.taskAssigned ?? true,
                taskComment: user.notificationPrefs?.taskComment ?? true
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.patch('/auth/update-profile', { name });
            updateUser(res.data);
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.patch('/auth/update-profile', { notificationPrefs });
            updateUser(res.data);
            toast.success('Notification preferences saved');
        } catch (err) {
            toast.error('Failed to save preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccountFinal = async () => {
        const secondConfirmation = window.prompt("Type 'DELETE' to confirm account deletion:");
        if (secondConfirmation === 'DELETE') {
            setLoading(true);
            try {
                await deleteAccount();
                toast.success('Account deleted successfully. Goodbye!');
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to delete account');
                setLoading(false);
            }
        }
        setIsDeleteModalOpen(false);
    };

    const sections = [
        { id: 'profile', label: 'Profile Settings', icon: <User size={18} /> },
        { id: 'security', label: 'Security', icon: <Shield size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    ];

    const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
        <div className="toggle-container">
            <span className="toggle-label">{label}</span>
            <div
                onClick={onChange}
                className={`toggle-switch ${checked ? 'active' : ''}`}
            >
                <div className="toggle-thumb" />
            </div>
        </div>
    );

    return (
        <div className="user-settings-container">
            <div className="user-settings-layout">
                {/* Sidebar */}
                <aside className="settings-sidebar">
                    <div className="settings-nav">
                        {sections.map((s: any) => (
                            <button
                                key={s.id}
                                onClick={() => setActiveTab(s.id as any)}
                                className={`settings-nav-item ${activeTab === s.id ? 'active' : ''}`}
                            >
                                {s.icon}
                                {s.label}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Content */}
                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="glass animate-fade-in settings-section">
                            <h2 className="settings-title">Personal Information</h2>

                            <form onSubmit={handleUpdateProfile}>
                                <div className="profile-photo-section">
                                    <div className="profile-avatar-wrapper">
                                        <div className="profile-avatar overflow-hidden">
                                            {user?.avatarUrl ? (
                                                <img
                                                    src={`${api.defaults.baseURL?.replace('/api', '')}${user.avatarUrl}`}
                                                    alt={user.name}
                                                    className="profile-avatar-img"
                                                    onError={(e) => {
                                                        (e.target as any).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                user?.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="profile-avatar-edit-btn"
                                            onClick={() => document.getElementById('avatar-input')?.click()}
                                        >
                                            <Camera size={14} />
                                        </button>
                                        <input
                                            type="file"
                                            id="avatar-input"
                                            hidden
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const formData = new FormData();
                                                formData.append('avatar', file);

                                                setLoading(true);
                                                try {
                                                    const res = await api.post('/auth/upload-avatar', formData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    updateUser(res.data);
                                                    toast.success('Avatar updated successfully');
                                                } catch (err) {
                                                    toast.error('Failed to upload avatar');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                        />
                                        {user?.avatarUrl && (
                                            <button
                                                type="button"
                                                className="profile-avatar-remove-btn"
                                                onClick={() => setIsRemoveAvatarModalOpen(true)}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    right: '-32px',
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: '#ef4444',
                                                    border: '2px solid #1e293b',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title="Remove profile picture"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="profile-photo-info">
                                        <h4>Profile Photo</h4>
                                        <p>This will be displayed on your profile and tasks.</p>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <div className="form-field">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="glass form-input"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            value={user?.email}
                                            disabled
                                            className="form-input"
                                        />
                                        <p className="form-hint">Email cannot be changed currently.</p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary form-submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="glass animate-fade-in settings-section">
                            <h2 className="settings-title">Security Settings</h2>
                            <form onSubmit={handleChangePassword}>
                                <div className="form-section">
                                    <div className="form-field">
                                        <label className="form-label">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="glass form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="glass form-input"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="glass form-input"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary form-submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : <><Save size={18} /> Update Password</>}
                                </button>
                            </form>

                            <div className="danger-zone" style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <h3 className="danger-zone-title" style={{ color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={18} /> Danger Zone
                                </h3>
                                <p className="danger-zone-desc" style={{ opacity: 0.6, fontSize: '14px', marginBottom: '16px' }}>
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="btn"
                                    style={{ background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)' }}
                                    disabled={loading}
                                >
                                    <Trash2 size={18} /> Delete Account
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="glass animate-fade-in settings-section">
                            <h2 className="settings-title">Notification Preferences</h2>
                            <p className="settings-subtitle">Manage how and when you want to be notified.</p>

                            <div className="notification-section">
                                <h4 className="notification-section-title">Channels</h4>
                                <Toggle
                                    label="Email Notifications"
                                    checked={notificationPrefs.email}
                                    onChange={() => setNotificationPrefs(prev => ({ ...prev, email: !prev.email }))}
                                />
                                <Toggle
                                    label="In-App Notifications"
                                    checked={notificationPrefs.inApp}
                                    onChange={() => setNotificationPrefs(prev => ({ ...prev, inApp: !prev.inApp }))}
                                />
                            </div>

                            <div className="notification-section">
                                <h4 className="notification-section-title">Events</h4>
                                <Toggle
                                    label="When a task is assigned to me"
                                    checked={notificationPrefs.taskAssigned}
                                    onChange={() => setNotificationPrefs(prev => ({ ...prev, taskAssigned: !prev.taskAssigned }))}
                                />
                                <Toggle
                                    label="When someone comments on my task"
                                    checked={notificationPrefs.taskComment}
                                    onChange={() => setNotificationPrefs(prev => ({ ...prev, taskComment: !prev.taskComment }))}
                                />
                            </div>

                            <button
                                onClick={handleSaveNotifications}
                                className="btn btn-primary form-submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : <><Save size={18} /> Save Preferences</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccountFinal}
                title="Permanently Delete Account?"
                message="This is a critical action. All your projects, tasks, and data will be erased forever. This cannot be undone."
                danger={true}
                confirmText="Yes, Delete Everything"
            />

            <ConfirmationModal
                isOpen={isRemoveAvatarModalOpen}
                onClose={() => setIsRemoveAvatarModalOpen(false)}
                onConfirm={async () => {
                    setLoading(true);
                    try {
                        const res = await api.delete('/auth/avatar');
                        updateUser(res.data);
                        toast.success('Avatar removed');
                    } catch (err) {
                        toast.error('Failed to remove avatar');
                    } finally {
                        setLoading(false);
                        setIsRemoveAvatarModalOpen(false);
                    }
                }}
                title="Remove Profile Picture?"
                message="Are you sure you want to remove your profile picture? This will revert your avatar to your initials."
                danger={true}
                confirmText="Yes, Remove Picture"
            />
        </div>
    );
};

export default UserSettings;
