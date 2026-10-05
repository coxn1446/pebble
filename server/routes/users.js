const { Router } = require('express');
const userService = require('../services/userService');
const pebbleService = require('../services/pebbleService');

module.exports = () => {
  const router = Router();

  router.get('/me', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const user = await userService.getMe(req.user.user_id);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/me', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const body = req.body || {};
      const payload = {
        displayName: body.displayName,
        username: body.username,
        profession: body.profession,
        fieldOfStudy: body.fieldOfStudy,
        placeId: body.placeId,
        placeName: body.placeName,
        placeLat: body.placeLat,
        placeLng: body.placeLng,
        placeLocality: body.placeLocality,
        placeAdminArea: body.placeAdminArea,
        placeCountry: body.placeCountry,
        contentSearchable: body.contentSearchable,
        profilePicUrl: body.profilePicUrl,
      };
      if (Object.prototype.hasOwnProperty.call(body, 'blurb')) {
        payload.blurb = body.blurb;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'employerOrgId')) {
        payload.employerOrgId = body.employerOrgId;
      }
      if (!Object.prototype.hasOwnProperty.call(body, 'profilePicUrl')) {
        delete payload.profilePicUrl;
      }
      const user = await userService.updateMe(req.user.user_id, payload);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/map', async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const users = await userService.listForMap(req.user.user_id, {
        q: req.query.q,
        author: req.query.author,
        region: req.query.region,
      });
      return res.json({ users });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/:username/followers', async (req, res, next) => {
    try {
      const viewerId = req.isAuthenticated && req.isAuthenticated() ? req.user.user_id : null;
      const users = await userService.listFollowers(req.params.username, viewerId);
      return res.json({ users });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/:username/following', async (req, res, next) => {
    try {
      const viewerId = req.isAuthenticated && req.isAuthenticated() ? req.user.user_id : null;
      const users = await userService.listFollowing(req.params.username, viewerId);
      return res.json({ users });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/:username', async (req, res, next) => {
    try {
      const viewerId = req.isAuthenticated && req.isAuthenticated() ? req.user.user_id : null;
      const user = await userService.getByUsername(req.params.username, viewerId);
      const pebbles = await pebbleService.listByAuthor(user.user_id, viewerId);
      return res.json({ user, pebbles });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
