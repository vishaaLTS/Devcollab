import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { Bell, HelpCircle, User, Check, X } from 'lucide-react';

const Header = () => {
  const { 
    activeProject, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    triggerAlert 
  } = useApp();
  
  const { presence } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Convert presence map to array for display
  const activeMembers = Object.keys(presence).map(userId => ({
    userId,
    ...presence[userId]
  }));

  const handleMarkRead = (e, id) => {
    e.stopPropagation();
    markNotificationRead(id);
  };

  return (
    <header className="header">
      {/* Title */}
      <div className="header-left">
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
          {activeProject ? `📂 ${activeProject.name}` : '💡 Select or Create a Project'}
        </h2>
      </div>

      {/* Toolbar */}
      <div className="header-right">
        {/* Real-time Presence Indicators */}
        {activeProject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Online:</span>
            <div className="presence-indicators">
              {activeMembers.map(member => (
                <div 
                  key={member.userId} 
                  className="presence-avatar" 
                  style={{ zIndex: 5 }}
                >
                  <img 
                    src={member.userAvatar} 
                    alt={member.userName} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div className="presence-tooltip">
                    {member.userName} {member.currentTaskId ? `(editing card)` : '(active)'}
                  </div>
                </div>
              ))}
              {activeMembers.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Connecting...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notification Center */}
        <div className="notification-bell">
          <div 
            onClick={() => setShowNotifications(!showNotifications)} 
            style={{ 
              position: 'relative', 
              padding: '8px', 
              borderRadius: '8px', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell size={18} style={{ color: unreadCount > 0 ? 'var(--accent-purple)' : 'var(--text-secondary)' }} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="notification-dropdown glass-glow" style={{ border: '1px solid var(--border-glow)' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0 20px 12px', 
                borderBottom: '1px solid var(--border-light)' 
              }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Notification Center</span>
                {unreadCount > 0 && (
                  <span 
                    style={{ fontSize: '11px', color: 'var(--accent-purple)', cursor: 'pointer', fontWeight: 600 }}
                    onClick={markAllNotificationsRead}
                  >
                    Clear All
                  </span>
                )}
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    All caught up! No notifications yet.
                  </div>
                ) : (
                  notifications.map(notify => (
                    <div 
                      key={notify.id} 
                      className={`notification-item ${!notify.read ? 'unread' : ''}`}
                      onClick={() => markNotificationRead(notify.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          textTransform: 'uppercase', 
                          fontWeight: 700, 
                          color: notify.type === 'assignment' ? 'var(--accent-purple)' : 'var(--accent-pink)' 
                        }}>
                          {notify.type}
                        </span>
                        {!notify.read && (
                          <Check 
                            size={14} 
                            style={{ color: 'var(--accent-purple)', cursor: 'pointer' }} 
                            onClick={(e) => handleMarkRead(e, notify.id)}
                          />
                        )}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>{notify.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                        {notify.message}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {new Date(notify.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
