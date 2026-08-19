import { ChatMessage, User } from '../models/index.js';
import { z } from 'zod';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty')
});

export const getChatMessages = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;

    const messages = await ChatMessage.findAll({
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit)
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const postChatMessage = async (req, res, next) => {
  try {
    const validated = messageSchema.parse(req.body);

    const msg = await ChatMessage.create({
      senderId: req.user.id,
      message: validated.message
    });

    const fullMessage = await ChatMessage.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role'] }]
    });

    // Emit socket event if io instance is attached to app
    if (req.app.get('io')) {
      req.app.get('io').emit('chat_message', fullMessage);
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};
