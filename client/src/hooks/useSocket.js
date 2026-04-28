/**
 * useSocket.js — creates and manages a JWT-authenticated Socket.io connection.
 *
 * Usage:
 *   const socket = useSocket();
 *   socket?.on('status:updated', handler);
 *
 * Notes:
 * - Returns null while the user is not logged in or socket fails to connect.
 * - Automatically disconnects on component unmount.
 * - The token is read from localStorage at connection time; reconnects when
 *   the user changes.
 */
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function useSocket() {
  const { user }     = useAuth();
  const socketRef    = useRef(null);

  useEffect(() => {
    if (!user) {
      // Disconnect and clean up if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('apt_token');
    if (!token) return;

    // Create authenticated socket connection
    const socket = io(SOCKET_URL, {
      auth:           { token },
      transports:     ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('🔌 Socket connection error (non-fatal):', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]); // reconnect if user changes

  return socketRef.current;
}
