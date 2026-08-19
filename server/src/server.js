import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { sequelize, ChatMessage, User } from './models/index.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

// Attach io instance to app for controller access
app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id}`);

  socket.on('send_message', async (data) => {
    try {
      if (data.senderId && data.message) {
        const chatMsg = await ChatMessage.create({
          senderId: data.senderId,
          message: data.message
        });

        const fullMsg = await ChatMessage.findByPk(chatMsg.id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role'] }]
        });

        io.emit('chat_message', fullMsg);
      }
    } catch (err) {
      logger.error('Socket chat error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`✅ Database connection established successfully (${env.DB_DIALECT.toUpperCase()}).`);

    // Sync database models
    await sequelize.sync({ alter: true });
    logger.info('✅ Database schema synchronized.');

    server.listen(env.PORT, () => {
      logger.info(`🚀 StockPilot Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
