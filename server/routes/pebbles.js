const { Router } = require('express');
const pebbleService = require('../services/pebbleService');

module.exports = () => {
  const router = Router();

  router.get('/feed', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const pebbles = await pebbleService.getFeed(req.user.user_id);
      return res.json({ pebbles });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/search', async (req, res, next) => {
    try {
      const viewerId = req.isAuthenticated && req.isAuthenticated() ? req.user.user_id : null;
      const pebbles = await pebbleService.search(
        {
          q: req.query.q,
          fieldId: req.query.field_id,
          author: req.query.author,
          region: req.query.region,
        },
        viewerId
      );
      return res.json({ pebbles });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/map', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const pebbles = await pebbleService.listForMap(req.user.user_id, {
        q: req.query.q,
        fieldId: req.query.field_id,
        author: req.query.author,
        region: req.query.region,
      });
      return res.json({ pebbles });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const viewerId = req.isAuthenticated && req.isAuthenticated() ? req.user.user_id : null;
      const pebble = await pebbleService.getById(Number(req.params.id), viewerId);
      return res.json({ pebble });
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
      const pebble = await pebbleService.create(req.user.user_id, {
        title: body.title,
        description: body.description,
        placeId: body.placeId,
        placeName: body.placeName,
        placeLat: body.placeLat,
        placeLng: body.placeLng,
        placeLocality: body.placeLocality,
        placeAdminArea: body.placeAdminArea,
        placeCountry: body.placeCountry,
        heroImageUrl: body.heroImageUrl,
        fieldNotes: body.fieldNotes,
        isPrivate: body.isPrivate,
        phenomenonIds: body.phenomenonIds,
        mediaIds: body.mediaIds,
      });
      return res.status(201).json({ pebble });
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const body = req.body || {};
      const pebble = await pebbleService.update(Number(req.params.id), req.user.user_id, {
        title: body.title,
        description: body.description,
        placeId: body.placeId,
        placeName: body.placeName,
        placeLat: body.placeLat,
        placeLng: body.placeLng,
        placeLocality: body.placeLocality,
        placeAdminArea: body.placeAdminArea,
        placeCountry: body.placeCountry,
        heroImageUrl: body.heroImageUrl,
        fieldNotes: body.fieldNotes,
        isPrivate: body.isPrivate,
        phenomenonIds: body.phenomenonIds,
      });
      return res.json({ pebble });
    } catch (err) {
      return next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const result = await pebbleService.remove(Number(req.params.id), req.user.user_id);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/like', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const pebble = await pebbleService.like(Number(req.params.id), req.user.user_id);
      return res.json({ pebble });
    } catch (err) {
      return next(err);
    }
  });

  router.delete('/:id/like', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const pebble = await pebbleService.unlike(Number(req.params.id), req.user.user_id);
      return res.json({ pebble });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
