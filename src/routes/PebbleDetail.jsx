import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import FieldNotesViewer from '../components/FieldNotes/FieldNotesViewer';
import FlagDialog from '../components/Moderation/FlagDialog';
import SaveToCollectionsDialog from '../components/Collections/SaveToCollectionsDialog';
import { selectIsAuthenticated, selectUser } from '../store/auth.reducer';
import { deletePebble, fetchPebble, likePebble, unlikePebble } from '../helpers/pebbleHelpers';

const PebbleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [pebble, setPebble] = useState(null);
  const [showFlag, setShowFlag] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPebble(id)
      .then((data) => {
        if (active) setPebble(data);
      })
      .catch((err) => toast.error(err.message || 'Pebble not found'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!pebble) return <p className="text-sm text-muted">Pebble not found.</p>;

  const isAuthor = user?.user_id === pebble.author_id;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{pebble.title}</h1>
          <p className="text-sm text-muted">
            by{' '}
            <Link to={`/u/${pebble.author_username}`} className="text-accent hover:underline">
              {pebble.author_display_name || pebble.author_username}
            </Link>
            {pebble.place_name ? ` · ${pebble.place_name}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const next = pebble.liked_by_me
                      ? await unlikePebble(pebble.pebble_id)
                      : await likePebble(pebble.pebble_id);
                    setPebble(next);
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
                className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
              >
                {pebble.liked_by_me ? 'Liked' : 'Like'} · {pebble.like_count || 0}
              </button>
              <button
                type="button"
                onClick={() => setShowSave(true)}
                className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
              >
                Save
              </button>
            </>
          ) : null}
          {isAuthor ? (
            <>
              <Link
                to={`/pebbles/${pebble.pebble_id}/edit`}
                className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deletePebble(pebble.pebble_id);
                    toast.success('Deleted');
                    navigate('/');
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
                className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
              >
                Delete
              </button>
            </>
          ) : isAuthenticated ? (
            <button
              type="button"
              onClick={() => setShowFlag(true)}
              className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
            >
              Report
            </button>
          ) : null}
        </div>
      </div>
      {pebble.hero_image_url ? (
        <img
          src={pebble.hero_image_url}
          alt=""
          className="max-h-96 w-full rounded-2xl border border-border object-cover"
        />
      ) : null}
      {pebble.description ? <p className="text-sm text-ink">{pebble.description}</p> : null}
      {pebble.phenomena?.length ? (
        <div className="flex flex-wrap gap-2">
          {pebble.phenomena.map((ph) => (
            <span key={ph.phenomenon_id} className="rounded-xl bg-background px-2 py-0.5 text-xs text-muted">
              {ph.field_name}: {ph.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">Field notes</h2>
        <FieldNotesViewer value={pebble.field_notes} />
      </div>
      {showFlag ? (
        <FlagDialog
          targetType="pebble"
          targetId={pebble.pebble_id}
          onClose={() => setShowFlag(false)}
        />
      ) : null}
      {showSave ? (
        <SaveToCollectionsDialog
          pebbleId={pebble.pebble_id}
          onClose={() => setShowSave(false)}
        />
      ) : null}
    </div>
  );
};

export default PebbleDetail;
