import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Folder, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore.js';
import api from '../../utils/api.js';
import Modal from './Modal';
import '../../styles/modals/SearchOverlay.css';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTask: (task: any) => void;
}

const SearchOverlay = ({ isOpen, onClose, onSelectTask }: SearchOverlayProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ tasks: any[], projects: any[] }>({ tasks: [], projects: [] });
    const [loading, setLoading] = useState(false);
    const { activeWorkspace } = useWorkspaceStore();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim() || !activeWorkspace) {
            setResults({ tasks: [], projects: [] });
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get(`/search?q=${query}&workspaceId=${activeWorkspace.id}`);
                setResults(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query, activeWorkspace]);

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
        <Modal isOpen={isOpen} onClose={onClose} title="Quick Search" maxWidth="680px">
            <div className="search-form">
                <div className="search-field">
                    <label><Search size={14} /> Search Anything</label>
                    <div className="search-input-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Tasks, projects, teammates..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="search-input-standard"
                            autoFocus
                        />
                        <div className="search-kbd">ESC</div>
                    </div>
                </div>

                <div className="search-results-area">
                    {loading && (
                        <div className="search-loading">
                            <div className="spinner-modern" style={{ width: '24px', height: '24px' }} />
                            <span>Searching {activeWorkspace?.name}...</span>
                        </div>
                    )}

                    {!loading && query && results.tasks.length === 0 && results.projects.length === 0 && (
                        <div className="search-empty">
                            <Search size={48} style={{ marginBottom: '16px', opacity: 0.1 }} />
                            <p>No results for "<strong>{query}</strong>"</p>
                        </div>
                    )}

                    {!query && (
                        <div className="search-empty" style={{ opacity: 0.3 }}>
                            <p>Type to search projects and tasks</p>
                        </div>
                    )}

                    {results.projects.length > 0 && (
                        <div className="search-section">
                            <h4 className="search-section-label">Projects</h4>
                            {results.projects.map(project => (
                                <div key={project.id} className="search-item">
                                    <div className="search-item-icon">
                                        <Folder size={18} />
                                    </div>
                                    <div className="search-item-content">
                                        <div className="search-item-title">{project.name}</div>
                                        <div className="search-item-meta truncate">{project.description || 'No description'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {results.tasks.length > 0 && (
                        <div className="search-section">
                            <h4 className="search-section-label">Tasks</h4>
                            {results.tasks.map(task => (
                                <div
                                    key={task.id}
                                    className="search-item"
                                    onClick={() => onSelectTask(task)}
                                >
                                    <div className="search-item-icon">
                                        <FileText size={18} />
                                    </div>
                                    <div className="search-item-content">
                                        <div className="search-item-title">{task.title}</div>
                                        <div className="search-item-meta">
                                            {task.project.name} • {task.status.replace('_', ' ')}
                                            {task.isArchived && <span className="archived-tag">Archived</span>}
                                        </div>
                                    </div>
                                    <div
                                        className="search-item-priority"
                                        style={{
                                            backgroundColor: `${getPriorityColor(task.priority)}15`,
                                            color: getPriorityColor(task.priority),
                                            border: `1px solid ${getPriorityColor(task.priority)}20`
                                        }}
                                    >
                                        <AlertCircle size={10} />
                                        {task.priority || 'NORMAL'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="search-footer-info">
                    <div className="footer-tip"><span>↑↓</span> Navigate</div>
                    <div className="footer-tip"><span>↵</span> Select</div>
                </div>
            </div>
        </Modal>
    );
};

export default SearchOverlay;
