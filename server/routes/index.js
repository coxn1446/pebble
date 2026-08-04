const { Router } = require('express');
const authRoutes = require('./auth');
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
        STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY),
      },
    };
    if (process.env.DB_SCHEMA && String(process.env.DB_SCHEMA).trim()) {
      payload.db_schema = process.env.DB_SCHEMA.trim();
    }
    res.json(payload);
  });

  router.use('/auth', authRoutes());

  return router;
};
