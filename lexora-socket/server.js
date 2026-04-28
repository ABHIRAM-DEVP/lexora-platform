const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Track users in rooms
const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, user }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    
    // Add user to room if not already there
    // Ensure user has essential fields
    const userData = {
        id: user.id || socket.id,
        name: user.name || 'Anonymous',
        email: user.email || '',
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'A')}&background=random`,
        socketId: socket.id
    };

    const existingIndex = rooms[roomId].findIndex(u => u.id === userData.id);
    if (existingIndex === -1) {
      rooms[roomId].push(userData);
    } else {
      rooms[roomId][existingIndex] = userData;
    }
    
    io.to(roomId).emit('room-users', rooms[roomId]);
    console.log(`User ${userData.name} joined room ${roomId}`);
  });

  socket.on('content-change', ({ roomId, content }) => {
    socket.to(roomId).emit('content-update', content);
  });

  socket.on('cursor-move', ({ roomId, user, position }) => {
    socket.to(roomId).emit('cursor-update', { user, position });
  });

  socket.on('disconnect', () => {
    // Remove user from all rooms
    for (const roomId in rooms) {
      const initialLength = rooms[roomId].length;
      rooms[roomId] = rooms[roomId].filter(u => u.socketId !== socket.id);
      if (rooms[roomId].length !== initialLength) {
        io.to(roomId).emit('room-users', rooms[roomId]);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
