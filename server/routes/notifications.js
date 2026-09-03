const { Router } = require('express');
const notificationService = require('../services/notificationService');

module.exports = () => {
  const router = Router();

  const requireAuth = (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ error: 'Not authenticated' });
      return false;
    }
    return true;
  };

  router.get('/', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const notifications = await notificationService.listForUser(req.user.user_id);
      const unreadCount = await notificationService.getUnreadCount(req.user.user_id);
      return res.json({ notifications, unreadCount });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/preferences', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const preferences = await notificationService.getPreferences(req.user.user_id);
      return res.json({ preferences });
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/preferences', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const body = req.body || {};
      const preferences = await notificationService.updatePreferences(req.user.user_id, {
        notifyOnFollow: body.notifyOnFollow,
        notifyOnLike: body.notifyOnLike,
      });
      return res.json({ preferences });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/read-all', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const result = await notificationService.markAllRead(req.user.user_id);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/read', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const notification = await notificationService.markRead(
        Number(req.params.id),
        req.user.user_id
      );
      return res.json({ notification });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
