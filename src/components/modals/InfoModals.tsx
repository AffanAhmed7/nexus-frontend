import React from 'react';
import { Book, Shield, LifeBuoy } from 'lucide-react';
import Modal from './Modal';
import '../../styles/modals/InfoModals.css';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'DOCS' | 'PRIVACY' | 'SUPPORT';
}

const InfoModals: React.FC<InfoModalProps> = ({ isOpen, onClose, type }) => {
    const content = {
        DOCS: {
            title: 'Nexus Hub Documentation',
            subtitle: 'Master the ultimate productivity engine.',
            icon: <Book size={28} />,
            body: (
                <div className="info-modal-body academic-scroll">
                    <div className="info-section">
                        <h4>Getting Started</h4>
                        <p>Nexus is organized into <strong>Workspaces</strong> and <strong>Projects</strong>. Create a Workspace to bring your team together, then start a Project to house your tasks.</p>
                    </div>

                    <div className="info-card-highlight">
                        <h4>Mastering Kanban</h4>
                        <ul className="info-list">
                            <li><strong>Drag & Drop</strong> cards between columns to update status.</li>
                            <li><strong>Priority Levels</strong> (Urgent to Low) help focus your efforts.</li>
                            <li><strong>Archive</strong> completed or stale tasks to keep the board clean.</li>
                        </ul>
                    </div>

                    <div className="info-section">
                        <h4>Real-time Collaboration</h4>
                        <p>Nexus is alive. You can see team members currently online in the <strong>Presence Toolbar</strong> at the top of the board. Updates to tasks are broadcast instantly via secure websockets.</p>
                    </div>



                    <div className="info-section">
                        <h4>Global Search</h4>
                        <p>Press <code>/</code> or click the search icon to find anything across all workspaces. Use keywords from titles or descriptions for precise results.</p>
                    </div>
                </div>
            )
        },
        PRIVACY: {
            title: 'Privacy Policy',
            subtitle: 'Your data security is our priority.',
            icon: <Shield size={28} />,
            body: (
                <div className="info-modal-body">
                    <p>At Nexus, we take your privacy seriously. All your data is encrypted both at rest and in transit.</p>
                    <div className="info-card-highlight">
                        <h4>Data Protection</h4>
                        <p style={{ color: '#9ca3af', fontSize: '13px' }}>We do not sell your personal information to third parties. Your workspace data belongs exclusively to you and your team.</p>
                    </div>
                </div>
            )
        },
        SUPPORT: {
            title: 'Support Center',
            subtitle: 'We are here to help you 24/7.',
            icon: <LifeBuoy size={28} />,
            body: (
                <div className="info-modal-body">
                    <p>Need help? Our support team is ready to assist you with any technical issues or feature requests.</p>
                    <div className="info-card-highlight" style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '4px' }}>Contact Support</h4>
                        <p style={{ fontSize: '14px', color: '#fff' }}>affanahmedkhan34@gmail.com</p>
                    </div>
                    <div className="support-actions">
                        <button className="btn-google" style={{ width: '100%', borderRadius: '12px' }} onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=affanahmedkhan34@gmail.com&su=Nexus%20Hub%20Support%20Request', '_blank')}>
                            Email Us (Direct Gmail)
                        </button>
                    </div>
                </div>
            )
        }
    };

    const activeContent = content[type];

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="500px">
            <div className="info-modal-header">
                <div className="info-modal-icon-wrapper">
                    {activeContent.icon}
                </div>
                <div className="info-modal-titles">
                    <h2>{activeContent.title}</h2>
                    <p>{activeContent.subtitle}</p>
                </div>
            </div>

            {activeContent.body}

            <div className="info-footer-actions">
                <button className="btn-google" style={{ padding: '8px 24px', borderRadius: '10px' }} onClick={onClose}>Close</button>
            </div>
        </Modal>
    );
};

export default InfoModals;
