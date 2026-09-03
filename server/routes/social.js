const { Router } = require('express');
const socialService = require('../services/socialService');

module.exports = () => {
  const router = Router();

  const requireAuth = (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ error: 'Not authenticated' });
      return false;
    }
    return true;
  };

  router.post('/follow/:userId', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const result = await socialService.follow(req.user.user_id, req.params.userId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  router.delete('/follow/:userId', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const result = await socialService.unfollow(req.user.user_id, req.params.userId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/block/:userId', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const result = await socialService.block(req.user.user_id, req.params.userId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  router.delete('/block/:userId', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const result = await socialService.unblock(req.user.user_id, req.params.userId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
