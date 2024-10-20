import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import os from 'os';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// Express routes
app.get('/', (_req: Request, res: Response) => {
  new Promise((resolve) => {
    resolve(res.send('Backend server is running with TypeScript!'));
  })
});

app.get('/api/v1/test1', async (req, res) => {
  const hostname = os.hostname();
  console.log(`Request handled by pod: ${hostname}`);
  res.json({ message: `Hello from pod ${hostname}` });
});

app.get('/api/v1/test', async (req, res) => {
  try {
    const hostname = await getHostName();
    res.json({ message: `Hello from pod ${hostname}` });
  } catch (error) {
    res.status(500).send('An error occurred');
  }
});

function getHostName() {
  return new Promise((resolve, reject) => {
    try {
      const hostname = os.hostname();
      resolve(hostname);
    } catch (error) {
      reject(error);
    }
  });
}

app.get('/health', (_req, res) => {
  res.status(200).send('OK, I am Healthy!');
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io',
});

const chatNamespace = io.of('/');

// Set up Redis adapter
const redisUrl = process.env.REDIS_URL || 'redis://redis-service:6379';

const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

(async () => {
  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Socket.IO Redis adapter attached');

    // Start the server after Redis clients are connected and adapter is attached
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Redis connection error:', error);
  }
})();

// Socket.IO connection handler
chatNamespace.on('connection', (socket) => {
  console.log('User connected to /chat namespace:', socket.id);

  socket.on('sendMessage', ({ username, message }) => {
    console.log(`Received message from ${username} (${socket.id}) in /chat namespace: ${message}`);
    // Broadcast the message to all clients in the '/chat' namespace
    chatNamespace.emit('receiveMessage', { username, message });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from /chat namespace:', socket.id);
  });
});