import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthLoading, selectIsAuthenticated } from '../../store/auth.reducer';
import Nav from '../Nav/Nav';
import Loading from '../Loading/Loading';

const MARKETING_PATHS = ['/how-it-works', '/about-us'];

const isMarketingPath = (pathname) => MARKETING_PATHS.includes(pathname);

const isFullWidthPath = (pathname) => {
  if (
    pathname === '/' ||
    pathname === '/map' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/notifications' ||
    pathname === '/profile' ||
    pathname === '/settings' ||
    isMarketingPath(pathname)
  ) {
    return true;
  }
  if (pathname.startsWith('/u/')) return true;
  if (/^\/pebbles\/\d+$/.test(pathname)) return true;
  return false;
};

/**
 * App shell: sticky left nav (auth only) + independently scrolling content.
 * Map, notifications, profile, settings, and pebble detail use a full-bleed pane.
 * Guest marketing and login are full-bleed without the app sidebar.
 */
const ContentArea = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const { pathname } = useLocation();
  const isFullWidth = isFullWidthPath(pathname);
  const isMapRoute = pathname === '/' || pathname === '/map';
  const isMarketingRoute = isMarketingPath(pathname);
  const isGuestHome = isMapRoute && !isAuthenticated;
  const isGuestAuth =
    !isAuthenticated && (pathname === '/login' || pathname === '/register');
  const isMarketingShell = isGuestHome || isMarketingRoute;
  const showNav = isAuthenticated && !isMarketingRoute;

  if (isLoading) {
    return (
      <div className="flex h-dvh max-h-dvh items-center justify-center overflow-hidden">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 overflow-hidden">
      {showNav ? <Nav /> : null}
      <div
        data-testid="content-pane"
        data-layout={isFullWidth ? 'full' : 'readable'}
        className={
          isMapRoute && isAuthenticated
            ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
            : isMarketingShell || isGuestAuth
              ? 'min-h-0 min-w-0 flex-1 overflow-hidden'
              : 'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-none'
        }
      >
        <main
          className={
            isMapRoute && isAuthenticated
              ? 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-5'
              : isMarketingShell || isGuestAuth
                ? 'flex h-full min-h-0 w-full min-w-0 flex-col'
                : isFullWidth
                  ? 'w-full min-w-0 px-4 py-6 md:px-6 md:py-8'
                  : 'mx-auto w-full max-w-3xl px-6 py-10'
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default ContentArea;
