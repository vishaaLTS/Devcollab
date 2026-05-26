import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { 
  X, 
  Calendar, 
  Paperclip, 
  CheckSquare, 
  MessageSquare, 
  User, 
  Send, 
  Trash, 
  Link2,
  Users,
  Plus
} from 'lucide-react';

const TaskModal = ({ taskId, onClose, onRefresh }) => {
  const { user, availableUsers, activeProject, triggerAlert } = useApp();
  const { reloadTrigger, viewTask, leaveTask, presence } = useSocket();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  
  // Field editing
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignee, setEditAssignee] = useState('');

  // Comment posting
  const [commentContent, setCommentContent] = useState('');
  
  // Checklist & Attachment additions
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newAttachName, setNewAttachName] = useState('');
  const [newAttachUrl, setNewAttachUrl] = useState('');

  // Notify socket room that this user is reading the task card
  useEffect(() => {
    if (taskId) {
      viewTask(taskId);
    }
    return () => {
      leaveTask();
    };
  }, [taskId, reloadTrigger]);

  const fetchTaskDetails = async () => {
    try {
      const res = await fetch(`/api/tasks`); // We can parse the array or query endpoints
      // Let's query from individual task endpoints
      const response = await fetch(`/api/projects/${activeProject.id}/tasks`);
      if (response.ok) {
        const list = await response.json();
        const found = list.find(t => t.id === taskId);
        if (found) {
          setTask(found);
          setEditTitle(found.title);
          setEditDesc(found.description);
          setEditPriority(found.priority);
          setEditDueDate(found.dueDate);
          setEditAssignee(found.assigneeId || '');
        }
      }
      
      // Fetch task comments
      const commRes = await fetch(`/api/tasks/${taskId}/comments`);
      if (commRes.ok) {
        const commData = await commRes.json();
        setComments(commData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId, reloadTrigger]);

  const handleUpdateFields = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          priority: editPriority,
          dueDate: editDueDate,
          assigneeId: editAssignee || null,
          userId: user.id
        })
      });
      if (res.ok) {
        setIsEditing(false);
        triggerAlert('success', 'Task fields synchronized successfully');
        fetchTaskDetails();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          userId: user.id,
          content: commentContent
        })
      });
      if (res.ok) {
        setCommentContent('');
        fetchTaskDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Checklist additions & updates
  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;

    const updatedCheck = [
      ...(task.checklist || []),
      { id: Math.random().toString(36).substr(2, 9), text: newCheckItem, completed: false }
    ];

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedCheck, userId: user.id })
      });
      if (res.ok) {
        setNewCheckItem('');
        fetchTaskDetails();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChecklist = async (itemId, completed) => {
    const updatedCheck = task.checklist.map(item => 
      item.id === itemId ? { ...item, completed } : item
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedCheck, userId: user.id })
      });
      if (res.ok) {
        fetchTaskDetails();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Attachment handler
  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!newAttachName.trim() || !newAttachUrl.trim()) return;

    const updatedAttach = [
      ...(task.attachments || []),
      { id: Math.random().toString(36).substr(2, 9), name: newAttachName, url: newAttachUrl }
    ];

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachments: updatedAttach, userId: user.id })
      });
      if (res.ok) {
        setNewAttachName('');
        setNewAttachUrl('');
        fetchTaskDetails();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Card Handler
  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        triggerAlert('success', 'Task card deleted successfully');
        onRefresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Find who else is viewing this task card in real-time
  const activeViewers = Object.keys(presence).filter(uid => 
    presence[uid].currentTaskId === taskId && uid !== user.id
  ).map(uid => presence[uid].userName);

  if (!task) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-glow" style={{ maxWidth: '750px', width: '90%', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', marginBottom: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
              TASK DETAILS — {task.priority}
            </span>
            {activeViewers.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--accent-pink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Users size={12} /> {activeViewers.join(', ')} {activeViewers.length === 1 ? 'is' : 'are'} viewing this task card
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="header-btn" style={{ borderColor: 'var(--priority-p0)', color: 'var(--priority-p0)' }} onClick={handleDeleteTask}>
              <Trash size={14} /> Delete
            </button>
            <X size={20} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={onClose} />
          </div>
        </div>

        {/* Modal Scrollable Contents */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0', display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
          
          {/* Main Info */}
          <div>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="text" 
                  className="auth-input" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  style={{ fontSize: '18px', fontWeight: 600 }}
                />
                <textarea 
                  className="auth-input" 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)} 
                  style={{ minHeight: '120px', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="header-btn header-btn-primary" onClick={handleUpdateFields}>Save Changes</button>
                  <button className="header-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{task.title}</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  {task.description || 'Add a detailed feature description... (Click to edit)'}
                </p>
              </div>
            )}

            {/* Checklist */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckSquare size={16} /> Subtask Checklist
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {task.checklist?.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <input 
                      type="checkbox" 
                      checked={item.completed} 
                      onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Add item..." 
                  style={{ height: '36px' }}
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                />
                <button type="submit" className="header-btn"><Plus size={14} /></button>
              </form>
            </div>

            {/* Simulated Attachments */}
            <div style={{ marginTop: '28px' }}>
              <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Paperclip size={16} /> Attachments
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {task.attachments?.map(att => (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    <Link2 size={12} style={{ color: 'var(--accent-purple)' }} />
                    <a href={att.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                      {att.name}
                    </a>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddAttachment} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Asset Name (e.g. Figma Link)" 
                  style={{ height: '36px' }}
                  value={newAttachName}
                  onChange={(e) => setNewAttachName(e.target.value)}
                />
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="URL..." 
                  style={{ height: '36px' }}
                  value={newAttachUrl}
                  onChange={(e) => setNewAttachUrl(e.target.value)}
                />
                <button type="submit" className="header-btn"><Plus size={14} /></button>
              </form>
            </div>
          </div>

          {/* Properties sidebar */}
          <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '24px' }}>
            <div className="auth-input-group">
              <label className="auth-label"><User size={12} /> Assignee</label>
              <select 
                className="workspace-select" 
                value={editAssignee} 
                onChange={(e) => {
                  setEditAssignee(e.target.value);
                  setIsEditing(true); // Triggers save options
                }}
              >
                <option value="">Unassigned</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="auth-input-group">
              <label className="auth-label"><Calendar size={12} /> Priority</label>
              <select 
                className="workspace-select" 
                value={editPriority} 
                onChange={(e) => {
                  setEditPriority(e.target.value);
                  setIsEditing(true);
                }}
              >
                <option value="P0">P0 (Critical)</option>
                <option value="P1">P1 (Medium)</option>
                <option value="P2">P2 (Low)</option>
              </select>
            </div>

            <div className="auth-input-group">
              <label className="auth-label"><Calendar size={12} /> Due Date</label>
              <input 
                type="date" 
                className="auth-input" 
                value={editDueDate} 
                onChange={(e) => {
                  setEditDueDate(e.target.value);
                  setIsEditing(true);
                }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Task Comments & mentions */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} /> Comments & Mentions
          </h3>

          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            {comments.map(comm => (
              <div key={comm.id} style={{ display: 'flex', gap: '12px', fontSize: '13px', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <img src={comm.userAvatar} alt={comm.userName} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{comm.userName}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(comm.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>{comm.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div style={{ padding: '16px', textStyle: 'italic', textAlign: 'center', color: 'var(--text-muted)' }}>
                No conversation started. Type below to @mention team members!
              </div>
            )}
          </div>

          <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tip: Type @Ankush or @Riya to notify team members</span>
              <textarea 
                className="auth-input" 
                placeholder="Write a comment..." 
                style={{ resize: 'none', height: '54px' }}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="header-btn header-btn-primary" style={{ padding: '16px 20px', height: '54px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default TaskModal;
