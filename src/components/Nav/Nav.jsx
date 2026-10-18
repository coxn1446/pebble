import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser, selectUser } from '../../store/auth.reducer';
import { logout } from '../../helpers/authHelpers';
import { fetchNotifications } from '../../helpers/notificationHelpers';
import { fetchFeatureAccess } from '../../helpers/featureRequestHelpers';
import { useMobileWelcome } from '../Welcome/WelcomeShared';
import BrandMark from '../Brand/BrandMark';
import FeatureRequestModal from '../FeatureRequests/FeatureRequestModal';
import NewCollectionForm from '../Collections/NewCollectionForm';
import Modal from '../Modal/Modal';
import UserAvatar from '../Profile/UserAvatar';
import { BellIcon, MapIcon, PlusIcon } from '../Icons/Icons';

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition ${
    isActive ? 'bg-background font-medium text-ink' : 'text-muted hover:bg-background hover:text-ink'
  }`;

const tabClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs ${
    isActive ? 'font-medium text-ink' : 'text-muted'
  }`;

const UnreadBadge = ({ count }) =>
  count > 0 ? (
    <span className="rounded-xl bg-accent px-1.5 py-0.5 text-xs font-medium text-white">
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

const Nav = () => {
  const dispatch = useDispatch();
  const isMobile = useMobileWelcome();
  const user = useSelector(selectUser);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [featureAccess, setFeatureAccess] = useState({ canSubmit: false, canManageLog: false });

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

  useEffect(() => {
    if (!user?.user_id) return undefined;
    let active = true;
    fetchFeatureAccess()
      .then((access) => {
        if (active) {
          setFeatureAccess({
            canSubmit: Boolean(access?.canSubmit),
            canManageLog: Boolean(access?.canManageLog),
          });
        }
      })
      .catch(() => {
        if (active) setFeatureAccess({ canSubmit: false, canManageLog: false });
      });
    return () => {
      active = false;
    };
  }, [user?.user_id]);

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
  };

  const mapLink = (
    <NavLink to="/" end className={isMobile ? tabClass : linkClass}>
      <MapIcon className={isMobile ? 'h-5 w-5 shrink-0' : 'h-4 w-4 shrink-0'} />
      Map
    </NavLink>
  );

  const notificationsLink = (
    <NavLink to="/notifications" className={isMobile ? tabClass : linkClass}>
      <span className={isMobile ? 'relative' : 'contents'}>
        <BellIcon className={isMobile ? 'h-5 w-5 shrink-0' : 'h-4 w-4 shrink-0'} />
        {isMobile ? (
          <span className="absolute -right-3 -top-1">
            <UnreadBadge count={unreadCount} />
          </span>
        ) : null}
      </span>
      {isMobile ? (
        'Notifications'
      ) : (
        <>
          <span className="flex-1">Notifications</span>
          <UnreadBadge count={unreadCount} />
        </>
      )}
    </NavLink>
  );

  const profileLink = (
    <NavLink to="/profile" className={isMobile ? tabClass : linkClass}>
      <UserAvatar user={user} className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
      Profile
    </NavLink>
  );

  const createButton = (
    <button
      type="button"
      onClick={() => setShowCreate(true)}
      className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs text-muted"
    >
      <PlusIcon className="h-5 w-5 shrink-0" />
      Create
    </button>
  );

  const createDialogs = (
    <>
      {showCreate ? (
        <Modal open title="Create" testId="create-modal" onClose={() => setShowCreate(false)}>
          <div className="flex flex-col gap-2">
            <Link
              to="/pebbles/new"
              onClick={() => setShowCreate(false)}
              className="rounded-2xl bg-accent px-3 py-2 text-center text-sm font-medium text-white hover:bg-accent-hover"
            >
              Pebble
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setShowCollection(true);
              }}
              className="rounded-2xl border border-border px-3 py-2 text-center text-sm text-ink"
            >
              Collection
            </button>
            {featureAccess.canSubmit ? (
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setShowFeatureRequest(true);
                }}
                className="rounded-2xl border border-border px-3 py-2 text-center text-sm text-ink"
              >
                Submit A Feature Request
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}
      {showCollection ? (
        <NewCollectionForm
          onCancel={() => setShowCollection(false)}
          onCreated={() => {
            setShowCollection(false);
            window.dispatchEvent(new Event('pebble-collections-changed'));
          }}
        />
      ) : null}
      {showFeatureRequest ? (
        <FeatureRequestModal
          canManageLog={featureAccess.canManageLog}
          onClose={() => setShowFeatureRequest(false)}
        />
      ) : null}
    </>
  );

  if (isMobile) {
    return (
      <>
        <nav
          data-testid="mobile-tab-bar"
          aria-label="Primary"
          className="shrink-0 border-t border-border bg-surface/95 pb-safe-bottom backdrop-blur-md"
        >
          <div className="grid grid-cols-4">
            {mapLink}
            {notificationsLink}
            {createButton}
            {profileLink}
          </div>
        </nav>
        {createDialogs}
      </>
    );
  }

  return (
    <>
    <aside className="flex h-full min-h-0 w-56 shrink-0 flex-col overflow-y-auto border-r border-border/80 bg-surface/80 px-4 py-6 backdrop-blur-md">
      <BrandMark size="sm" to="/" />
      <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1">
        {mapLink}
        {notificationsLink}
        {profileLink}
        <div className="mt-auto flex flex-col gap-2 pt-6">
          {featureAccess.canSubmit ? (
            <button
              type="button"
              onClick={() => setShowFeatureRequest(true)}
              className="rounded-2xl px-3 py-2 text-left text-sm text-muted hover:bg-background hover:text-ink"
            >
              Submit A Feature Request
            </button>
          ) : null}
          <NavLink to="/how-it-works" className="rounded-2xl px-3 py-2 text-sm text-muted hover:bg-background hover:text-ink">
            Tutorial
          </NavLink>
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
    {showFeatureRequest ? (
      <FeatureRequestModal
        canManageLog={featureAccess.canManageLog}
        onClose={() => setShowFeatureRequest(false)}
      />
    ) : null}
    </>
  );
};

export default Nav;
