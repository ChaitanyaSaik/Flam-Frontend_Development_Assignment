// server/server.js
// Express + Socket.io server for collaborative canvas.
// Use: npm start

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const rooms = require('./rooms');
const drawingState = require('./drawing-state');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve client static files from ../client
app.use(express.static(path.join(__dirname, '..', 'client')));

// Basic health
app.get('/health', (req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  // send connected event with socket id
  socket.emit('connected', socket.id);

  // handle join
  socket.on('join', ({ roomId = 'default' }) => {
    socket.join(roomId);
    rooms.joinRoom(roomId, socket.id);

    // send current user count
    const count = rooms.getUserCount(roomId);
    io.to(roomId).emit('userCount', count);

    // send full redraw (authoritative strokes) to newly joined socket only
    const ops = drawingState.getOperations(roomId);
    socket.emit('fullRedraw', { operations: ops });
  });

  // realtime point preview
  socket.on('drawPoint', ({ roomId = 'default', payload }) => {
    // broadcast to others in room for preview
    socket.to(roomId).emit('drawPoint', { socketId: socket.id, payload });
  });

  // stroke commit - authoritative operation
  socket.on('stroke', ({ roomId = 'default', stroke }) => {
    drawingState.addStroke(roomId, stroke);
    // broadcast stroke to everyone (including sender optional)
    io.to(roomId).emit('stroke', { stroke });
  });

  // cursor (small frequent updates)
  socket.on('cursor', ({ roomId = 'default', cursor }) => {
    socket.to(roomId).emit('cursor', { socketId: socket.id, cursor });
  });

  // undo request (global). Server applies it and emits fullRedraw
  socket.on('undo', ({ roomId = 'default' }) => {
    const undone = drawingState.undo(roomId);
    // propagate updated operations to all clients in room
    const ops = drawingState.getOperations(roomId);
    io.to(roomId).emit('fullRedraw', { operations: ops });
  });

  // redo request
  socket.on('redo', ({ roomId = 'default' }) => {
    const redone = drawingState.redo(roomId);
    const ops = drawingState.getOperations(roomId);
    io.to(roomId).emit('fullRedraw', { operations: ops });
  });

  socket.on('disconnecting', () => {
    // remove socket from all rooms we tracked
    const myRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    for (const r of myRooms) {
      rooms.leaveRoom(r, socket.id);
      const count = rooms.getUserCount(r);
      io.to(r).emit('userCount', count);
    }
  });

  socket.on('disconnect', () => {
    // nothing else here
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
