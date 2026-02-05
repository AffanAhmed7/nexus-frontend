import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useProjectTaskStore } from '../../store/projectTaskStore.js';
import { useWorkspaceStore } from '../../store/workspaceStore.js';
import api from '../../utils/api.js';
import { Plus, MoreVertical, Clock, Search, Filter, Trash2, Circle, CheckCircle2, Archive } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { socket, connectSocket } from '../../utils/socket.js';
import { useAuthStore } from '../../store/authStore.js';
import { usePresenceStore } from '../../store/presenceStore.js';
import TaskDetailModal from '../../components/modals/TaskDetailModal.js';
import CreateTaskModal from '../../components/modals/CreateTaskModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { toast } from 'react-hot-toast';
import '../../styles/KanbanBoard.css';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: '#94a3b8' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#f59e0b' },
  { id: 'IN_REVIEW', title: 'Review', color: '#8b5cf6' },
  { id: 'DONE', title: 'Completed', color: '#10b981' }
] as const;

const KanbanBoard = ({ projectId }: { projectId: string }) => {
  const tasks = useProjectTaskStore(state => state.tasks);
  const fetchTasks = useProjectTaskStore(state => state.fetchTasks);
  const updateTaskStatus = useProjectTaskStore(state => state.updateTaskStatus);
  const deleteTask = useProjectTaskStore(state => state.deleteTask);
  const setActiveView = useProjectTaskStore(state => state.setActiveView);

  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);

  const members = useWorkspaceStore(state => state.members);

  const onlineUsers = usePresenceStore(state => state.onlineUsers);
  const setOnlineUsers = usePresenceStore(state => state.setOnlineUsers);

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<string>('TODO');
  const [filterQuery, setFilterQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [taskToDelete, setTaskToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTasks(projectId);

    if (accessToken && user) {
      connectSocket(accessToken);
      socket.emit('join-project', { projectId, userId: user.id, name: user.name });

      const handleTaskChange = () => fetchTasks(projectId);
      const handlePresence = (users: any[]) => setOnlineUsers(users);

      socket.on('task_created', handleTaskChange);
      socket.on('task_updated', handleTaskChange);
      socket.on('task_deleted', handleTaskChange);
      socket.on('comment_added', handleTaskChange);
      socket.on('presence_updated', handlePresence);

      // Listener for TaskDetailModal to auto-close if the task is deleted
      const handleTaskDeletedForModal = (deletedId: string) => {
        if (selectedTask && deletedId === selectedTask.id) {
          toast.error('This task was deleted');
          setSelectedTask(null); // Close the modal
        }
      };
      socket.on('task_deleted', handleTaskDeletedForModal);


      return () => {
        socket.off('task_created', handleTaskChange);
        socket.off('task_updated', handleTaskChange);
        socket.off('task_deleted', handleTaskChange);
        socket.off('comment_added', handleTaskChange);
        socket.off('presence_updated', handlePresence);
        socket.off('task_deleted', handleTaskDeletedForModal); // Clean up the modal-specific listener
      };
    }
  }, [projectId, fetchTasks, accessToken, user?.id, setOnlineUsers, selectedTask]); // Add selectedTask to dependencies

  const handleOpenCreateModal = (status: string) => {
    setCreateInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete.id);
      toast.success('Task removed');
      setTaskToDelete(null);
    } catch (e) {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeleteTask = (task: any) => {
    if (!user) return false;
    // Check if user is Workspace Admin
    const workspaceMember = members.find(m => m.userId === user.id);
    const isWorkspaceAdmin = workspaceMember?.role === 'ADMIN';

    // Check if user is the creator
    const isCreator = task.creatorId === user.id;

    return isWorkspaceAdmin || isCreator;
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as any;
    try {
      await updateTaskStatus(draggableId, newStatus);
      toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
    } catch (e) {
      toast.error('Failed to move task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesQuery = t.title.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesQuery && matchesPriority;
  });

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filteredTasks.filter(t => t.status === col.id);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-header-toolbar">
        <div className="kanban-presence-v2">
          <div className="presence-avatars">
            {onlineUsers.map((u) => (
              <div key={u.id} className="presence-avatar-v2" title={`${u.name} is working now`}>
                {u.initials}
              </div>
            ))}
          </div>
          <span className="presence-text-v2">
            {onlineUsers.length > 0
              ? `${onlineUsers.map(u => u.name.split(' ')[0]).join(', ')} ${onlineUsers.length === 1 ? 'is' : 'are'} working now`
              : 'No one else is working now'}
          </span>
        </div>

        <div className="kanban-controls">
          <div className="search-box-v2">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
          <div className="filter-dropdown-v2">
            <Filter size={14} />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="kanban-toolbar-select"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <button
            className="btn-icon-subtle"
            title="Archive"
            onClick={() => setActiveView('ARCHIVE')}
          >
            <Archive size={18} />
          </button>
        </div>
      </div>

      <div className="kanban-board-scrollable">
        <div className="kanban-board-container">
          {COLUMNS.map((column) => {
            const colTasks = tasksByStatus[column.id] || [];
            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-column-modern ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  >
                    <header className="column-header">
                      <div className="header-left">
                        <span className={`status-dot ${column.id.toLowerCase()}`} />
                        <h3 className="column-title">{column.title}</h3>
                        <span className="task-count">{colTasks.length}</span>
                      </div>
                    </header>

                    <div className="column-tasks-scroll">
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="empty-column-placeholder">
                          <Plus size={20} />
                          <p>Drop tasks here</p>
                        </div>
                      )}
                      {colTasks.map((task: any, index: number) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => {
                            const cardContent = (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedTask(task)}
                                className={`kanban-card-v2 ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  transform: snapshot.isDragging
                                    ? `${provided.draggableProps.style?.transform} scale(1.04)`
                                    : provided.draggableProps.style?.transform
                                }}
                              >
                                <div className="card-top">
                                  <span className={`priority-pill ${task.priority?.toLowerCase()}`}>
                                    {task.priority || 'MEDIUM'}
                                  </span>
                                  {canDeleteTask(task) && (
                                    <button
                                      className="card-delete-btn"
                                      onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>

                                <div className="card-title-v2-wrapper">
                                  <span className="task-serial-num">#{tasks.indexOf(task) + 1}</span>
                                  <h4 className="card-title-v2">{task.title}</h4>
                                </div>

                                {task.description && (
                                  <p className="card-desc-v2">{task.description.substring(0, 80)}...</p>
                                )}

                                <div className="card-meta-v2">
                                  <div className="meta-left">
                                    <div className="meta-item">
                                      <Clock size={12} />
                                      <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                                    </div>
                                  </div>
                                  <div className="meta-right">
                                    <div className="card-assignee-v2" title={task.assignee?.name || 'Unassigned'}>
                                      {task.assignee?.avatarUrl ? (
                                        <img
                                          src={`${api.defaults.baseURL?.replace('/api', '')}${task.assignee.avatarUrl}`}
                                          alt={task.assignee.name}
                                          className="assignee-avatar-img"
                                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                                        />
                                      ) : (
                                        task.assignee?.name?.split(' ').map((n: string) => n[0]).join('') || '?'
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );

                            if (snapshot.isDragging) {
                              return ReactDOM.createPortal(cardContent, document.body);
                            }

                            return cardContent;
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {column.id === 'TODO' && (
                      <div className="column-footer-add">
                        <button
                          className="kanban-add-task-btn"
                          onClick={() => handleOpenCreateModal(column.id)}
                        >
                          <Plus size={16} /> Add Task
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
        initialStatus={createInitialStatus}
        onSuccess={() => fetchTasks(projectId)}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => fetchTasks(projectId)}
        />
      )}

      <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
        loading={isDeleting}
      />
    </DragDropContext>
  );
};

export default KanbanBoard;
