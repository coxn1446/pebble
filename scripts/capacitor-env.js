/**
 * Capacitor iOS flavor resolution for capacitor.config.ts.
 * Uses CAP_APP_ENV (not NODE_ENV).
 */

require('dotenv').config();

const DEFAULT_PROD_URL = 'https://pebble-prod-placeholder.run.app';
const DEFAULT_QA_URL = 'https://pebble-qa-placeholder.run.app';
const DEFAULT_DEV_URL = 'http://localhost:3000';

function normalizeCapAppEnv(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'prod' || v === 'production') return 'prod';
  if (v === 'qa') return 'qa';
  return 'dev';
}

function getCapacitorFlavorConfig(env = process.env) {
  const flavor = normalizeCapAppEnv(env.CAP_APP_ENV);
  const prodUrl = (env.CAP_PROD_URL || env.CAP_SERVER_URL_PROD || '').trim();
  const qaUrl = (env.CAP_QA_URL || env.CAP_SERVER_URL_QA || '').trim();
  const devUrl = (env.CAP_DEV_URL || env.CAP_SERVER_URL_DEV || '').trim() || DEFAULT_DEV_URL;

  let resolved;
  switch (flavor) {
    case 'prod':
      resolved = {
        appId: 'io.pebble.app',
        appName: 'Pebble',
        serverUrl: prodUrl || DEFAULT_PROD_URL,
      };
      break;
    case 'qa':
      resolved = {
        appId: 'io.pebble.qa',
        appName: 'Pebble QA',
        serverUrl: qaUrl || DEFAULT_QA_URL,
      };
      break;
    default:
      resolved = {
        appId: 'io.pebble.app.dev',
        appName: 'Pebble Dev',
        serverUrl: devUrl,
      };
      break;
  }

  const cleartext = /^http:\/\//i.test(resolved.serverUrl);

  return {
    flavor,
    appId: resolved.appId,
    appName: resolved.appName,
    serverUrl: resolved.serverUrl,
    cleartext,
  };
}

module.exports = {
  normalizeCapAppEnv,
  getCapacitorFlavorConfig,
  DEFAULT_PROD_URL,
  DEFAULT_QA_URL,
  DEFAULT_DEV_URL,
};
