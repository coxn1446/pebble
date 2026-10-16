const { Router } = require('express');
const uploadService = require('../services/uploadService');

const requireUser = (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
};

module.exports = () => {
  const router = Router();

  router.post('/session', async (req, res, next) => {
    try {
      if (!requireUser(req, res)) return undefined;
      const session = await uploadService.createUploadSession(req.body || {});
      return res.json(session);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/complete', async (req, res, next) => {
    try {
      if (!requireUser(req, res)) return undefined;
      const media = await uploadService.completeUpload(req.body || {});
      return res.status(201).json({ media });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      if (!requireUser(req, res)) return undefined;
      const upload = req.app.get('upload');
      upload.single('file')(req, res, async (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            err.status = 413;
            err.message = 'That file is too large. Keep photos and videos under 200 MB.';
          }
          return next(err);
        }
        try {
          const media = await uploadService.uploadBuffer(req.file, req.body?.mediaType);
          return res.status(201).json({ media });
        } catch (e) {
          return next(e);
        }
      });
      return undefined;
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
