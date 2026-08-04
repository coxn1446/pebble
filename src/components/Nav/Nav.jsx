import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser, selectIsAuthenticated, selectUser } from '../../store/auth.reducer';
import { logout } from '../../helpers/authHelpers';
import BrandMark from '../Brand/BrandMark';

const Nav = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
  };

  return (
    <header className="border-b border-border/80 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <BrandMark size="sm" />
        <nav className="flex items-center gap-4 text-sm">
          {isAuthenticated ? (
            <>
              <span className="text-muted">{user?.display_name || user?.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-border bg-surface px-3 py-1.5 text-ink transition hover:border-pebble"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-muted transition hover:text-ink">
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-2xl bg-accent px-3 py-1.5 font-medium text-white transition hover:bg-accent-hover"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Nav;
