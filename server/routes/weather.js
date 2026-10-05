const { Router } = require('express');
const weatherService = require('../services/weatherService');

module.exports = () => {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const weather = await weatherService.lookup({
        lat: req.query.lat,
        lng: req.query.lng,
        date: req.query.date,
        time: req.query.time,
      });
      return res.json({ weather });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
