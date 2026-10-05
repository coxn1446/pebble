const { Router } = require('express');
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const organizationsRoutes = require('./organizations');
const placesRoutes = require('./places');
const uploadsRoutes = require('./uploads');
const taxonomyRoutes = require('./taxonomy');
const pebblesRoutes = require('./pebbles');
const collectionsRoutes = require('./collections');
const socialRoutes = require('./social');
const flagsRoutes = require('./flags');
const notificationsRoutes = require('./notifications');
const searchRoutes = require('./search');
const weatherRoutes = require('./weather');
const { isDbHealthy } = require('../db');

module.exports = () => {
  const router = Router();

  router.get('/health', (req, res) => {
    const payload = {
      status: 'ok',
      database: isDbHealthy() ? 'connected' : 'unavailable',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      secrets: {
        SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
        DB_USER: Boolean(process.env.DB_USER),
        DB_PASSWORD: Boolean(process.env.DB_PASSWORD),
        DB_DATABASE: Boolean(process.env.DB_DATABASE),
        GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
        GOOGLE_PLACES_API_KEY: Boolean(process.env.GOOGLE_PLACES_API_KEY),
        STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY),
      },
    };
    if (process.env.DB_SCHEMA && String(process.env.DB_SCHEMA).trim()) {
      payload.db_schema = process.env.DB_SCHEMA.trim();
    }
    res.json(payload);
  });

  router.use('/auth', authRoutes());
  router.use('/users', usersRoutes());
  router.use('/organizations', organizationsRoutes());
  router.use('/places', placesRoutes());
  router.use('/uploads', uploadsRoutes());
  router.use('/taxonomy', taxonomyRoutes());
  router.use('/pebbles', pebblesRoutes());
  router.use('/collections', collectionsRoutes());
  router.use('/social', socialRoutes());
  router.use('/flags', flagsRoutes());
  router.use('/notifications', notificationsRoutes());
  router.use('/search', searchRoutes());
  router.use('/weather', weatherRoutes());

  return router;
};
