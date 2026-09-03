const { Router } = require('express');
const searchService = require('../services/searchService');

module.exports = () => {
  const router = Router();

  router.get('/suggest', async (req, res, next) => {
    try {
      const viewerId = req.isAuthenticated && req.isAuthenticated() ? req.user.user_id : null;
      const suggestions = await searchService.suggest(req.query.q, viewerId);
      return res.json({ suggestions });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
