import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser, selectUser } from '../../store/auth.reducer';
import { logout } from '../../helpers/authHelpers';
import { fetchNotifications } from '../../helpers/notificationHelpers';
import BrandMark from '../Brand/BrandMark';
import UserAvatar from '../Profile/UserAvatar';
import { BellIcon, MapIcon } from '../Icons/Icons';

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition ${
    isActive ? 'bg-background font-medium text-ink' : 'text-muted hover:bg-background hover:text-ink'
  }`;

const Nav = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetchNotifications()
      .then((data) => {
        if (active) setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
  };

  return (
    <aside className="flex h-dvh w-56 shrink-0 flex-col border-r border-border/80 bg-surface/80 px-4 py-6 backdrop-blur-md">
      <BrandMark size="sm" to="/" />
      <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1">
        <NavLink to="/" end className={linkClass}>
          <MapIcon className="h-4 w-4 shrink-0" />
          Map
        </NavLink>
        <NavLink to="/notifications" className={linkClass}>
          <BellIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1">Notifications</span>
          {unreadCount > 0 ? (
            <span className="rounded-xl bg-accent px-1.5 py-0.5 text-xs font-medium text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          <UserAvatar user={user} className="h-6 w-6 rounded-full" emojiClassName="text-sm" />
          Profile
        </NavLink>
        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition hover:border-pebble"
          >
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Nav;
