import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { createLogger } from '../../shared/logger';
import { getRedisClient } from './cache';

const logger = createLogger('ChatSocket');

let io: SocketIOServer;

export function initializeChatSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket.io] Client connected: ${socket.id}`);

    // Join room (streamId or shopId)
    socket.on('join_room', (data: { roomId: string; username?: string }) => {
      const { roomId } = data;
      if (!roomId) return;
      void socket.join(roomId);
      logger.info(`[Socket.io] Client ${socket.id} joined room ${roomId}`);
    });

    // Handle incoming chat message
    socket.on('chat_message', (data: { roomId: string; username: string; text: string }) => {
      const { roomId, username, text } = data;
      if (!roomId || !text) return;

      // Broadcast to all clients in the room
      const msgObj = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        user: username || 'Anonymous',
        text
      };
      io.to(roomId).emit('chat_message', msgObj);

      // Save to Redis history
      getRedisClient().then(redis => {
        return Promise.all([
          redis.rPush(`chat:history:${roomId}`, JSON.stringify(msgObj)),
          redis.lTrim(`chat:history:${roomId}`, -50, -1) // Keep last 50 messages
        ]);
      }).catch(err => logger.error('Redis chat history error:', err));
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getChatSocket(): SocketIOServer {
  if (!io) {
    throw new Error('Chat Socket.io not initialized');
  }
  return io;
}
