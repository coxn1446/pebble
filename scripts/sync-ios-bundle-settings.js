#!/usr/bin/env node
/**
 * After `cap sync`, update Xcode PRODUCT_BUNDLE_IDENTIFIER / CFBundleDisplayName for CAP_APP_ENV.
 */

const fs = require('fs/promises');
const path = require('path');
const { getCapacitorFlavorConfig } = require('./capacitor-env');

function escapePlistAppName(appName) {
  return String(appName).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function replaceProductBundleIdentifiers(pbxContent, appId) {
  return pbxContent.replace(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+)/g, `PRODUCT_BUNDLE_IDENTIFIER = ${appId}`);
}

function readProductBundleIdentifiers(pbxContent) {
  return [...pbxContent.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+)/g)].map((m) => m[1].trim());
}

function replaceCfBundleDisplayName(plistContent, appName) {
  const safe = escapePlistAppName(appName);
  return plistContent.replace(
    /(\t*)<key>CFBundleDisplayName<\/key>\s*\n\s*<string>([^<]*)<\/string>/,
    (_match, indent) => `${indent}<key>CFBundleDisplayName</key>\n${indent}<string>${safe}</string>`
  );
}

function readCfBundleDisplayName(plistContent) {
  const match = plistContent.match(/<key>CFBundleDisplayName<\/key>\s*\n\s*<string>([^<]*)<\/string>/);
  return match ? match[1].trim() : null;
}

async function syncIosBundleSettings() {
  const { appId, appName, flavor } = getCapacitorFlavorConfig();
  const root = path.join(__dirname, '..');
  const pbxPath = path.join(root, 'ios/App/App.xcodeproj/project.pbxproj');
  const plistPath = path.join(root, 'ios/App/App/Info.plist');

  try {
    await fs.access(pbxPath);
  } catch {
    console.warn('[pebble-bundle] iOS project not found. Run: npx cap add ios');
    return;
  }

  const pbx = await fs.readFile(pbxPath, 'utf8');
  const bundleIds = readProductBundleIdentifiers(pbx);
  const nextPbx = replaceProductBundleIdentifiers(pbx, appId);
  if (nextPbx !== pbx) await fs.writeFile(pbxPath, nextPbx, 'utf8');

  const plist = await fs.readFile(plistPath, 'utf8');
  const currentDisplayName = readCfBundleDisplayName(plist);
  const nextPlist = replaceCfBundleDisplayName(plist, appName);
  if (nextPlist !== plist) await fs.writeFile(plistPath, nextPlist, 'utf8');

  if (process.env.CAP_LOG_BUNDLE !== '0') {
    const bundleUpToDate = bundleIds.length > 0 && bundleIds.every((id) => id === appId);
    const displayUpToDate = currentDisplayName === appName;
    const status = bundleUpToDate && displayUpToDate ? 'already up to date' : 'updated';
    console.log(`[pebble-bundle] Xcode bundle settings ${status}`, { flavor, appId, appName });
  }
}

if (require.main === module) {
  syncIosBundleSettings().catch((e) => {
    console.error('[pebble-bundle] sync-ios-bundle-settings failed:', e.message);
    process.exit(1);
  });
}

module.exports = {
  escapePlistAppName,
  replaceProductBundleIdentifiers,
  readProductBundleIdentifiers,
  replaceCfBundleDisplayName,
  readCfBundleDisplayName,
  syncIosBundleSettings,
};
