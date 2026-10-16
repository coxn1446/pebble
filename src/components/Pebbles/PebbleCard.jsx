import React from 'react';
import { useNavigate } from 'react-router-dom';
import { fieldIconForName, SketchGlobeIcon } from '../Icons/Icons';
import { featuredMedia } from '../../helpers/mediaPreview';
import { formatObserved, pinLabel } from '../../helpers/pebbleHelpers';
import { PreviewImage } from './MediaFrame';
import { rememberScreen } from '../../helpers/screenReturn';

const primaryFieldName = (pebble) => {
  const names = (pebble?.phenomena || []).map((ph) => ph.field_name).filter(Boolean);
  if (!names.length) return null;
  const counts = names.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const PebbleCard = ({ pebble, illustration = false }) => {
  const navigate = useNavigate();
  const hasHero = Boolean(pebble.hero_image_url);
  const fieldName = primaryFieldName(pebble);
  const FieldIcon = fieldIconForName(fieldName);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => {
        rememberScreen();
        navigate(`/pebbles/${pebble.pebble_id}`);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          rememberScreen();
          navigate(`/pebbles/${pebble.pebble_id}`);
        }
      }}
      className={`cursor-pointer overflow-hidden border-b border-border p-3 animate-fade-up transition hover:bg-surface/80 max-h-36 ${
        hasHero ? 'h-36' : ''
      }`}
    >
      <div className="flex h-full items-stretch gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background text-accent"
              title={illustration ? 'Pebble' : fieldName || 'Field'}
              aria-label={illustration ? 'Pebble' : fieldName || 'Scientific field'}
            >
              {illustration ? (
                <SketchGlobeIcon className="h-6 w-6" />
              ) : (
                <FieldIcon className="h-4 w-4" />
              )}
            </span>
            <h2 className="min-w-0 truncate font-display text-lg font-semibold text-ink">
              {pebble.title}
            </h2>
          </div>
          {pinLabel(pebble) || formatObserved(pebble) ? (
            <p className="mt-1 truncate text-xs text-muted">
              {[pinLabel(pebble), formatObserved(pebble)].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {pebble.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-ink">{pebble.description}</p>
          ) : null}
          {pebble.phenomena?.length || pebble.other_tags?.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5 overflow-hidden">
              {(pebble.phenomena || []).map((ph) => (
                <span
                  key={ph.phenomenon_id}
                  className="rounded-xl bg-background px-2 py-0.5 text-xs text-muted"
                >
                  {ph.name}
                </span>
              ))}
              {(pebble.other_tags || []).map((tag) => (
                <span
                  key={tag.other_tag_id || tag.name}
                  className="rounded-xl bg-background px-2 py-0.5 text-xs text-muted"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {hasHero ? (
          <div
            data-testid="pebble-hero-thumb"
            className="aspect-square h-full shrink-0 overflow-hidden rounded-2xl border border-border"
          >
            <PreviewImage item={featuredMedia(pebble)} className="h-full w-full" />
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default PebbleCard;
