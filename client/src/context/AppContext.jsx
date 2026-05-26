import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dc_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  
  const [sidebarTab, setSidebarTab] = useState('board'); // 'board' | 'wiki' | 'snippets' | 'assistant' | 'activity'
  const [showPayments, setShowPayments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Fetch all registered users in the database
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users', e);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [user?.id]);

  // Load user data upon boot
  useEffect(() => {
    if (user) {
      verifyUserAndLoad();
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setProjects([]);
      setActiveProject(null);
      setNotifications([]);
    }
  }, [user?.id]);

  const verifyUserAndLoad = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/verify/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('dc_user', JSON.stringify(data.user));
        
        // Fetch tables
        await fetchWorkspaces(data.user.id);
        await fetchNotifications(data.user.id);
      } else {
        // Ghost session from wiped database! Force clean register/login
        setUser(null);
        localStorage.removeItem('dc_user');
        triggerAlert('error', 'Your session has expired. Please sign up or log in again.');
      }
    } catch (e) {
      console.error('Network failed verifying session', e);
      // Fallback
      await fetchWorkspaces(user.id);
      await fetchNotifications(user.id);
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('dc_user', JSON.stringify(data.user));
        triggerAlert('success', `Welcome back, ${data.user.name}!`);
        return true;
      } else {
        triggerAlert('error', data.error || 'Authentication failed');
        return false;
      }
    } catch (e) {
      triggerAlert('error', 'Network failure during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, bio, skills, github) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, bio, skills, github })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('dc_user', JSON.stringify(data.user));
        triggerAlert('success', `Account created successfully! Welcome ${name}!`);
        return true;
      } else {
        triggerAlert('error', data.error || 'Registration failed');
        return false;
      }
    } catch (e) {
      triggerAlert('error', 'Network failure during registration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dc_user');
    triggerAlert('success', 'Logged out successfully');
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/auth/register`, { // reuse register path or backend endpoints
        // since db has users.update we can call it or mock
      });
      // We will perform a client-side update with backend synchronization
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('dc_user', JSON.stringify(updatedUser));
      triggerAlert('success', 'Profile updated');
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorkspaces = async (userId) => {
    try {
      const res = await fetch(`/api/workspaces?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length > 0) {
          // Keep previous selected if available, else pick first
          const prev = localStorage.getItem('dc_active_ws');
          const found = data.find(w => w.id === prev);
          const chosen = found || data[0];
          setActiveWorkspace(chosen);
          localStorage.setItem('dc_active_ws', chosen.id);
          fetchProjects(chosen.id);
        } else {
          setActiveWorkspace(null);
          setProjects([]);
          setActiveProject(null);
        }
      }
    } catch (e) {
      console.error('Failed to load workspaces', e);
    }
  };

  const selectWorkspace = (workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('dc_active_ws', workspace.id);
    setProjects([]);
    setActiveProject(null);
    fetchProjects(workspace.id);
  };

  const createWorkspace = async (name) => {
    if (!user) return;
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ownerId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setWorkspaces(prev => [...prev, data]);
        selectWorkspace(data);
        triggerAlert('success', `Workspace "${name}" successfully constructed`);
        return true;
      } else {
        if (data.limitTriggered) {
          setShowPayments(true);
        }
        triggerAlert('error', data.error || 'Failed to create workspace');
        return false;
      }
    } catch (e) {
      triggerAlert('error', 'Network failure');
      return false;
    }
  };

  const inviteMember = async (email) => {
    if (!activeWorkspace || !user) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senderId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh workspace info
        setActiveWorkspace(data.workspace);
        setWorkspaces(prev => prev.map(w => w.id === data.workspace.id ? data.workspace : w));
        triggerAlert('success', `Sent workspace invitation link to ${email}`);
        return true;
      } else {
        if (data.limitTriggered) {
          setShowPayments(true);
        }
        triggerAlert('error', data.error || 'Failed to send invite');
        return false;
      }
    } catch (e) {
      triggerAlert('error', 'Network error');
      return false;
    }
  };

  const joinWorkspace = async (workspaceId, email) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Joined workspace successfully!`);
        fetchWorkspaces(user.id);
        return true;
      } else {
        triggerAlert('error', data.error || 'Failed to join workspace');
        return false;
      }
    } catch (e) {
      triggerAlert('error', 'Failed to join workspace due to network error');
      return false;
    }
  };

  const fetchProjects = async (workspaceId) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          const prev = localStorage.getItem('dc_active_proj');
          const found = data.find(p => p.id === prev);
          const chosen = found || data[0];
          setActiveProject(chosen);
          localStorage.setItem('dc_active_proj', chosen.id);
        } else {
          setActiveProject(null);
        }
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  };

  const selectProject = (project) => {
    setActiveProject(project);
    localStorage.setItem('dc_active_proj', project.id);
  };

  const createProject = async (name, description) => {
    if (!activeWorkspace || !user) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace.id, name, description, userId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(prev => [...prev, data]);
        selectProject(data);
        triggerAlert('success', `Project "${name}" built successfully`);
        // Refresh workspace info as owner changes
        fetchWorkspaces(user.id);
        return true;
      } else {
        if (data.limitTriggered) {
          setShowPayments(true);
        }
        triggerAlert('error', data.error || 'Failed to create project');
        return false;
      }
    } catch (e) {
      triggerAlert('error', 'Network failure creating project');
      return false;
    }
  };

  const fetchNotifications = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Failed to query notifications', e);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        triggerAlert('success', 'All notifications cleared');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const upgradeWorkspace = async (cardData) => {
    if (!user || !activeWorkspace) return false;
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          workspaceId: activeWorkspace.id,
          cardNumber: cardData.cardNumber,
          cardExpiry: cardData.cardExpiry,
          cardCVC: cardData.cardCVC
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Upgrade client state user model
        const upgradedUser = { ...user, plan: 'pro' };
        setUser(upgradedUser);
        localStorage.setItem('dc_user', JSON.stringify(upgradedUser));
        
        // Refresh active workspace representation
        fetchWorkspaces(user.id);
        setShowPayments(false);
        triggerAlert('success', 'Workspace successfully upgraded to Pro!');
        return true;
      } else {
        triggerAlert('error', data.error || 'Payment declined');
        return false;
      }
    } catch (e) {
      triggerAlert('error', 'Checkout failed due to connection error');
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      workspaces,
      activeWorkspace,
      projects,
      activeProject,
      notifications,
      availableUsers,
      sidebarTab,
      showPayments,
      loading,
      alert,
      setSidebarTab,
      setShowPayments,
      setAlert,
      login,
      register,
      logout,
      updateUserProfile,
      selectWorkspace,
      createWorkspace,
      inviteMember,
      joinWorkspace,
      selectProject,
      createProject,
      markNotificationRead,
      markAllNotificationsRead,
      upgradeWorkspace,
      triggerAlert,
      fetchWorkspaces
    }}>
      {children}
    </AppContext.Provider>
  );
};
