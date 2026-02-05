import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../utils/api.js';
import Modal from './Modal';
import '../../styles/modals/CreateProjectModal.css';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    onSuccess: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, workspaceId, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await api.post('/projects', { name, description, workspaceId });
            onSuccess();
            onClose();
            setName('');
            setDescription('');
        } catch (error) {
            console.error('Failed to create project', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Project" maxWidth="440px">
            <p className="project-modal-subtitle">Organize your tasks within this workspace.</p>

            <form onSubmit={handleSubmit} className="project-form">
                <div className="project-field">
                    <label>Project Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Website Redesign"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div className="project-field">
                    <label>Description (Optional)</label>
                    <textarea
                        placeholder="What is this project about?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? "Creating..." : <><Plus size={18} /> Create Project</>}
                </button>
            </form>
        </Modal>
    );
};

export default CreateProjectModal;
