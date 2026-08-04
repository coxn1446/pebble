const { Router } = require('express');
const passport = require('passport');
const authService = require('../services/authService');

const getClientUrl = () => process.env.DEFAULT_CLIENT_URL || 'http://localhost:3000';

const oauthConfigured = (name) => {
  if (name === 'google') {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
  if (name === 'apple') {
    return Boolean(
      process.env.APPLE_CLIENT_ID &&
        process.env.APPLE_TEAM_ID &&
        process.env.APPLE_KEY_ID &&
        process.env.APPLE_KEY
    );
  }
  return false;
};

module.exports = () => {
  const router = Router();

  router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid email or password' });
      }
      return req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json({ user });
      });
    })(req, res, next);
  });

  router.post('/register', async (req, res, next) => {
    try {
      const user = await authService.registerLocalUser({
        email: req.body?.email,
        password: req.body?.password,
        username: req.body?.username,
        displayName: req.body?.displayName,
      });
      return req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({ user });
      });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/google', (req, res, next) => {
    if (!oauthConfigured('google')) {
      return res.status(503).json({ error: 'Google OAuth is not configured' });
    }
    return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  router.get(
    '/google/callback',
    (req, res, next) => {
      if (!oauthConfigured('google')) {
        return res.redirect(`${getClientUrl()}/login?error=google`);
      }
      return passport.authenticate('google', {
        failureRedirect: `${getClientUrl()}/login?error=google`,
      })(req, res, next);
    },
    (req, res) => {
      res.redirect(getClientUrl());
    }
  );

  router.get('/apple', (req, res, next) => {
    if (!oauthConfigured('apple')) {
      return res.status(503).json({ error: 'Apple Sign In is not configured' });
    }
    return passport.authenticate('apple')(req, res, next);
  });

  router.post(
    '/apple/callback',
    (req, res, next) => {
      if (!oauthConfigured('apple')) {
        return res.redirect(`${getClientUrl()}/login?error=apple`);
      }
      return passport.authenticate('apple', {
        failureRedirect: `${getClientUrl()}/login?error=apple`,
      })(req, res, next);
    },
    (req, res) => {
      res.redirect(getClientUrl());
    }
  );

  router.get('/me', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    return res.status(401).json({ error: 'Not authenticated' });
  });

  router.post('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  });

  return router;
};
