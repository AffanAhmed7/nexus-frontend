import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import '../../styles/ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    loading = false
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content glass confirmation-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header-compact">
                    <div className={`icon-circle ${danger ? 'danger' : 'primary'}`}>
                        {danger ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <h3 className="modal-title">{title}</h3>
                    <p className="modal-desc">{message}</p>
                </div>

                <div className="modal-footer-dual">
                    <button className="btn btn-outline" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationModal;
