import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderGit2, 
  PlusCircle, 
  KanbanSquare, 
  BookOpen, 
  Code2, 
  Sparkles, 
  Activity, 
  UserPlus, 
  LogOut, 
  Briefcase,
  Crown,
  Users
} from 'lucide-react';

const Sidebar = () => {
  const {
    user,
    workspaces,
    activeWorkspace,
    projects,
    activeProject,
    sidebarTab,
    setSidebarTab,
    selectWorkspace,
    createWorkspace,
    inviteMember,
    selectProject,
    createProject,
    setShowPayments,
    triggerAlert,
    logout
  } = useApp();

  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const success = await createWorkspace(newWsName);
    if (success) {
      setNewWsName('');
      setShowWorkspaceModal(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const success = await createProject(newProjName, newProjDesc);
    if (success) {
      setNewProjName('');
      setNewProjDesc('');
      setShowProjectModal(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const success = await inviteMember(inviteEmail);
    if (success) {
      setInviteEmail('');
      setShowInviteModal(false);
    }
  };

  // Determine if active workspace upgraded to Pro
  const isPro = activeWorkspace?.members.some(m => {
    // If user's account plan is pro, workspace is pro.
    return user?.plan === 'pro';
  }) || user?.plan === 'pro';

  return (
    <aside className="sidebar">
      {/* Platform Branding */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <FolderGit2 className="text-purple-500" style={{ color: 'var(--accent-purple)' }} />
          <span>DevCollab</span>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="workspace-select-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Workspace</span>
          <PlusCircle 
            size={16} 
            style={{ cursor: 'pointer', color: 'var(--accent-purple)' }} 
            onClick={() => setShowWorkspaceModal(true)} 
          />
        </div>
        <select 
          className="workspace-select" 
          value={activeWorkspace?.id || ''} 
          onChange={(e) => {
            const found = workspaces.find(w => w.id === e.target.value);
            if (found) selectWorkspace(found);
          }}
        >
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
          {workspaces.length === 0 && <option value="">No workspaces active</option>}
        </select>

        {/* Upgrade Plan Tier */}
        <div style={{ marginTop: '12px' }}>
          {isPro ? (
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '11px', 
              color: 'var(--accent-purple)', 
              fontWeight: 700,
              background: 'rgba(139, 92, 246, 0.08)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-glow)'
            }}>
              <Crown size={12} fill="var(--accent-purple)" />
              <span>DevCollab Pro Unlimited</span>
            </div>
          ) : (
            <div 
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                fontSize: '11px', 
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
              onClick={() => setShowPayments(true)}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Plan: Free Tier</span>
              <span style={{ color: 'var(--accent-purple)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                Upgrade <Sparkles size={10} />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel Content Selection */}
      <div className="sidebar-menu">
        <span className="sidebar-section-title">Views</span>
        <div 
          className={`menu-item ${sidebarTab === 'board' ? 'active' : ''}`}
          onClick={() => setSidebarTab('board')}
        >
          <KanbanSquare size={18} />
          <span>Kanban Tasks</span>
        </div>
        <div 
          className={`menu-item ${sidebarTab === 'wiki' ? 'active' : ''}`}
          onClick={() => setSidebarTab('wiki')}
        >
          <BookOpen size={18} />
          <span>Notion Docs Wiki</span>
        </div>
        <div 
          className={`menu-item ${sidebarTab === 'snippets' ? 'active' : ''}`}
          onClick={() => setSidebarTab('snippets')}
        >
          <Code2 size={18} />
          <span>Snippet Hub</span>
        </div>
        <div 
          className={`menu-item ${sidebarTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setSidebarTab('assistant')}
        >
          <Sparkles size={18} />
          <span>AI Project Assistant</span>
        </div>
        <div 
          className={`menu-item ${sidebarTab === 'activity' ? 'active' : ''}`}
          onClick={() => setSidebarTab('activity')}
        >
          <Activity size={18} />
          <span>Activity Stream</span>
        </div>

        {/* Projects Folders Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 12px 8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>Projects</span>
          <PlusCircle 
            size={14} 
            style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
            onClick={() => {
              if (!activeWorkspace) {
                triggerAlert('error', 'Please select or construct a workspace first in the select dropdown.');
                return;
              }
              setShowProjectModal(true);
            }}
          />
        </div>
        {projects.map(p => (
          <div 
            key={p.id}
            className={`menu-item ${activeProject?.id === p.id ? 'active' : ''}`}
            onClick={() => selectProject(p)}
            style={{ paddingLeft: '20px' }}
          >
            <Briefcase size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </div>
        ))}
        {projects.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '20px', fontStyle: 'italic' }}>
            No projects added
          </div>
        )}

        {/* Workspace Members Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 12px 8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>Members</span>
          <UserPlus 
            size={14} 
            style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
            onClick={() => {
              if (!activeWorkspace) {
                triggerAlert('error', 'Please select or construct a workspace first in the select dropdown.');
                return;
              }
              setShowInviteModal(true);
            }}
          />
        </div>
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeWorkspace?.members.map(m => {
            const teamMember = useApp().availableUsers.find(u => u.id === m.userId);
            if (!teamMember) return null;
            return (
              <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <img src={teamMember.avatar} alt={teamMember.name} style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                <span>{teamMember.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{m.role}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workspace Invitation Modal */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-glow">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus style={{ color: 'var(--accent-purple)' }} /> Invite Workspace Member
            </h3>
            <form onSubmit={handleInvite}>
              <div className="auth-input-group">
                <label className="auth-label">Teammate Email Address</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="name@university.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="header-btn" onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button type="submit" className="auth-btn" style={{ margin: 0, width: 'auto', padding: '10px 20px' }}>Send Invite Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Workspace Creation Modal */}
      {showWorkspaceModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-glow">
            <h3 style={{ marginBottom: '16px' }}>Build New Workspace</h3>
            <form onSubmit={handleCreateWorkspace}>
              <div className="auth-input-group">
                <label className="auth-label">Workspace Name</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="e.g. Hackathon Team Beta" 
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="header-btn" onClick={() => setShowWorkspaceModal(false)}>Cancel</button>
                <button type="submit" className="auth-btn" style={{ margin: 0, width: 'auto', padding: '10px 20px' }}>Create Workspace</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Project Creation Modal */}
      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-glow">
            <h3 style={{ marginBottom: '16px' }}>Create Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="auth-input-group">
                <label className="auth-label">Project Name</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="e.g. Backend API Integration" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <label className="auth-label">Description (Optional)</label>
                <textarea 
                  className="auth-input" 
                  style={{ resize: 'vertical', minHeight: '80px' }}
                  placeholder="Explain the project scope..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="header-btn" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="auth-btn" style={{ margin: 0, width: 'auto', padding: '10px 20px' }}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Footer User Details */}
      <div className="sidebar-footer">
        <div className="user-profile-summary">
          <img 
            src={user?.avatar} 
            alt="Profile Avatar" 
            className={`user-avatar ${user?.plan === 'pro' ? 'user-avatar-pro' : ''}`}
          />
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className={`user-role-badge ${user?.plan === 'pro' ? 'pro-badge' : ''}`}>
              {user?.plan === 'pro' ? 'Pro Developer' : 'Free Member'}
            </div>
          </div>
          <LogOut 
            size={16} 
            style={{ cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '8px' }} 
            onClick={logout} 
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
