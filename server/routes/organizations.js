const { Router } = require('express');
const organizationService = require('../services/organizationService');

module.exports = () => {
  const router = Router();

  router.get('/search', async (req, res, next) => {
    try {
      const organizations = await organizationService.search(req.query.q);
      return res.json({ organizations });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const organization = await organizationService.getById(Number(req.params.id));
      return res.json({ organization });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const body = req.body || {};
      const organization = await organizationService.create(req.user.user_id, {
        name: body.name,
        placeId: body.placeId,
        placeName: body.placeName,
        placeLat: body.placeLat,
        placeLng: body.placeLng,
      });
      return res.status(201).json({ organization });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
