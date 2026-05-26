import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useApp } from './AppContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, activeProject, triggerAlert } = useApp();
  const [socket, setSocket] = useState(null);
  const [presence, setPresence] = useState({});
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to backend server. Proxy is configured in vite, but let's connect directly to origin or default 5050
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5050' : window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Real-time collaboration active', newSocket.id);
    });

    newSocket.on('presence_updated', (liveUsers) => {
      setPresence(liveUsers || {});
    });

    newSocket.on('task_changed', (data) => {
      // Force trigger state reload on components
      setReloadTrigger(prev => prev + 1);
      
      if (data.action === 'update' && data.task) {
        // Find if someone else moved standard items
        // Since we are checking, let's keep quiet or alert
      }
    });

    newSocket.on('tasks_reload', () => {
      setReloadTrigger(prev => prev + 1);
    });

    newSocket.on('comment_changed', () => {
      setReloadTrigger(prev => prev + 1);
    });

    newSocket.on('connect_error', (e) => {
      console.warn('Real-time connection down, falling back...', e);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  // Join/Leave project rooms on activeProject shift
  useEffect(() => {
    if (!socket || !user || !activeProject) return;

    // Join room corresponding to current project
    socket.emit('join_project', {
      projectId: activeProject.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar
    });

    return () => {
      // Socket handles cleanup upon disconnect or re-join
    };
  }, [socket, user, activeProject]);

  const viewTask = (taskId) => {
    if (!socket || !user || !activeProject) return;
    socket.emit('viewing_task', {
      projectId: activeProject.id,
      taskId,
      userId: user.id
    });
  };

  const leaveTask = () => {
    if (!socket || !user || !activeProject) return;
    socket.emit('leaving_task', {
      projectId: activeProject.id,
      userId: user.id
    });
  };

  return (
    <SocketContext.Provider value={{
      socket,
      presence,
      reloadTrigger,
      viewTask,
      leaveTask
    }}>
      {children}
    </SocketContext.Provider>
  );
};
