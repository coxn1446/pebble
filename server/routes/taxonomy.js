const { Router } = require('express');
const taxonomyService = require('../services/taxonomyService');

module.exports = () => {
  const router = Router();

  router.get('/fields', async (req, res, next) => {
    try {
      const fields = await taxonomyService.listFields();
      return res.json({ fields });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/phenomena', async (req, res, next) => {
    try {
      const phenomena = await taxonomyService.listPhenomena(req.query.field_id);
      return res.json({ phenomena });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
