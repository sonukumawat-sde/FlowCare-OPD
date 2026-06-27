require('dotenv').config(); // Load environment variables first
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const authRoutes = require('./src/routes/authRoutes');

// YAHAN PATHS UPDATE KIYE HAIN (Added /src/)
const connectDB = require('./src/config/db');
const queueRoutes = require('./src/routes/queueRoutes'); 
const analyticsRoutes = require('./src/routes/analyticsRoutes'); 

// Initialize Express App
const app = express();

// Middleware
app.use(cors()); // Cross-Origin Resource Sharing
app.use(express.json()); // JSON data parse karne ke liye

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: '*', // Abhi development ke liye allow all
    methods: ['GET', 'POST']
  }
});

// Make 'io' accessible globally in our API routes
app.set('io', io);

// Link Routes to the application
app.use('/api', queueRoutes);
app.use('/api', analyticsRoutes); 
app.use('/api/auth', authRoutes);

// Basic Route to check if server is running
app.get('/', (req, res) => {
  res.send('FlowCare API is running...');
});

// Start Server & Connect to DB
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // Pehle Database connect karo
  
  server.listen(PORT, () => {
    console.log(`[Server] FlowCare Backend is running on port ${PORT}`);
    console.log(`[Socket.IO] Real-time engine initialized`);
  });
};

startServer();