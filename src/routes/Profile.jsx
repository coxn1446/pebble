import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import FlagDialog from '../components/Moderation/FlagDialog';
import Modal from '../components/Modal/Modal';
import NewCollectionForm from '../components/Collections/NewCollectionForm';
import UserAvatar from '../components/Profile/UserAvatar';
import UserListModal from '../components/Profile/UserListModal';
import { GearIcon, fieldIconForName } from '../components/Icons/Icons';
import { PreviewImage } from '../components/Pebbles/MediaFrame';
import { featuredMedia } from '../helpers/mediaPreview';
import { useMobileWelcome } from '../components/Welcome/WelcomeShared';
import { selectUser, clearUser } from '../store/auth.reducer';
import { logout } from '../helpers/authHelpers';
import { fetchMyProfile, fetchUserProfile } from '../helpers/userHelpers';
import { fetchCollections } from '../helpers/collectionHelpers';
import { blockUser, followUser, unfollowUser } from '../helpers/socialHelpers';
import Settings from './Settings';

const actionClass = 'rounded-2xl border border-border px-3 py-1.5 text-sm text-ink';

const DraftList = ({ drafts }) =>
  drafts.length ? (
    <ul className="space-y-2">
      {drafts.map((pebble) => (
        <li key={pebble.pebble_id}>
          <Link
            to={`/pebbles/${pebble.pebble_id}/edit`}
            className="block min-w-0 rounded-2xl border border-border px-3 py-2 text-sm text-ink hover:border-accent"
          >
            {pebble.title || 'Untitled'}
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted">No drafts.</p>
  );

const observationStamp = (pebble) => {
  if (pebble?.observed_at) {
    const parsed = Date.parse(pebble.observed_at);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (pebble?.observed_on) {
    const parsed = Date.parse(`${String(pebble.observed_on).slice(0, 10)}T00:00:00Z`);
    if (Number.isFinite(parsed)) return parsed;
  }
  return NaN;
};

const byObserved = (a, b) => {
  const ta = observationStamp(a);
  const tb = observationStamp(b);
  const aOk = Number.isFinite(ta);
  const bOk = Number.isFinite(tb);
  if (aOk && bOk && ta !== tb) return tb - ta;
  if (aOk && !bOk) return -1;
  if (!aOk && bOk) return 1;
  return 0;
};

const tileClass =
  'relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border bg-background';

const GalleryTile = ({ imageUrl, media, title, fieldName }) => {
  const FieldIcon = fieldName ? fieldIconForName(fieldName) : null;
  const image = imageUrl ? featuredMedia({ hero_image_url: imageUrl, media }) : null;
  return (
    <div className={tileClass}>
      {image ? (
        <PreviewImage item={image} className="absolute inset-0 h-full w-full" />
      ) : FieldIcon ? (
        <FieldIcon className="h-8 w-8 text-accent" aria-hidden="true" />
      ) : null}
      <span
        className={`absolute inset-0 flex items-center justify-center px-3 text-center font-display text-lg font-semibold ${
          imageUrl ? 'text-white drop-shadow' : 'text-ink'
        }`}
      >
        {title}
      </span>
    </div>
  );
};

const ProfileTiles = ({ collections, pebbles }) => {
  const collected = new Set(
    collections.flatMap((collection) => (collection.pebble_ids || []).map((id) => Number(id)))
  );
  const published = [...pebbles].sort(byObserved);
  const loose = published.filter((pebble) => !collected.has(Number(pebble.pebble_id)));

  return (
    <div className="space-y-6" data-testid="profile-gallery">
      {collections.length ? (
        <div className="grid grid-cols-3 gap-1" data-testid="profile-collections">
          {collections.map((collection) => (
            <Link
              key={collection.collection_id}
              to={`/collections/${collection.collection_id}`}
              aria-label={collection.name}
            >
              <GalleryTile imageUrl={collection.cover_image_url} title={collection.name} />
            </Link>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-1" data-testid="profile-pebble-grid">
        {loose.map((pebble) => {
          const fieldName = pebble.fields?.[0]?.name || pebble.phenomena?.[0]?.field_name;
          return (
            <Link key={pebble.pebble_id} to={`/pebbles/${pebble.pebble_id}`} aria-label={pebble.title}>
              <GalleryTile
                imageUrl={pebble.hero_image_url}
                media={pebble.media}
                title={pebble.title}
                fieldName={fieldName}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const Profile = () => {
  const dispatch = useDispatch();
  const isMobile = useMobileWelcome();
  const { username: paramUsername } = useParams();
  const me = useSelector(selectUser);
  const username = paramUsername || me?.username;
  const [profile, setProfile] = useState(null);
  const [pebbles, setPebbles] = useState([]);
  const [showFlag, setShowFlag] = useState(false);
  const [listMode, setListMode] = useState(null);
  const [collections, setCollections] = useState([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const load = async () => {
    const viewingSelf = Boolean(me?.user_id) && (!paramUsername || paramUsername === me.username);
    if (!username && !viewingSelf) return;
    setProfileError(null);
    try {
      const data = username ? await fetchUserProfile(username) : await fetchMyProfile();
      setProfile(data.user);
      setPebbles(data.pebbles || []);
      if (!viewingSelf) {
        setCollections([]);
      } else {
        try {
          setCollections(await fetchCollections());
        } catch (err) {
          setCollections([]);
          toast.error(err.message || 'Could not load collections');
        }
      }
    } catch (err) {
      setProfile(null);
      setProfileError(err.message || 'Profile not found');
      toast.error(err.message || 'Profile not found');
    }
  };

  useEffect(() => {
    setProfile(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, me?.user_id]);

  useEffect(() => {
    const refresh = () => {
      const viewingSelf = Boolean(me?.user_id) && (!paramUsername || paramUsername === me.username);
      if (!viewingSelf) return;
      fetchCollections()
        .then(setCollections)
        .catch(() => {});
    };
    window.addEventListener('pebble-collections-changed', refresh);
    return () => window.removeEventListener('pebble-collections-changed', refresh);
  }, [me?.user_id, me?.username, paramUsername]);

  if (!username && !me?.user_id) return <p className="text-sm text-muted">Loading…</p>;
  if (profileError) return <p className="text-sm text-muted">{profileError}</p>;
  if (!profile) return <p className="text-sm text-muted">Loading…</p>;

  const isSelf = Number(me?.user_id) === Number(profile.user_id);
  const publishedCount = pebbles.filter((pebble) => pebble.status !== 'draft').length;
  const drafts = pebbles.filter((pebble) => pebble.status === 'draft');

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar user={profile} className="h-16 w-16 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-semibold text-ink">
            {profile.display_name || profile.username}
          </h1>
          {profile.username ? <p className="text-sm text-muted">@{profile.username}</p> : null}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink">
            <p>
              <span className="font-semibold">{publishedCount}</span>{' '}
              <span className="text-muted">Pebbles</span>
            </p>
            <button type="button" onClick={() => setListMode('followers')} className="hover:underline">
              <span className="font-semibold">{profile.follower_count ?? 0}</span>{' '}
              <span className="text-muted">Followers</span>
            </button>
            <button type="button" onClick={() => setListMode('following')} className="hover:underline">
              <span className="font-semibold">{profile.following_count ?? 0}</span>{' '}
              <span className="text-muted">Following</span>
            </button>
          </div>
        </div>
        {isSelf && isMobile ? (
          <button
            type="button"
            aria-label="Profile menu"
            onClick={() => setShowMenu(true)}
            className="shrink-0 rounded-2xl border border-border p-2 text-ink"
          >
            <GearIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      {profile.blurb?.trim() ? (
        <p className="text-sm text-ink" data-testid="profile-blurb">
          {profile.blurb.trim()}
        </p>
      ) : null}
      {profile.profession ? <p className="text-sm text-ink">{profile.profession}</p> : null}
      {profile.field_of_study ? <p className="text-sm text-muted">{profile.field_of_study}</p> : null}
      {profile.place_name ? <p className="text-sm text-muted">{profile.place_name}</p> : null}
      {profile.employer ? (
        <p className="text-sm text-muted">Employer: {profile.employer.name}</p>
      ) : null}
      {showMenu ? (
        <Modal open title="Profile menu" testId="profile-menu" onClose={() => setShowMenu(false)}>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowEdit(true);
              }}
              className={actionClass}
            >
              Edit profile
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowDrafts(true);
              }}
              className={actionClass}
            >
              Drafts
            </button>
            <button type="button" onClick={handleLogout} className={actionClass}>
              Sign out
            </button>
          </div>
        </Modal>
      ) : null}
      {isSelf && !isMobile ? (
        <div className="flex flex-wrap gap-2">
          <Link
            to="/pebbles/new"
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            New pebble
          </Link>
          <button
            type="button"
            onClick={() => setShowNewCollection((open) => !open)}
            className={actionClass}
          >
            New collection
          </button>
          <Link to="/?mine=1" className={actionClass}>
            Map
          </Link>
          <Link to="/settings" className={actionClass}>
            Edit profile
          </Link>
        </div>
      ) : null}
      {!isSelf ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                if (profile.is_following) {
                  await unfollowUser(profile.user_id);
                } else {
                  await followUser(profile.user_id);
                }
                load();
              } catch (err) {
                toast.error(err.message);
              }
            }}
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover"
          >
            {profile.is_following ? 'Unfollow' : 'Follow'}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await blockUser(profile.user_id);
                toast.success('User blocked');
              } catch (err) {
                toast.error(err.message);
              }
            }}
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Block
          </button>
          <button
            type="button"
            onClick={() => setShowFlag(true)}
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Report
          </button>
        </div>
      ) : null}
      {isSelf && !isMobile && drafts.length ? (
        <div className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-ink">Drafts</h2>
          <DraftList drafts={drafts} />
        </div>
      ) : null}
      {isSelf && showNewCollection ? (
        <NewCollectionForm
          onCancel={() => setShowNewCollection(false)}
          onCreated={async () => {
            setShowNewCollection(false);
            setCollections(await fetchCollections());
          }}
        />
      ) : null}
      <ProfileTiles
        collections={isSelf ? collections : []}
        pebbles={pebbles.filter((pebble) => pebble.status !== 'draft')}
      />
      {showFlag ? (
        <FlagDialog
          targetType="user"
          targetId={profile.user_id}
          onClose={() => setShowFlag(false)}
        />
      ) : null}
      {showEdit ? (
          <Settings
            onBack={() => setShowEdit(false)}
            onSaved={() => {
              setShowEdit(false);
              load();
            }}
          />
      ) : null}
      {showDrafts ? (
        <Modal open title="Drafts" testId="drafts-modal" onClose={() => setShowDrafts(false)}>
          <DraftList drafts={drafts} />
        </Modal>
      ) : null}
      {listMode ? (
        <UserListModal
          username={profile.username}
          mode={listMode}
          onClose={() => setListMode(null)}
        />
      ) : null}
    </div>
  );
};

export default Profile;
