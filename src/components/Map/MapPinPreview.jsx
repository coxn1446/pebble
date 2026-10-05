import React from 'react';
import { Link } from 'react-router-dom';

const MapPinPreview = ({ pebble, onClose }) => {
  if (!pebble) return null;
  const tags = [
    ...(pebble.phenomena || []).map((tag) => ({
      key: tag.phenomenon_id || tag.name,
      name: tag.name,
    })),
    ...(pebble.other_tags || []).map((tag) => ({
      key: `tag-${tag.other_tag_id || tag.name}`,
      name: tag.name,
    })),
  ];

  return (
    <div
      data-testid="map-pin-preview"
      className="absolute bottom-4 left-4 right-4 z-10 flex gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm animate-fade-up"
    >
      {pebble.hero_image_url ? (
        <img
          src={pebble.hero_image_url}
          alt=""
          data-testid="map-pin-preview-photo"
          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/pebbles/${pebble.pebble_id}`}
            className="truncate font-display text-lg font-semibold text-ink hover:text-accent"
          >
            {pebble.title}
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="shrink-0 rounded-2xl border border-border px-2 py-1 text-sm text-ink"
          >
            ×
          </button>
        </div>
        {pebble.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-ink">{pebble.description}</p>
        ) : null}
        {tags.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.key}
                className="rounded-xl bg-background px-2 py-0.5 text-xs text-muted"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MapPinPreview;
