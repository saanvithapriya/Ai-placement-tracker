import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markRead, markAllRead } from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  // Callbacks that other components can register to react to status:updated events
  const statusListenersRef = useRef([]);
  const socketRef          = useRef(null);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount     || 0);
    } catch (_) { /* silent */ }
  }, [user]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Socket.io real-time connection ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('apt_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth:              { token },
      transports:        ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    });

    socketRef.current = socket;

    // Incoming notification: prepend to list, bump unread count
    socket.on('notification:new', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    // Incoming status update: notify all registered listeners (e.g. Applications page)
    socket.on('status:updated', (payload) => {
      statusListenersRef.current.forEach((cb) => cb(payload));
    });

    socket.on('connect_error', (err) => {
      // Fall back to one-time re-fetch on connection failure
      console.warn('Socket connect error, falling back to fetch:', err.message);
      fetchNotifs();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]); // re-connect when user changes

  // ── Listener registration (for Applications page) ─────────────────────────
  const onStatusUpdated = useCallback((cb) => {
    statusListenersRef.current.push(cb);
    return () => {
      statusListenersRef.current = statusListenersRef.current.filter((f) => f !== cb);
    };
  }, []);

  // ── Mark read ─────────────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    await markRead(id);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      fetchNotifs,
      handleMarkRead, handleMarkAllRead,
      onStatusUpdated,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
