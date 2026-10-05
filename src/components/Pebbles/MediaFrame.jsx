import React, { useState } from 'react';

const MediaFrame = ({ item, decorative = false }) => {
  const [failed, setFailed] = useState(false);
  const name = item?.filename || item?.media_type || 'File';
  const preview =
    Boolean(item?.media_url) &&
    !failed &&
    (item.media_type === 'image' || item.media_type === 'video');

  return (
    <div className="h-full w-full min-w-0 max-w-full overflow-hidden">
      {preview && item.media_type === 'image' ? (
        <img
          src={item.media_url}
          alt={decorative ? '' : name}
          className="h-full w-full max-h-full max-w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : preview ? (
        <video
          src={`${item.media_url}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          aria-label={decorative ? undefined : name}
          aria-hidden={decorative ? true : undefined}
          className="pointer-events-none h-full w-full max-h-full max-w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center bg-surface p-2 text-xs text-ink">{name}</span>
      )}
    </div>
  );
};

export default MediaFrame;
