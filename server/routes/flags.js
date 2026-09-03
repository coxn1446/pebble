const { Router } = require('express');
const moderationService = require('../services/moderationService');

module.exports = () => {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const body = req.body || {};
      const flag = await moderationService.createFlag(req.user.user_id, {
        targetType: body.targetType,
        targetId: body.targetId,
        reason: body.reason,
        details: body.details,
      });
      return res.status(201).json({ flag });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
