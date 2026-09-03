const { Router } = require('express');
const { getMapsMapId, getPlacesApiKey } = require('../helpers/places');

module.exports = () => {
  const router = Router();

  router.get('/key', (req, res) => {
    const key = getPlacesApiKey();
    if (!key) {
      return res.json({ key: null, mapId: null, configured: false });
    }
    return res.json({ key, mapId: getMapsMapId(), configured: true });
  });

  return router;
};
