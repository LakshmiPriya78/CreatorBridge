import type { Response } from 'express';
import crypto from 'node:crypto';
import { db } from './db.js';

interface ClientConnection {
  userId: string;
  res: Response;
}

const activeClients = new Map<string, Set<Response>>();

export function addClientConnection(userId: string, res: Response) {
  if (!activeClients.has(userId)) {
    activeClients.set(userId, new Set());
  }
  activeClients.get(userId)!.add(res);
}

export function removeClientConnection(userId: string, res: Response) {
  const userSet = activeClients.get(userId);
  if (userSet) {
    userSet.delete(res);
    if (userSet.size === 0) {
      activeClients.delete(userId);
    }
  }
}

export function dispatchEventToUser(
  userId: string,
  event: {
    type: string;
    title: string;
    message: string;
    link?: string;
    payload?: any;
  }
) {
  const notificationId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Save persistent notification in DB
  try {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, link, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(notificationId, userId, event.title, event.message, event.link || '', event.type, createdAt);
  } catch (err) {
    console.error('Failed to save notification to DB:', err);
  }

  // Push SSE event to live client if connected
  const userClients = activeClients.get(userId);
  if (userClients && userClients.size > 0) {
    const dataString = JSON.stringify({
      id: notificationId,
      ...event,
      createdAt,
    });
    for (const res of userClients) {
      try {
        res.write(`event: ${event.type}\ndata: ${dataString}\n\n`);
      } catch (err) {
        console.error('Error writing SSE event:', err);
      }
    }
  }
}
