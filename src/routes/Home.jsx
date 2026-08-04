import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../store/auth.reducer';
import { useNative } from '../utils/NativeContext';
import BrandMark, { BRAND_TAGLINE } from '../components/Brand/BrandMark';

const Home = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const { platform, isNative } = useNative();

  return (
    <section className="space-y-10">
      <div className="animate-fade-up">
        <BrandMark size="lg" showWordmark={false} to={null} animated className="mb-6" />
        <h1 className="font-display text-5xl font-bold lowercase tracking-tight text-ink">pebble</h1>
        <p className="mt-3 text-xs font-semibold uppercase tracking-tagline text-moss">
          {BRAND_TAGLINE}
        </p>
        <p className="mt-4 max-w-xl text-slate/70">
          Share meaningful discoveries and build a network of knowledge together — one pebble at a
          time.
        </p>
        {!isAuthenticated ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-pebble"
            >
              Sign in
            </Link>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-border bg-surface/80 px-5 py-4 text-sm text-muted animate-fade-up">
        <p>
          Platform: <span className="text-ink">{platform}</span>
          {isNative ? ' (native)' : ' (web)'}
        </p>
        {isAuthenticated ? (
          <p className="mt-2">
            Signed in as <span className="text-ink">{user?.email}</span>
          </p>
        ) : (
          <p className="mt-2">Local email/password auth is ready once the database schema is applied.</p>
        )}
      </div>
    </section>
  );
};

export default Home;
