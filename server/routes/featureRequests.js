const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const { Router } = require('express');
const multer = require('multer');
const featureRequestService = require('../services/featureRequestService');
const uploadService = require('../services/uploadService');

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${path.extname(file.originalname || '')}`);
    },
  }),
});

const requireUser = (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return req.user;
};

module.exports = () => {
  const router = Router();

  router.get('/access', (req, res, next) => {
    try {
      const user = requireUser(req, res);
      if (!user) return undefined;
      return res.json(featureRequestService.accessFor(user.user_id));
    } catch (err) {
      return next(err);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const user = requireUser(req, res);
      if (!user) return undefined;
      const entries = await featureRequestService.listLog(user.user_id);
      return res.json({ entries, ...featureRequestService.accessFor(user.user_id) });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/files/session', async (req, res, next) => {
    try {
      const user = requireUser(req, res);
      if (!user) return undefined;
      featureRequestService.assertCanSubmit(user.user_id);
      const session = await uploadService.createFeatureUploadSession(req.body || {});
      return res.json(session);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/files/complete', async (req, res, next) => {
    try {
      const user = requireUser(req, res);
      if (!user) return undefined;
      featureRequestService.assertCanSubmit(user.user_id);
      const file = await uploadService.completeFeatureUpload(req.body || {});
      return res.status(201).json({ file });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/files', (req, res, next) => {
    const user = requireUser(req, res);
    if (!user) return undefined;
    upload.single('file')(req, res, async (err) => {
      if (err) return next(err);
      try {
        featureRequestService.assertCanSubmit(user.user_id);
        const file = await uploadService.storeUnboundedFile(req.file);
        return res.status(201).json({ file });
      } catch (e) {
        return next(e);
      }
    });
    return undefined;
  });

  router.post('/log', async (req, res, next) => {
    try {
      const user = requireUser(req, res);
      if (!user) return undefined;
      const body = req.body || {};
      const entry = await featureRequestService.addLogEntry(user.user_id, {
        description: body.description,
        releaseDate: body.releaseDate,
        status: body.status,
      });
      return res.status(201).json({ entry });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const user = requireUser(req, res);
      if (!user) return undefined;
      const body = req.body || {};
      const result = await featureRequestService.submit(user, {
        body: body.body,
        files: body.files,
      });
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
