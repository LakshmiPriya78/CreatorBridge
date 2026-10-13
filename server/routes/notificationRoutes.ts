import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';

export const notificationRouter = Router();

// Get Notifications for Current User
notificationRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(user.id);

  const unreadCount = (
    db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`).get(user.id) as any
  ).count;

  return res.json({
    notifications,
    unreadCount,
  });
});

// Mark Single Notification as Read
notificationRouter.put('/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(id, user.id);
  return res.json({ message: 'Marked as read.' });
});

// Mark All as Read
notificationRouter.post('/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(user.id);
  return res.json({ message: 'All notifications marked as read.' });
});
