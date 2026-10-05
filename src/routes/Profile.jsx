import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import DeletePebbleConfirm from '../components/Pebbles/DeletePebbleConfirm';
import PebbleCard from '../components/Pebbles/PebbleCard';
import FlagDialog from '../components/Moderation/FlagDialog';
import DeleteCollectionConfirm from '../components/Collections/DeleteCollectionConfirm';
import NewCollectionForm from '../components/Collections/NewCollectionForm';
import UserAvatar from '../components/Profile/UserAvatar';
import UserListModal from '../components/Profile/UserListModal';
import { fieldIconForName } from '../components/Icons/Icons';
import { selectUser } from '../store/auth.reducer';
import { fetchUserProfile } from '../helpers/userHelpers';
import {
  addPebbleToCollection,
  deleteCollection,
  fetchCollections,
} from '../helpers/collectionHelpers';
import { deletePebble } from '../helpers/pebbleHelpers';
import { blockUser, followUser, unfollowUser } from '../helpers/socialHelpers';

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

const GalleryTile = ({ imageUrl, title, fieldName }) => {
  const FieldIcon = fieldName ? fieldIconForName(fieldName) : null;
  return (
    <div className={tileClass}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
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

const ProfileTiles = ({
  view,
  collections,
  pebbles,
  addingTo,
  selectedIds,
  viewerId,
  onAdd,
  onDelete,
  onDeletePebble,
  canDeletePebbles = false,
  onTogglePebble,
}) => {
  const collected = new Set(
    collections.flatMap((collection) => (collection.pebble_ids || []).map((id) => Number(id)))
  );
  const published = [...pebbles].sort(byObserved);
  const loose = addingTo ? published : published.filter((pebble) => !collected.has(Number(pebble.pebble_id)));

  if (view === 'rows') {
    return (
      <div className="space-y-3" data-testid="profile-rows">
        {collections.map((collection) => (
          <div key={collection.collection_id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2">
            <Link to={`/collections/${collection.collection_id}`} className="font-medium text-ink">
              {collection.name}
            </Link>
            <div className="flex shrink-0 gap-3">
              <button type="button" className="text-sm text-accent" onClick={() => onAdd(collection.collection_id)}>
                Add
              </button>
              {Number(collection.owner_id) === Number(viewerId) ? (
                <button
                  type="button"
                  className="text-sm text-muted hover:text-ink"
                  aria-label={`Delete ${collection.name}`}
                  onClick={() => onDelete(collection)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {loose.map((pebble) =>
          addingTo ? (
            <button
              key={pebble.pebble_id}
              type="button"
              aria-pressed={selectedIds.includes(pebble.pebble_id)}
              onClick={() => onTogglePebble(pebble.pebble_id)}
              className={`w-full rounded-2xl border border-border px-3 py-2 text-left text-sm text-ink ${
                selectedIds.includes(pebble.pebble_id) ? 'ring-2 ring-accent' : ''
              }`}
            >
              {pebble.title}
            </button>
          ) : (
            <div key={pebble.pebble_id} className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <PebbleCard pebble={pebble} />
              </div>
              {canDeletePebbles ? (
                <button
                  type="button"
                  className="shrink-0 text-sm text-muted hover:text-ink"
                  aria-label={`Delete ${pebble.title || 'Untitled'}`}
                  onClick={() => onDeletePebble(pebble)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="profile-gallery">
      {collections.map((collection) => (
        <div key={collection.collection_id} className="space-y-2">
          <Link to={`/collections/${collection.collection_id}`} aria-label={collection.name}>
            <GalleryTile imageUrl={collection.cover_image_url} title={collection.name} />
          </Link>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="text-sm text-accent"
              onClick={() => onAdd(collection.collection_id)}
            >
              Add
            </button>
            {Number(collection.owner_id) === Number(viewerId) ? (
              <button
                type="button"
                className="text-sm text-muted hover:text-ink"
                aria-label={`Delete ${collection.name}`}
                onClick={() => onDelete(collection)}
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {loose.map((pebble) => {
        const fieldName = pebble.fields?.[0]?.name || pebble.phenomena?.[0]?.field_name;
        const tile = (
          <GalleryTile imageUrl={pebble.hero_image_url} title={pebble.title} fieldName={fieldName} />
        );
        if (addingTo) {
          return (
            <button
              key={pebble.pebble_id}
              type="button"
              aria-pressed={selectedIds.includes(pebble.pebble_id)}
              onClick={() => onTogglePebble(pebble.pebble_id)}
              className={selectedIds.includes(pebble.pebble_id) ? 'rounded-2xl ring-2 ring-accent' : ''}
            >
              {tile}
            </button>
          );
        }
        return (
          <div key={pebble.pebble_id} className="space-y-2">
            <Link to={`/pebbles/${pebble.pebble_id}`} aria-label={pebble.title}>
              {tile}
            </Link>
            {canDeletePebbles ? (
              <button
                type="button"
                className="text-sm text-muted hover:text-ink"
                aria-label={`Delete ${pebble.title || 'Untitled'}`}
                onClick={() => onDeletePebble(pebble)}
              >
                Delete
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const Profile = () => {
  const { username: paramUsername } = useParams();
  const me = useSelector(selectUser);
  const username = paramUsername || me?.username;
  const [profile, setProfile] = useState(null);
  const [pebbles, setPebbles] = useState([]);
  const [showFlag, setShowFlag] = useState(false);
  const [listMode, setListMode] = useState(null);
  const [view, setView] = useState('gallery');
  const [collections, setCollections] = useState([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingPebble, setPendingPebble] = useState(null);

  const load = async () => {
    if (!username) return;
    try {
      const data = await fetchUserProfile(username);
      setProfile(data.user);
      setPebbles(data.pebbles || []);
      const viewingSelf = Boolean(me) && (!paramUsername || paramUsername === me.username);
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
      toast.error(err.message || 'Profile not found');
    }
  };

  useEffect(() => {
    setProfile(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (!username) return <p className="text-sm text-muted">Loading…</p>;
  if (!profile) return <p className="text-sm text-muted">Loading…</p>;

  const isSelf = Number(me?.user_id) === Number(profile.user_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <UserAvatar
            user={profile}
            className="h-16 w-16 rounded-full"
          />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-muted">@{profile.username}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink">
              <button
                type="button"
                onClick={() => setListMode('followers')}
                className="hover:underline"
              >
                <span className="font-semibold">{profile.follower_count ?? 0}</span>{' '}
                <span className="text-muted">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => setListMode('following')}
                className="hover:underline"
              >
                <span className="font-semibold">{profile.following_count ?? 0}</span>{' '}
                <span className="text-muted">Following</span>
              </button>
            </div>
            {profile.blurb?.trim() ? (
              <p className="mt-2 text-sm text-ink" data-testid="profile-blurb">
                {profile.blurb.trim()}
              </p>
            ) : null}
            {profile.profession ? <p className="mt-2 text-sm text-ink">{profile.profession}</p> : null}
            {profile.field_of_study ? (
              <p className="text-sm text-muted">{profile.field_of_study}</p>
            ) : null}
            {profile.place_name ? <p className="text-sm text-muted">{profile.place_name}</p> : null}
            {profile.employer ? (
              <p className="text-sm text-muted">Employer: {profile.employer.name}</p>
            ) : null}
          </div>
        </div>
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
      </div>
      {isSelf ? (
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
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            New collection
          </button>
          <Link
            to="/?mine=1"
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Map
          </Link>
          <Link
            to="/settings"
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Edit profile
          </Link>
        </div>
      ) : null}
      {isSelf && pebbles.some((pebble) => pebble.status === 'draft') ? (
        <div className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-ink">Drafts</h2>
          <ul className="space-y-2">
            {pebbles
              .filter((pebble) => pebble.status === 'draft')
              .map((pebble) => (
                <li key={pebble.pebble_id} className="flex items-center gap-3">
                  <Link
                    to={`/pebbles/${pebble.pebble_id}/edit`}
                    className="block min-w-0 flex-1 rounded-2xl border border-border px-3 py-2 text-sm text-ink hover:border-accent"
                  >
                    {pebble.title || 'Untitled'}
                  </Link>
                  <button
                    type="button"
                    className="shrink-0 text-sm text-muted hover:text-ink"
                    aria-label={`Delete ${pebble.title || 'Untitled'}`}
                    onClick={() => setPendingPebble(pebble)}
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-2xl border border-border p-0.5" role="group" aria-label="Profile layout">
          <button
            type="button"
            aria-pressed={view === 'gallery'}
            onClick={() => setView('gallery')}
            className={`rounded-2xl px-3 py-1.5 text-sm ${view === 'gallery' ? 'bg-accent text-white' : 'text-ink'}`}
          >
            Gallery
          </button>
          <button
            type="button"
            aria-pressed={view === 'rows'}
            onClick={() => setView('rows')}
            className={`rounded-2xl px-3 py-1.5 text-sm ${view === 'rows' ? 'bg-accent text-white' : 'text-ink'}`}
          >
            Rows
          </button>
        </div>
        {addingTo ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white"
              onClick={async () => {
                try {
                  for (const pebbleId of selectedIds) {
                    await addPebbleToCollection(addingTo, pebbleId);
                  }
                  toast.success('Pebbles added');
                  setAddingTo(null);
                  setSelectedIds([]);
                  setCollections(await fetchCollections());
                } catch (err) {
                  toast.error(err.message);
                }
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
              onClick={() => {
                setAddingTo(null);
                setSelectedIds([]);
              }}
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
      <ProfileTiles
        view={view}
        collections={isSelf ? collections : []}
        pebbles={pebbles.filter((pebble) => pebble.status !== 'draft')}
        addingTo={addingTo}
        selectedIds={selectedIds}
        viewerId={me?.user_id}
        canDeletePebbles={isSelf}
        onDeletePebble={setPendingPebble}
        onAdd={(collectionId) => {
          setAddingTo(collectionId);
          setSelectedIds([]);
        }}
        onDelete={setPendingDelete}
        onTogglePebble={(pebbleId) => {
          setSelectedIds((prev) =>
            prev.includes(pebbleId) ? prev.filter((id) => id !== pebbleId) : [...prev, pebbleId]
          );
        }}
      />
      {showFlag ? (
        <FlagDialog
          targetType="user"
          targetId={profile.user_id}
          onClose={() => setShowFlag(false)}
        />
      ) : null}
      <DeleteCollectionConfirm
        collection={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteCollection(pendingDelete.collection_id);
            if (addingTo === pendingDelete.collection_id) {
              setAddingTo(null);
              setSelectedIds([]);
            }
            setPendingDelete(null);
            setCollections(await fetchCollections());
            toast.success('Collection deleted');
          } catch (err) {
            toast.error(err.message || 'Could not delete collection');
          }
        }}
      />
      <DeletePebbleConfirm
        pebble={pendingPebble}
        onCancel={() => setPendingPebble(null)}
        onConfirm={async () => {
          if (!pendingPebble) return;
          try {
            await deletePebble(pendingPebble.pebble_id);
            setPendingPebble(null);
            setPebbles((prev) => prev.filter((item) => item.pebble_id !== pendingPebble.pebble_id));
            toast.success('Pebble deleted');
          } catch (err) {
            toast.error(err.message || 'Could not delete pebble');
          }
        }}
      />
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
