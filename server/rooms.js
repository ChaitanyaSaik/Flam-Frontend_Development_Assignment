// server/rooms.js
// manages room membership counts
const rooms = new Map(); // roomId -> Set(socketId)

function joinRoom(roomId, socketId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(socketId);
}

function leaveRoom(roomId, socketId) {
  if (!rooms.has(roomId)) return;
  rooms.get(roomId).delete(socketId);
  if (rooms.get(roomId).size === 0) rooms.delete(roomId);
}

function getUserCount(roomId) {
  if (!rooms.has(roomId)) return 0;
  return rooms.get(roomId).size;
}

module.exports = {
  joinRoom,
  leaveRoom,
  getUserCount,
};
