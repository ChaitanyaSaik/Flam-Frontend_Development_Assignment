// client/canvas.js
// Canvas drawing engine, handles local interaction + painting remote events.
// Exports: init(canvasElement, uiSettings), undoLocal(), redoLocal()

import {
  sendRealtimePoint,
  sendStrokeCommit,
  sendCursor,
  onRealtimePoint,
  onStroke,
  onFullRedraw,
  onCursor,
} from './websocket.js';

// internal state
let canvas, ctx;
let isDrawing = false;
let currentPath = [];
let tool = 'brush';
let color = '#000';
let size = 5;
let roomId = 'default';

// history live locally but authoritative server also manages history; on fullRedraw server tells authoritative state
let localHistory = []; // optimistic local history (strokes)
let localRedo = [];

export function init(canvasEl, settings = {}) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // initial settings
  if (settings.color) color = settings.color;
  if (settings.size) size = settings.size;
  if (settings.tool) tool = settings.tool;
  if (settings.roomId) roomId = settings.roomId;

  // appearance
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // mouse & touch events
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);

  // remote handlers
  onRealtimePoint(handleRemotePoint);
  onStroke(handleRemoteStroke);
  onFullRedraw(handleFullRedraw);
  onCursor(handleRemoteCursor);

  // simple cursor broadcast loop (throttle)
  let lastCursorEmit = 0;
  canvas.addEventListener('pointermove', (e) => {
    const now = Date.now();
    if (now - lastCursorEmit > 50) {
      const rect = canvas.getBoundingClientRect();
      sendCursor(roomId, { x: e.clientX - rect.left, y: e.clientY - rect.top });
      lastCursorEmit = now;
    }
  });
}


// resize canvas while preserving contents where possible
function resizeCanvas() {
  if (!canvas) return;
  const w = window.innerWidth;
  const h = Math.max(300, window.innerHeight - 120);
  // save and restore pixels
  const image = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
  canvas.width = w;
  canvas.height = h;
  if (image) ctx.putImageData(image, 0, 0);
}

// pointer handlers
function pointerDown(e) {
  isDrawing = true;
  currentPath = [];
  pointerMove(e); // capture first point
}

function pointerMove(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pt = { x: Math.round(x), y: Math.round(y) };
  currentPath.push(pt);

  // draw locally incrementally
  drawSegmentIncremental(pt);

  // send realtime small point for preview
  sendRealtimePoint(roomId, { tool, color, size, point: pt });
}

function pointerUp() {
  if (!isDrawing) return;
  isDrawing = false;
  if (currentPath.length === 0) return;

  // commit stroke (authoritative for history)
  const stroke = { id: generateId(), tool, color, size, points: currentPath.slice(), timestamp: Date.now() };
  localHistory.push(stroke);
  localRedo = [];
  sendStrokeCommit(roomId, stroke);
  currentPath = [];
}

// draw helpers
function drawSegmentIncremental(pt) {
  // draws last segment from previous point to pt
  const points = [pt];
  // if only one point, draw a dot
  if (ctx) {
    ctx.save();
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = (tool === 'eraser') ? 'destination-out' : 'source-over';

    if (points.length === 1) {
      // small circle for single point
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(1, size / 2), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // never used here but kept for completeness
    }
    ctx.restore();
  }
}

// full stroke drawing (used for redraw)
function drawStroke(stroke) {
  if (!ctx || !stroke || !stroke.points || stroke.points.length === 0) return;
  ctx.save();
  ctx.lineWidth = stroke.size;
  ctx.strokeStyle = stroke.color;
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.beginPath();
  const pts = stroke.points;
  ctx.moveTo(pts[0].x, pts[0].y);

  // simple smoothing: draw lines between points
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function clearCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// remote handlers
function handleRemotePoint(msg) {
  // msg: { socketId, payload: {tool,color,size,point} }
  const { payload } = msg;
  if (!payload) return;
  // draw a tiny segment/dot for preview
  const p = payload.point;
  ctx.save();
  ctx.lineWidth = payload.size;
  ctx.strokeStyle = payload.color;
  ctx.fillStyle = payload.color;
  ctx.globalCompositeOperation = payload.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(1, payload.size / 2), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function handleRemoteStroke(msg) {
  // msg: { stroke } where stroke is full stroke object
  const { stroke } = msg;
  drawStroke(stroke);
}

function handleFullRedraw(msg) {
  // msg: { operations: [strokes...] } authoritative state for room
  const { operations } = msg;
  // replace local history with authoritative operations
  localHistory = operations.slice();
  localRedo = [];
  clearCanvas();
  // replay strokes in order
  for (const s of localHistory) drawStroke(s);
}

// cursor handling (basic): we draw ephemeral cursors as overlay dots.
// For simplicity this implementation does not persist cursor drawings; cursors are drawn on top of canvas using a separate small canvas or DOM element would be better; here we implement a simple ephemeral dot.
const remoteCursors = {}; // id -> {x,y,ts}
function handleRemoteCursor(msg) {
  // msg: { socketId, cursor: {x,y} }
  const { socketId, cursor } = msg;
  remoteCursors[socketId] = { x: cursor.x, y: cursor.y, ts: Date.now() };
}

// small cursor render loop
setInterval(() => {
  if (!ctx) return;
  // redraw cursors without clearing main content: draw small semi-transparent circles
  const now = Date.now();
  ctx.save();
  for (const [id, c] of Object.entries(remoteCursors)) {
    if (now - c.ts > 2000) { delete remoteCursors[id]; continue; }
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,120,255,0.35)';
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}, 120);

// helper id
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// API to change settings
export function setTool(t) { tool = t; }
export function setColor(c) { color = c; }
export function setSize(s) { size = s; }
export function setRoomId(r) { roomId = r; joinRoomIfNeeded(r); }

// these are invoked by main.js when user clicks undo/redo
export function undoLocal() {
  // optimistically request server to undo; server will broadcast fullRedraw
  // keep no client-only changes here (server authoritative)
}
export function redoLocal() {
  // nothing local; server will handle
}

// join room helper (sends join via websocket wrapper in main)
import { joinRoom } from './websocket.js';
function joinRoomIfNeeded(r) {
  // intentionally async/loose coupling via websocket layer
  import('./websocket.js').then(m => m.joinRoom(r));
}

