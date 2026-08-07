const { Server } = require('socket.io');

function initSockets(httpServer) {
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

module.exports = initSockets;
