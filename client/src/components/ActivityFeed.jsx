import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { 
  Activity, 
  User, 
  Clock, 
  MessageSquare, 
  FileText, 
  ArrowRight, 
  AlertCircle,
  Briefcase
} from 'lucide-react';

const ActivityFeed = () => {
  const { activeWorkspace, activeProject, projects, availableUsers } = useApp();
  const { reloadTrigger } = useSocket();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering states
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');

  const fetchActivities = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activeWorkspace, reloadTrigger]);

  // Apply filters
  const filteredActivities = activities.filter(act => {
    const matchesProject = projectFilter === 'ALL' ? true : act.projectId === projectFilter;
    const matchesMember = memberFilter === 'ALL' ? true : act.userId === memberFilter;
    return matchesProject && matchesMember;
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case 'comment_added':
        return <MessageSquare size={14} style={{ color: 'var(--accent-purple)' }} />;
      case 'doc_updated':
        return <FileText size={14} style={{ color: 'var(--accent-pink)' }} />;
      case 'member_joined':
        return <User size={14} style={{ color: 'var(--priority-p2)' }} />;
      case 'task_moved':
        return <ArrowRight size={14} style={{ color: 'var(--accent-blue)' }} />;
      default:
        return <Activity size={14} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Filtering header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity style={{ color: 'var(--accent-purple)' }} /> Workspace Activity Feed
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Project Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Project:</span>
            <select 
              className="workspace-select" 
              style={{ width: '150px', height: '32px', padding: '0 8px', fontSize: '12px' }}
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Member Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Member:</span>
            <select 
              className="workspace-select" 
              style={{ width: '150px', height: '32px', padding: '0 8px', fontSize: '12px' }}
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
            >
              <option value="ALL">All Members</option>
              {activeWorkspace.members.map(m => {
                const u = availableUsers.find(userObj => userObj.id === m.userId);
                return u ? <option key={u.id} value={u.id}>{u.name}</option> : null;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <span>Loading activity logs...</span>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="activity-feed-list">
            {filteredActivities.map(act => {
              const u = availableUsers.find(userObj => userObj.id === act.userId);
              return (
                <div key={act.id} className="activity-feed-item">
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getActivityIcon(act.actionType)}
                  </div>
                  
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{act.userName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                      {act.details}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      {act.projectId && (
                        <span style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Briefcase size={10} /> {projects.find(p => p.id === act.projectId)?.name || 'Project'}
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredActivities.length === 0 && (
              <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
                <span>No activities matched the chosen filters.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
