import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import DeletePebbleConfirm from '../components/Pebbles/DeletePebbleConfirm';
import FieldNotesViewer from '../components/FieldNotes/FieldNotesViewer';
import FlagDialog from '../components/Moderation/FlagDialog';
import Modal from '../components/Modal/Modal';
import MediaCarousel from '../components/Pebbles/MediaCarousel';
import MediaFrame, { PreviewImage } from '../components/Pebbles/MediaFrame';
import { featuredMedia } from '../helpers/mediaPreview';
import SaveToCollectionsDialog from '../components/Collections/SaveToCollectionsDialog';
import { fieldIconForName } from '../components/Icons/Icons';
import { selectIsAuthenticated, selectUser } from '../store/auth.reducer';
import { deletePebble, fetchPebble, formatObserved, likePebble, pinLabel, unlikePebble } from '../helpers/pebbleHelpers';

const PebbleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [pebble, setPebble] = useState(null);
  const [showFlag, setShowFlag] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [openMedia, setOpenMedia] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const isAuthor = Number(user?.user_id) === Number(pebble.author_id);
  const fieldName = pebble.fields?.[0]?.name || pebble.phenomena?.[0]?.field_name;
  const FieldIcon = fieldIconForName(fieldName);
  const tags = [
    ...(pebble.phenomena || []).map((ph) => ({ key: `ph-${ph.phenomenon_id}`, label: ph.name })),
    ...(pebble.other_tags || []).map((tag) => ({
      key: `tag-${tag.other_tag_id || tag.name}`,
      label: tag.name,
    })),
  ];

  const visualMedia = (pebble.media || []).filter(
    (item) => item.media_type === 'image' || item.media_type === 'video'
  );
  const openIndex = visualMedia.findIndex((item) => item.media_id === openMedia?.media_id);

  return (
    <div className="w-full space-y-4">
      <button
        type="button"
        onClick={() => (location.key === 'default' ? navigate('/') : navigate(-1))}
        className="text-sm text-muted hover:text-ink"
      >
        ← Back
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background text-accent"
              aria-label={fieldName || 'Scientific field'}
            >
              <FieldIcon className="h-4 w-4" />
            </span>
            <h1 className="min-w-0 break-words font-display text-2xl font-semibold text-ink">{pebble.title}</h1>
          </div>
          <p className="mt-2 text-sm text-muted">
            by{' '}
            <Link to={`/u/${pebble.author_username}`} className="text-accent hover:underline">
              {pebble.author_display_name || pebble.author_username}
            </Link>
          </p>
          {pinLabel(pebble) ? <p className="text-sm text-muted">{pinLabel(pebble)}</p> : null}
          {formatObserved(pebble) ? (
            <p className="text-sm text-muted">{formatObserved(pebble)}</p>
          ) : null}
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
                Add to collection
              </button>
            </>
          ) : null}
          {isAuthor ? (
            <>
              <Link
                to={`/pebbles/${pebble.pebble_id}/edit`}
                className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
              >
                Edit pebble
              </Link>
              <button
                type="button"
                aria-label="Delete pebble"
                onClick={() => setConfirmDelete(true)}
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
        <div className="max-h-96 overflow-hidden rounded-2xl border border-border">
          <PreviewImage item={featuredMedia(pebble)} className="max-h-96 w-full" />
        </div>
      ) : null}
      {pebble.description ? <p className="text-sm text-ink">{pebble.description}</p> : null}
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag.key} className="rounded-xl bg-accent px-2 py-0.5 text-xs text-white">
              {tag.label}
            </span>
          ))}
        </div>
      ) : null}
      {pebble.media?.length ? (
        <div className="grid w-full min-w-0 grid-cols-5 gap-2" data-testid="pebble-media-gallery">
          {pebble.media.map((item) => {
            const name = item.filename || item.media_type;
            const visual = item.media_type === 'image' || item.media_type === 'video';
            return (
              <div
                key={item.media_id}
                className="aspect-square min-w-0 overflow-hidden rounded-2xl border border-border bg-surface"
              >
                {visual ? (
                  <button
                    type="button"
                    aria-label={name}
                    className="block h-full w-full min-w-0"
                    onClick={() => setOpenMedia(item)}
                  >
                    <MediaFrame item={item} decorative />
                  </button>
                ) : item.media_type === 'audio' ? (
                  <div className="flex h-full min-w-0 items-center p-2">
                    <audio src={item.media_url} controls className="w-full min-w-0" />
                  </div>
                ) : (
                  <a
                    href={item.media_url}
                    className="flex h-full min-w-0 items-center p-2 text-xs text-accent hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {name}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
      {openMedia && visualMedia.length ? (
        <Modal
          onClose={() => setOpenMedia(null)}
          title="Media"
          testId="pebble-media-viewer"
        >
          <MediaCarousel
            items={visualMedia}
            index={openIndex < 0 ? 0 : openIndex}
            onIndexChange={(next) => setOpenMedia(visualMedia[next])}
            showText
            controls
          />
        </Modal>
      ) : null}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">Field notes</h2>
        <FieldNotesViewer value={pebble.field_notes} />
      </div>
      {pebble.resources?.length ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted">Further reading</h2>
          <ul className="space-y-1">
            {pebble.resources.map((item) => (
              <li key={item.resource_id || item.url}>
                <a href={item.url} className="text-sm text-accent hover:underline" target="_blank" rel="noreferrer">
                  {item.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {pebble.questions?.length ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted">Questions to consider</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            {pebble.questions.map((item) => (
              <li key={item.question_id || item.prompt}>{item.prompt}</li>
            ))}
          </ul>
        </div>
      ) : null}
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
      <DeletePebbleConfirm
        pebble={confirmDelete ? pebble : null}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await deletePebble(pebble.pebble_id);
            toast.success('Pebble deleted');
            navigate('/profile');
          } catch (err) {
            toast.error(err.message || 'Could not delete pebble');
          }
        }}
      />
    </div>
  );
};

export default PebbleDetail;
