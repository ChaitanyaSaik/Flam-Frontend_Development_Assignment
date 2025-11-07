#  Real-Time Collaborative Drawing Canvas

##  Overview
This project is a **multi-user real-time drawing application** built using **HTML5 Canvas**, **Node.js**, and **Socket.IO**.  
Multiple users can draw simultaneously on the same canvas with smooth synchronization, global undo/redo, and live user indicators.

---

##  Features

-  Brush & Eraser Tools
-  Color Picker and Adjustable Stroke Width
-  Real-time Sync using WebSockets (Socket.IO)
-  User Count Display
-  Global Undo/Redo System (affects all users)
-  Touch and Mouse Support
-  Conflict-free Drawing (Canvas layer sync)
-  Clean, responsive UI built with HTML + CSS

---

##  Technical Highlights

### Canvas Mastery
- Smooth line drawing via path interpolation.
- Undo/Redo tracked using operation stacks.
- Optimized redraws (only changed strokes re-render).

### Real-Time Communication
- Socket.IO-based event streaming (`draw`, `undo`, `redo`, `cursor`).
- Automatic reconnection and buffering for latency tolerance.

### State Synchronization
- Server maintains global canvas state (`drawing-state.js`).
- When a user joins, they receive the latest canvas data instantly.

### Conflict Resolution
- Version control ensures no conflicting undo/redo actions.
- Global operation stack broadcast keeps all users consistent.

---

## Installation & Running

###  Clone the Repository
```bash
git clone https://github.com/yourusername/collaborative-canvas.git
cd collaborative-canvas
```

###  Install Dependencies
```bash
npm install
```

###  Start the Server
```bash
npm start
```
> Default port: **http://localhost:3000**

###  Open Multiple Tabs
Try drawing in multiple browser tabs — changes will appear in real-time!

---

##  Folder Structure

```
collaborative-canvas/
├── client/
│   ├── index.html
│   ├── style.css
│   ├── canvas.js
│   ├── websocket.js
│   └── main.js
├── server/
│   ├── server.js
│   ├── rooms.js
│   └── drawing-state.js
├── package.json
├── README.md
└── ARCHITECTURE.md
```

---

##  Known Limitations

- Global undo/redo affects all users (no per-user history).
- Canvas persistence (saving drawings) not yet implemented.
- No authentication (open anonymous sessions).

---

##  Future Enhancements

- Per-user undo/redo (tagging strokes by userId).
- Persistent storage (Redis / MongoDB).
- Room system (separate collaborative sessions).
- Advanced shapes (rectangles, circles, text).
- Performance metrics overlay (FPS, latency).

---

##  Author
**Chaitanya’s Real-Time Canvas Project**  
Built for advanced front-end + WebSocket performance evaluation.
