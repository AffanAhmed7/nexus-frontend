import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import '../../styles/modals/Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
    className?: string;
    variant?: 'default' | 'transparent';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '500px', className = '', variant = 'default' }) => {
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
        <div className="modal-portal-overlay" onClick={onClose}>
            <div
                className={`modal-portal-content glass animate-modal-popup ${variant} ${className}`}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth }}
            >
                <div className="modal-portal-header">
                    {title && <h3 className="modal-portal-title">{title}</h3>}
                    <button className="modal-portal-close" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-portal-body custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
