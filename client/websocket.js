// client/websocket.js
// Thin socket wrapper used by the client modules.
// Keeps the message schema simple and explicit.

const socket = io();

// Outgoing helpers
export function sendRealtimePoint(roomId, payload) {
  // realtime small point (low-latency preview)
  socket.emit('drawPoint', { roomId, payload });
}

export function sendStrokeCommit(roomId, stroke) {
  // commit a full stroke (array of points). Used for history (undo/redo).
  socket.emit('stroke', { roomId, stroke });
}

export function sendCursor(roomId, cursor) {
  socket.emit('cursor', { roomId, cursor });
}

export function sendUndo(roomId) {
  socket.emit('undo', { roomId });
}

export function sendRedo(roomId) {
  socket.emit('redo', { roomId });
}

export function joinRoom(roomId = 'default') {
  socket.emit('join', { roomId });
}

// Incoming listeners (subscribe)
export function onRealtimePoint(cb) { socket.on('drawPoint', cb); }
export function onStroke(cb) { socket.on('stroke', cb); }
export function onFullRedraw(cb) { socket.on('fullRedraw', cb); }
export function onCursor(cb) { socket.on('cursor', cb); }
export function onUserCount(cb) { socket.on('userCount', cb); }

// expose socket id if needed
export function onConnected(cb) { socket.on('connected', cb); }
