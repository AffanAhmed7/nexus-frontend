import React, { useEffect } from 'react';
import { Command } from 'lucide-react';
import '../../styles/KeyboardShortcuts.css';

interface KeyboardShortcutsProps {
    onSearch?: () => void;
    onNewTask?: () => void;
    onNewProject?: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ 
    onSearch, 
    onNewTask, 
    onNewProject 
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                onSearch?.();
            }
            // Ctrl+N or Cmd+N for new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
                e.preventDefault();
                onNewTask?.();
            }
            // Ctrl+Shift+N or Cmd+Shift+N for new project
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                onNewProject?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSearch, onNewTask, onNewProject]);

    return null;
};

export const KeyboardShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const shortcuts = [
        { keys: ['⌘', 'K'], description: 'Open search' },
        { keys: ['⌘', 'N'], description: 'New task' },
        { keys: ['⌘', '⇧', 'N'], description: 'New project' },
        { keys: ['Esc'], description: 'Close modals' },
        { keys: ['/', '?'], description: 'Show shortcuts' },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass keyboard-shortcuts-modal" onClick={e => e.stopPropagation()}>
                <div className="keyboard-shortcuts-header">
                    <div className="keyboard-shortcuts-title">
                        <Command size={20} />
                        <h2>Keyboard Shortcuts</h2>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        ×
                    </button>
                </div>
                <div className="keyboard-shortcuts-list">
                    {shortcuts.map((shortcut, i) => (
                        <div key={i} className="keyboard-shortcut-item">
                            <div className="keyboard-shortcut-keys">
                                {shortcut.keys.map((key, j) => (
                                    <kbd key={j} className="keyboard-key">{key}</kbd>
                                ))}
                            </div>
                            <span className="keyboard-shortcut-desc">{shortcut.description}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcuts;

