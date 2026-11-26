const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const extractId = (val) => {
  if (!val) return '';
  return val._id ? val._id.toString() : val.toString();
};

const setupSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      return next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('join_chat', (conversationId) => {
      if (conversationId) {
        socket.join(`chat:${conversationId}`);
      }
    });

    socket.on('leave_chat', (conversationId) => {
      if (conversationId) {
        socket.leave(`chat:${conversationId}`);
      }
    });

    socket.on('join_booking', (bookingId) => {
      if (bookingId) {
        socket.join(`booking:${bookingId}`);
      }
    });

    socket.on('leave_booking', (bookingId) => {
      if (bookingId) {
        socket.leave(`booking:${bookingId}`);
      }
    });
  });

  app.set('io', io);
  app.set('emitBookingUpdate', (booking) => {
    const bookingId = extractId(booking._id);
    const renterId = extractId(booking.renter);
    const ownerId = extractId(booking.owner);
    io.to(`booking:${bookingId}`)
      .to(`user:${renterId}`)
      .to(`user:${ownerId}`)
      .emit('booking_updated', {
        bookingId,
        status: booking.status,
        isPaid: booking.isPaid
      });
  });

  return io;
};

module.exports = setupSocket;
