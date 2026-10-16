import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import DeleteCollectionConfirm from '../components/Collections/DeleteCollectionConfirm';
import { selectUser } from '../store/auth.reducer';
import {
  acceptCollectionInvite,
  addPebbleToCollection,
  deleteCollection,
  fetchCollection,
  inviteToCollection,
  removePebbleFromCollection,
} from '../helpers/collectionHelpers';
import { fetchUserProfile } from '../helpers/userHelpers';

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [collection, setCollection] = useState(null);
  const [inviteUserId, setInviteUserId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adding, setAdding] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async () => {
    try {
      setCollection(await fetchCollection(id));
    } catch (err) {
      toast.error(err.message || 'Collection not found');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!collection) return <p className="text-sm text-muted">Loading…</p>;

  const isOwner = Number(user?.user_id) === Number(collection.owner_id);
  const pendingInvite = collection.members?.some(
    (m) => m.user_id === user?.user_id && m.status === 'invited'
  );

  return (
    <div className="space-y-5">
      <div>
        <Link to="/profile" className="text-sm text-muted hover:text-ink">
          Back
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{collection.name}</h1>
        <p className="text-sm text-muted">
          {collection.is_private ? 'Private' : 'Public'}
          {collection.is_collaborative ? ' · Collaborate' : ''}
        </p>
        {isOwner ? (
          <button
            type="button"
            aria-label="Delete collection"
            onClick={() => setConfirmDelete(true)}
            className="mt-3 text-sm text-muted hover:text-ink"
          >
            Delete
          </button>
        ) : null}
      </div>
      {isOwner ? (
        <div className="space-y-3">
          <button
            type="button"
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
            onClick={async () => {
              if (adding) {
                setAdding(false);
                setSelectedIds([]);
                return;
              }
              try {
                const data = await fetchUserProfile(user.username);
                const memberIds = new Set((collection.pebbles || []).map((pebble) => Number(pebble.pebble_id)));
                setCandidates(
                  (data.pebbles || []).filter(
                    (pebble) => pebble.status !== 'draft' && !memberIds.has(Number(pebble.pebble_id))
                  )
                );
                setSelectedIds([]);
                setAdding(true);
              } catch (err) {
                toast.error(err.message || 'Could not load pebbles');
              }
            }}
          >
            {adding ? 'Cancel' : 'Add pebbles'}
          </button>
          {adding ? (
            <div className="space-y-2" data-testid="collection-add-list">
              {candidates.length === 0 ? (
                <p className="text-sm text-muted">No pebbles to add.</p>
              ) : (
                candidates.map((pebble) => (
                  <button
                    key={pebble.pebble_id}
                    type="button"
                    aria-pressed={selectedIds.includes(pebble.pebble_id)}
                    onClick={() =>
                      setSelectedIds((prev) =>
                        prev.includes(pebble.pebble_id)
                          ? prev.filter((id) => id !== pebble.pebble_id)
                          : [...prev, pebble.pebble_id]
                      )
                    }
                    className={`w-full rounded-2xl border border-border px-3 py-2 text-left text-sm text-ink ${
                      selectedIds.includes(pebble.pebble_id) ? 'ring-2 ring-accent' : ''
                    }`}
                  >
                    {pebble.title}
                  </button>
                ))
              )}
              {selectedIds.length ? (
                <button
                  type="button"
                  className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white"
                  onClick={async () => {
                    try {
                      let next = collection;
                      for (const pebbleId of selectedIds) {
                        next = await addPebbleToCollection(id, pebbleId);
                      }
                      setCollection(next);
                      setAdding(false);
                      setSelectedIds([]);
                      toast.success('Pebbles added');
                    } catch (err) {
                      toast.error(err.message || 'Could not add pebbles');
                    }
                  }}
                >
                  Save
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {pendingInvite ? (
        <button
          type="button"
          onClick={async () => {
            try {
              setCollection(await acceptCollectionInvite(id));
              toast.success('Invite accepted');
            } catch (err) {
              toast.error(err.message);
            }
          }}
          className="rounded-2xl bg-accent px-3 py-2 text-sm text-white"
        >
          Accept invite
        </button>
      ) : null}
      {isOwner && collection.is_collaborative ? (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await inviteToCollection(id, Number(inviteUserId));
              toast.success('Invite sent');
              setInviteUserId('');
              load();
            } catch (err) {
              toast.error(err.message);
            }
          }}
        >
          <input
            required
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
            placeholder="User id to invite"
            className="min-w-0 w-full rounded-2xl border border-border px-3 py-2 text-base text-ink outline-none focus:border-accent"
          />
          <button type="submit" className="rounded-2xl border border-border px-3 py-2 text-sm">
            Invite
          </button>
        </form>
      ) : null}
      <div className="space-y-3">
        {(collection.pebbles || []).map((p) => (
          <div
            key={p.pebble_id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <Link to={`/pebbles/${p.pebble_id}`} className="min-w-0 flex-1 break-words text-ink hover:text-accent">
              {p.title}
            </Link>
            {isOwner ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setCollection(await removePebbleFromCollection(id, p.pebble_id));
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
                className="shrink-0 text-xs text-muted hover:text-ink"
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <DeleteCollectionConfirm
        collection={confirmDelete ? collection : null}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await deleteCollection(id);
            toast.success('Collection deleted');
            navigate('/profile');
          } catch (err) {
            toast.error(err.message || 'Could not delete collection');
          }
        }}
      />
    </div>
  );
};

export default CollectionDetail;
