/**
 * socket.js — Socket.io server instance with JWT authentication.
 *
 * Usage:
 *   const { io } = require('./socket');
 *   io.to(`user:${userId}`).emit('notification:new', payload);
 */
const { Server } = require('socket.io');
const jwt         = require('jsonwebtoken');
const User        = require('./models/User');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
  });

  // ── JWT Authentication middleware ────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.role   = user.role;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    // Put each user in their own room: "user:<userId>"
    const room = `user:${socket.userId}`;
    socket.join(room);
    console.log(`🔌 Socket connected: ${socket.userId} → room ${room}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Safe getter — throws if called before initSocket
const getIO = () => {
  if (!io) throw new Error('Socket.io has not been initialized');
  return io;
};

module.exports = { initSocket, getIO };
