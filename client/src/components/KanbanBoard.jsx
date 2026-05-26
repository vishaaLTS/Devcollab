import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import TaskModal from './TaskModal';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  List as ListIcon, 
  KanbanSquare, 
  Filter, 
  ChevronRight, 
  ChevronLeft,
  Search,
  AlertCircle
} from 'lucide-react';

const KanbanBoard = () => {
  const { activeProject, user, triggerAlert } = useApp();
  const { reloadTrigger, presence } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list' | 'calendar'
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  // Modals & Triggers
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumnTarget, setCreateColumnTarget] = useState('todo');
  
  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('P1');
  const [newDueDate, setNewDueDate] = useState('');
  const [newLabels, setNewLabels] = useState('');

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchTasks = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeProject, reloadTrigger]);

  // Handle Drag & Drop
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    if (taskToMove.status === targetStatus) return;

    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          userId: user.id
        })
      });
      if (!res.ok) {
        triggerAlert('error', 'Failed to move task. Reverting...');
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
      fetchTasks();
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const labelArray = newLabels.split(',').map(l => l.trim()).filter(l => l !== '');
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          title: newTitle,
          description: newDesc,
          status: createColumnTarget,
          priority: newPriority,
          dueDate: newDueDate,
          labels: labelArray,
          userId: user.id
        })
      });
      if (res.ok) {
        setNewTitle('');
        setNewDesc('');
        setNewPriority('P1');
        setNewDueDate('');
        setNewLabels('');
        setShowCreateModal(false);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter tasks based on searchQuery and priorityFilter
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' ? true : task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  // Count active viewing sessions on this card to show a red glowing notification dot
  const getCardPresenceCount = (taskId) => {
    return Object.keys(presence).filter(userId => 
      presence[userId].currentTaskId === taskId && userId !== user.id
    ).length;
  };

  // Render Kanban Board View
  const renderKanban = () => {
    const columns = [
      { id: 'todo', title: 'To Do', color: 'var(--text-secondary)' },
      { id: 'in_progress', title: 'In Progress', color: 'var(--accent-blue)' },
      { id: 'in_review', title: 'In Review', color: 'var(--accent-pink)' },
      { id: 'done', title: 'Done', color: 'var(--priority-p2)' }
    ];

    return (
      <div className="board-columns-grid">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              className="board-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="column-header">
                <div className="column-title">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }}></span>
                  <span>{col.title}</span>
                </div>
                <span className="column-count">{colTasks.length}</span>
              </div>

              <div className="column-cards-list">
                {colTasks.map(task => {
                  const viewingTeammates = getCardPresenceCount(task.id);
                  const completedCheck = task.checklist?.filter(c => c.completed).length || 0;
                  const totalCheck = task.checklist?.length || 0;
                  
                  return (
                    <div 
                      key={task.id} 
                      className="card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task.id)}
                    >
                      {/* Priority strip */}
                      <div className={`card-priority ${task.priority}`}></div>
                      
                      {/* Active presence dot indicator */}
                      {viewingTeammates > 0 && (
                        <div className="presence-glow-card" title={`${viewingTeammates} teammate viewing`}></div>
                      )}

                      <div className="card-header">
                        <span className="card-title">{task.title}</span>
                      </div>

                      {task.description && (
                        <p className="card-desc">{task.description}</p>
                      )}

                      {task.labels && task.labels.length > 0 && (
                        <div className="card-labels">
                          {task.labels.map(l => (
                            <span key={l} className="card-label">{l}</span>
                          ))}
                        </div>
                      )}

                      <div className="card-footer">
                        <div className="card-meta">
                          {totalCheck > 0 && (
                            <div className="card-meta-item">
                              📋 <span>{completedCheck}/{totalCheck}</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="card-meta-item" style={{ 
                              color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? '#ef4444' : 'var(--text-muted)' 
                            }}>
                              📅 {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                        {task.assigneeId && (
                          <img 
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(task.assigneeId)}`}
                            alt="Assignee" 
                            style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-secondary)' }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                <button 
                  className="header-btn" 
                  style={{ width: '100%', borderStyle: 'dashed', marginTop: '10px', justifyContent: 'center' }}
                  onClick={() => {
                    setCreateColumnTarget(col.id);
                    setShowCreateModal(true);
                  }}
                >
                  <Plus size={14} /> Add Card
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render List View
  const renderList = () => {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px' }}>Task Title</th>
              <th style={{ padding: '16px' }}>Column Status</th>
              <th style={{ padding: '16px' }}>Priority</th>
              <th style={{ padding: '16px' }}>Due Date</th>
              <th style={{ padding: '16px' }}>Labels</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr 
                key={task.id} 
                style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                onClick={() => setSelectedTask(task.id)}
                className="menu-item-row"
              >
                <td style={{ padding: '16px', fontWeight: 600 }}>{task.title}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    textTransform: 'uppercase',
                    fontWeight: 700
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    color: task.priority === 'P0' ? 'var(--priority-p0)' : task.priority === 'P1' ? 'var(--priority-p1)' : 'var(--priority-p2)',
                    fontWeight: 700
                  }}>
                    {task.priority}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {task.labels.map(l => (
                      <span key={l} className="card-label">{l}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tasks matched filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Calendar View
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Days in current month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '18px' }}>
            {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="header-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <button className="header-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="calendar-grid">
          {weekdays.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="calendar-day-cell" style={{ opacity: 0.2 }}></div>;
            
            const dateStr = day.toISOString().split('T')[0];
            const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
            
            return (
              <div key={dateStr} className="calendar-day-cell">
                <span className="calendar-day-number">{day.getDate()}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
                  {dayTasks.map(t => (
                    <div 
                      key={t.id} 
                      className={`calendar-task-badge ${t.priority} ${t.status === 'done' ? 'done' : ''}`}
                      onClick={() => setSelectedTask(t.id)}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!activeProject) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '32px' }}>
        <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3>Workspace Board Locked</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Choose or construct a workspace project folder inside the sidebar to initialize the Kanban pipeline.</p>
      </div>
    );
  }

  return (
    <div className="board-container">
      {/* Board controls */}
      <div className="board-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="auth-input" 
              style={{ width: '220px', paddingLeft: '36px', height: '36px' }} 
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Priority filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
            <select 
              className="workspace-select" 
              style={{ width: '120px', height: '36px', padding: '0 8px' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="P0">P0 (Critical)</option>
              <option value="P1">P1 (Medium)</option>
              <option value="P2">P2 (Low)</option>
            </select>
          </div>
        </div>

        {/* View Switcher */}
        <div className="view-selector">
          <div 
            className={`view-tab ${viewMode === 'board' ? 'active' : ''}`}
            onClick={() => setViewMode('board')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <KanbanSquare size={14} /> Board
          </div>
          <div 
            className={`view-tab ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ListIcon size={14} /> List
          </div>
          <div 
            className={`view-tab ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CalendarIcon size={14} /> Calendar
          </div>
        </div>
      </div>

      {/* Render selected view */}
      {loading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <span>Loading project workflow board...</span>
        </div>
      ) : (
        <>
          {viewMode === 'board' && renderKanban()}
          {viewMode === 'list' && renderList()}
          {viewMode === 'calendar' && renderCalendar()}
        </>
      )}

      {/* Create Task Modal Overlay */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-glow">
            <h3 style={{ marginBottom: '16px' }}>Add Kanban Card</h3>
            <form onSubmit={handleCreateTask}>
              <div className="auth-input-group">
                <label className="auth-label">Card Title</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Task topic..." 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Description</label>
                <textarea 
                  className="auth-input" 
                  placeholder="Explain scope and parameters..." 
                  style={{ resize: 'vertical', minHeight: '80px' }}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="auth-input-group">
                  <label className="auth-label">Priority</label>
                  <select 
                    className="workspace-select" 
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="P0">P0 (Critical)</option>
                    <option value="P1">P1 (Medium)</option>
                    <option value="P2">P2 (Low)</option>
                  </select>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">Due Date</label>
                  <input 
                    type="date" 
                    className="auth-input" 
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Labels (comma separated)</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="frontend, api, bug" 
                  value={newLabels}
                  onChange={(e) => setNewLabels(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="header-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="auth-btn" style={{ margin: 0, width: 'auto', padding: '10px 20px' }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task detail card modal */}
      {selectedTask && (
        <TaskModal taskId={selectedTask} onClose={() => setSelectedTask(null)} onRefresh={fetchTasks} />
      )}
    </div>
  );
};

export default KanbanBoard;
