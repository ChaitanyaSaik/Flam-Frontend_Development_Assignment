// client/main.js
import { init as initCanvas, setTool, setColor, setSize } from './canvas.js';
import { joinRoom, onUserCount, onConnected, sendUndo, sendRedo } from './websocket.js';

// UI elements
const canvasEl = document.getElementById('drawingBoard');
const colorPicker = document.getElementById('colorPicker');
const sizeRange = document.getElementById('brushSize');
const brushBtn = document.getElementById('brushBtn');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const userCountLabel = document.getElementById('userCount');

const ROOM_ID = 'default'; // can be extended to read from URL

// initialize canvas
initCanvas(canvasEl, { color: colorPicker.value, size: +sizeRange.value, roomId: ROOM_ID });

// join server room
joinRoom(ROOM_ID);

// UI handlers
colorPicker.addEventListener('change', (e) => {
  setColor(e.target.value);
});
sizeRange.addEventListener('input', (e) => {
  setSize(+e.target.value);
});

brushBtn.addEventListener('click', () => {
  setTool('brush');
  brushBtn.classList.add('active');
  eraserBtn.classList.remove('active');
});
eraserBtn.addEventListener('click', () => {
  setTool('eraser');
  eraserBtn.classList.add('active');
  brushBtn.classList.remove('active');
});

undoBtn.addEventListener('click', () => {
  sendUndo(ROOM_ID);
});
redoBtn.addEventListener('click', () => {
  sendRedo(ROOM_ID);
});

// show connected users
onUserCount((cnt) => { userCountLabel.textContent = String(cnt); });

// confirm connected socket id (log)
onConnected((socketId) => {
  console.info('Connected socket id:', socketId);
});

// Example snippet for main.js
brushBtn.addEventListener('click', () => {
  tool = 'brush';
  brushBtn.classList.add('active');
  eraserBtn.classList.remove('active');
});

eraserBtn.addEventListener('click', () => {
  tool = 'eraser';
  eraserBtn.classList.add('active');
  brushBtn.classList.remove('active');
});

