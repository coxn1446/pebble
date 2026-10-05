import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import DeleteCollectionConfirm from '../components/Collections/DeleteCollectionConfirm';
import { selectUser } from '../store/auth.reducer';
import {
  acceptCollectionInvite,
  deleteCollection,
  fetchCollection,
  inviteToCollection,
  removePebbleFromCollection,
} from '../helpers/collectionHelpers';

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [collection, setCollection] = useState(null);
  const [inviteUserId, setInviteUserId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        <h1 className="font-display text-2xl font-semibold text-ink">{collection.name}</h1>
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
          className="flex gap-2"
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
            className="w-full rounded-2xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
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
            <Link to={`/pebbles/${p.pebble_id}`} className="text-ink hover:text-accent">
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
                className="text-xs text-muted hover:text-ink"
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
