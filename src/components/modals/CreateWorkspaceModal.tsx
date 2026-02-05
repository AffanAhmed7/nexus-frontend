import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore.js';
import Modal from './Modal';
import '../../styles/modals/CreateWorkspaceModal.css';

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { createWorkspace } = useWorkspaceStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await createWorkspace(name, description);
            onClose();
            setName('');
            setDescription('');
        } catch (error) {
            console.error('Failed to create workspace', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Workspace" maxWidth="440px">
            <p className="workspace-modal-subtitle">A workspace is where your team collaborates on projects.</p>

            <form onSubmit={handleSubmit} className="workspace-form">
                <div className="workspace-field">
                    <label>Workspace Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Marketing Team"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div className="workspace-field">
                    <label>Description (Optional)</label>
                    <textarea
                        placeholder="What is this workspace about?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? "Creating..." : <><Plus size={18} /> Create Workspace</>}
                </button>
            </form>
        </Modal>
    );
};

export default CreateWorkspaceModal;
