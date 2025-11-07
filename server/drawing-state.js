// server/drawing-state.js
// Maintains authoritative stroke history per room and redo stacks.

const state = new Map(); // roomId -> { operations: [stroke], redo: [stroke] }

function ensure(roomId) {
  if (!state.has(roomId)) state.set(roomId, { operations: [], redo: [] });
  return state.get(roomId);
}

function addStroke(roomId, stroke) {
  const r = ensure(roomId);
  r.operations.push(stroke);
  // clear redo on new operation
  r.redo = [];
}

function undo(roomId) {
  const r = ensure(roomId);
  if (r.operations.length === 0) return null;
  const s = r.operations.pop();
  r.redo.push(s);
  return s;
}

function redo(roomId) {
  const r = ensure(roomId);
  if (r.redo.length === 0) return null;
  const s = r.redo.pop();
  r.operations.push(s);
  return s;
}

function getOperations(roomId) {
  const r = ensure(roomId);
  return r.operations.slice();
}

function clearRoom(roomId) {
  if (state.has(roomId)) state.set(roomId, { operations: [], redo: [] });
}

module.exports = {
  addStroke,
  undo,
  redo,
  getOperations,
  clearRoom,
};
