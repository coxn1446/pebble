const { Router } = require('express');
const passport = require('passport');
const authService = require('../services/authService');

const getClientUrl = () => authService.clientOrigin();

const safeReturnPath = (value) => (value === '/settings' || value === '/profile' ? value : null);

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
        accountType: req.body?.accountType,
        organizationName: req.body?.organizationName,
      });
      return req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({ user });
      });
    } catch (err) {
      return next(err);
    }
  });

  const startOAuth = (provider) => (req, res, next) => {
    if (!oauthConfigured(provider)) {
      const label = provider === 'google' ? 'Google' : 'Apple';
      return res.status(503).json({ error: `${label} sign in is not configured` });
    }
    const linking = req.query.link === '1';
    if (linking && (!req.isAuthenticated || !req.isAuthenticated() || !req.user?.user_id)) {
      return res.redirect(`${getClientUrl()}/login`);
    }
    let state;
    try {
      state = authService.signOAuthState({
        purpose: linking ? 'link' : 'login',
        provider,
        userId: linking ? req.user.user_id : null,
        returnTo: linking ? safeReturnPath(req.query.return) || '/settings' : null,
      });
    } catch (err) {
      return next(err);
    }
    const options = provider === 'google' ? { scope: ['profile', 'email'], state } : { state };
    return passport.authenticate(provider, options)(req, res, next);
  };

  const finishOAuth = (provider) => (req, res, next) => {
    if (!oauthConfigured(provider)) {
      return res.redirect(`${getClientUrl()}/login?error=${provider}`);
    }
    return passport.authenticate(provider, (err, user) => {
      const state = authService.readOAuthState(req.query?.state || req.body?.state);
      const returnTo = safeReturnPath(state?.returnTo);
      const fail = (code) => {
        const path = returnTo || '/login';
        return res.redirect(`${getClientUrl()}${path}?error=${code}`);
      };
      if (err || !user) {
        return fail(err?.status === 409 ? 'conflict' : provider);
      }
      return req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        if (state?.purpose === 'link' && state.provider === provider && returnTo) {
          return res.redirect(`${getClientUrl()}${returnTo}?linked=${provider}`);
        }
        return res.redirect(getClientUrl());
      });
    })(req, res, next);
  };

  router.get('/google', startOAuth('google'));
  router.get('/google/callback', finishOAuth('google'));
  router.get('/apple', startOAuth('apple'));
  router.post('/apple/callback', finishOAuth('apple'));

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
