# WebSocket Real-Time Chat System

## Architecture

StockPilot implements real-time messaging between administrators and staff using **Socket.IO**.

1. **Server Setup**: Socket.IO initialized on HTTP server instance (`new Server(server)`).
2. **Client Setup**: React components consume `SocketContext` powered by `socket.io-client`.
3. **Database Integration**: Chat messages sent over socket are simultaneously persisted to the `ChatMessages` SQL table.
4. **Broadcast**: Incoming `send_message` events trigger a global `chat_message` broadcast to all connected client sockets with populated sender details (`User.name`, `User.role`).
