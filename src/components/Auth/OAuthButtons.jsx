import React from 'react';

const OAuthButtons = () => (
  <div className="space-y-2">
    <a
      href="/api/auth/google"
      className="flex w-full items-center justify-center rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-ink transition hover:border-pebble"
    >
      Continue with Google
    </a>
    <a
      href="/api/auth/apple"
      className="flex w-full items-center justify-center rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-ink transition hover:border-pebble"
    >
      Continue with Apple
    </a>
    <p className="pt-1 text-xs text-muted">
      Google and Apple return “not configured” until OAuth credentials are added.
    </p>
  </div>
);

export default OAuthButtons;
