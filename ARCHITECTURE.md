#  ARCHITECTURE.md — Collaborative Drawing Canvas

##  Data Flow Overview

```
Client (Canvas + WebSocket)
   ↓ draw event {x, y, color, width, tool}
Server (Socket.IO)
   ↓ broadcast draw event
All connected clients receive → update canvas in real-time
```

---

##  System Components

###  Client Side (`client/`)
- **index.html** — UI layout with toolbar & canvas.
- **style.css** — Responsive styling for toolbar and canvas.
- **canvas.js** — Handles mouse/touch drawing, undo/redo logic.
- **websocket.js** — Manages Socket.IO connection and event handling.
- **main.js** — Initializes app, connects all modules.

###  Server Side (`server/`)
- **server.js** — Express + Socket.IO server; routes static files.
- **drawing-state.js** — Maintains global stroke history for all users.
- **rooms.js** — Optional: manages separate drawing rooms.

---

##  Message Protocol

| Event | Direction | Payload | Description |
|--------|------------|----------|-------------|
| `draw` | client → server → all | `{x, y, color, width, tool}` | Broadcasts drawing points |
| `draw_points` | client → server → all | `[{x, y}, {x2, y2}, ...]` | Batched drawing points |
| `cursor` | client → server → all | `{x, y, userColor}` | Shows other users’ cursors |
| `undo` | client → server → all | None | Removes last global stroke |
| `redo` | client → server → all | None | Restores last undone stroke |
| `sync_state` | server → client | `[stroke1, stroke2, ...]` | Sends full canvas history to new users |

---

##  Undo/Redo Strategy

- Each stroke (continuous mouse drag) is saved as one object.
- Server maintains two stacks:
  - `doneStack` → all completed strokes.
  - `undoneStack` → strokes removed by undo.
- Undo removes the last stroke globally and triggers full canvas redraw.
- Redo re-applies the most recent undone stroke.

```js
// Pseudocode example
socket.on('undo', () => {
  const stroke = doneStack.pop();
  undoneStack.push(stroke);
  io.emit('redraw', doneStack);
});
```

---

##  Performance Design Decisions

- **Throttling:** Mousemove events limited to ~60fps for smoothness.
- **Batching:** Drawing points grouped before emission to reduce network spam.
- **Lightweight messages:** JSON only contains essential stroke info.
- **Redrawing:** Full canvas re-render only on undo/redo or sync.

---

##  User Management

- Server assigns each new client a random color.
- Cursor position is broadcasted to others.
- Online user count updates dynamically.

---

## Conflict Resolution

- All operations timestamped.
- Server processes events in arrival order.
- Undo/Redo locks prevent simultaneous undo conflicts.

---

##  Scalability Considerations

| Scenario | Solution |
|-----------|-----------|
| 100+ Users | Optimize redraw batching |
| 1000+ Users | Move stroke state to Redis pub/sub |
| Persistence | Store `doneStack` in MongoDB or JSON file |
| Latency | WebSocket compression and delta updates |

---

##  Summary

This architecture ensures a **consistent, real-time synchronized canvas** across all clients while maintaining simplicity and extensibility.

```text
Client (Canvas, WebSocket)
   ↕
Socket.IO Server (State, Broadcast)
   ↕
All Connected Clients (Sync, Redraw)
```
