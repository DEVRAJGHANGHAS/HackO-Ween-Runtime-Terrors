let io = null;

module.exports = {
  init: (httpServer) => {
    try {
      const { Server } = require('socket.io');
      io = new Server(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        }
      });

      io.on('connection', (socket) => {
        socket.on('join_role', (role) => {
          if (role) socket.join(`role_${role}`);
        });

        socket.on('disconnect', () => {
          // clean exit
        });
      });

      return io;
    } catch (err) {
      console.warn('[SocketService] Socket.IO initialization skipped:', err.message);
      return null;
    }
  },

  getIO: () => io,

  emit: (event, data) => {
    if (io) {
      try {
        io.emit(event, data);
      } catch (e) {
        console.warn('[SocketService] emit warning:', e.message);
      }
    }
  },

  emitToRole: (role, event, data) => {
    if (io) {
      try {
        io.to(`role_${role}`).emit(event, data);
      } catch (e) {
        console.warn('[SocketService] emitToRole warning:', e.message);
      }
    }
  }
};
