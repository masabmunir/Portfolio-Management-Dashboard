import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as chatService from './chat.service';

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(2000),
    }),
  ).min(1).max(20), // Max 20 messages in history
});

export async function sendMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const userId = req.user!.id;
    const { messages } = parsed.data;

    const response = await chatService.chat(userId, messages);

    res.json({ message: response });
  } catch (err) {
    next(err);
  }
}