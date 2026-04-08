import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

const app = express();
const server = createServer(app);
const PORT = 3000;

// Multi-user chat server
const io = new Server(server, {
  cors: { origin: "https://cis1962sp26-socketchat-client.vercel.app/", methods: ["GET", "POST"] },
});

// Track online users per room
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room
  socket.on("join_room", ({ username, room }) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push({ id: socket.id, username });

    // Broadcast to everyone in the room that a new user joined
    socket.to(room).emit("user_joined", `${username} joined the room!`);

    // Send updated user list to room
    io.to(room).emit("room_users", rooms[room]);
  });

  // Listen for chat messages
  socket.on("chat_message", ({ room, message, username }) => {
    io.to(room).emit("chat_message", { username, message });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // Remove user from rooms
    for (const room in rooms) {
      const index = rooms[room].findIndex((u) => u.id === socket.id);
      if (index !== -1) {
        const user = rooms[room].splice(index, 1)[0];
        socket.to(room).emit("user_left", `${user.username} left the room`);
        io.to(room).emit("room_users", rooms[room]);
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));