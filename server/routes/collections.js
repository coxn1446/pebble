const { Router } = require('express');
const collectionService = require('../services/collectionService');

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
      const collections = await collectionService.listForUser(req.user.user_id);
      return res.json({ collections });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const body = req.body || {};
      const collection = await collectionService.create(req.user.user_id, {
        name: body.name,
        isPrivate: body.isPrivate,
        isCollaborative: body.isCollaborative,
      });
      return res.status(201).json({ collection });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const collection = await collectionService.getById(Number(req.params.id), req.user.user_id);
      return res.json({ collection });
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const body = req.body || {};
      const collection = await collectionService.update(Number(req.params.id), req.user.user_id, {
        name: body.name,
        isPrivate: body.isPrivate,
        isCollaborative: body.isCollaborative,
      });
      return res.json({ collection });
    } catch (err) {
      return next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const result = await collectionService.remove(Number(req.params.id), req.user.user_id);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/invite', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const member = await collectionService.invite(
        Number(req.params.id),
        req.user.user_id,
        Number(req.body?.userId)
      );
      return res.status(201).json({ member });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/accept', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const collection = await collectionService.acceptInvite(
        Number(req.params.id),
        req.user.user_id
      );
      return res.json({ collection });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/pebbles', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const collection = await collectionService.addPebble(
        Number(req.params.id),
        req.user.user_id,
        Number(req.body?.pebbleId)
      );
      return res.json({ collection });
    } catch (err) {
      return next(err);
    }
  });

  router.delete('/:id/pebbles/:pebbleId', async (req, res, next) => {
    try {
      if (!requireAuth(req, res)) return undefined;
      const collection = await collectionService.removePebble(
        Number(req.params.id),
        req.user.user_id,
        Number(req.params.pebbleId)
      );
      return res.json({ collection });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
