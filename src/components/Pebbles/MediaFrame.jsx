import React, { useEffect, useRef, useState } from 'react';
import { applyMediaPreview } from '../../helpers/mediaPreview';

const paintVideoFrame = (event) => {
  const video = event.currentTarget;
  if (video.dataset.framed === '1') return;
  const duration = Number(video.duration);
  const target = Number.isFinite(duration) && duration > 0 ? Math.min(0.1, duration / 2) : 0.1;
  video.dataset.framed = '1';
  if (video.currentTime >= target) return;
  try {
    video.currentTime = target;
  } catch {
    video.dataset.framed = '';
  }
};

const MediaFrame = ({
  item,
  decorative = false,
  active = true,
  controls = false,
  adjusting = false,
  onAdjust,
}) => {
  const frameRef = useRef(null);
  const cropRef = useRef(null);
  const dragRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const name = item?.filename || item?.media_type || 'File';
  const preview =
    Boolean(item?.media_url) &&
    !failed &&
    (item.media_type === 'image' || item.media_type === 'video');

  useEffect(() => {
    setFailed(false);
  }, [item?.media_url]);

  useEffect(() => {
    applyMediaPreview(frameRef.current, item);
  }, [item]);

  const onPointerDown = (event) => {
    if (!adjusting || !onAdjust) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      previewX: Number(item?.preview_x),
      previewY: Number(item?.preview_y),
    };
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || !onAdjust) return;
    const rect = cropRef.current?.getBoundingClientRect();
    const width = rect?.width || 1;
    const height = rect?.height || 1;
    const originX = Number.isFinite(drag.previewX) ? drag.previewX : 50;
    const originY = Number.isFinite(drag.previewY) ? drag.previewY : 50;
    onAdjust({
      preview_x: Math.min(100, Math.max(0, originX - ((event.clientX - drag.x) / width) * 100)),
      preview_y: Math.min(100, Math.max(0, originY - ((event.clientY - drag.y) / height) * 100)),
    });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  if (!preview) {
    return (
      <span className="flex h-full w-full items-center bg-surface p-2 text-xs text-ink">{name}</span>
    );
  }

  const shared = {
    ref: frameRef,
    className: 'media-preview h-full w-full max-h-full max-w-full object-cover',
    onError: () => setFailed(true),
  };

  return (
    <div
      ref={cropRef}
      className={`relative h-full w-full min-w-0 max-w-full overflow-hidden bg-surface ${
        adjusting ? 'touch-none cursor-grab' : ''
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {item.media_type === 'image' ? (
        <img
          {...shared}
          src={item.media_url}
          alt={decorative ? '' : name}
          loading={active ? 'eager' : 'lazy'}
        />
      ) : (
        <video
          {...shared}
          src={item.media_url}
          muted
          playsInline
          controls={!adjusting}
          preload="auto"
          aria-label={decorative ? undefined : name}
          aria-hidden={decorative ? true : undefined}
          className={`${shared.className}${decorative && !controls ? ' pointer-events-none' : ''}`}
          onLoadedMetadata={paintVideoFrame}
        />
      )}
      {adjusting ? (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-difference"
          data-testid="media-crop"
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 left-1/3 w-px bg-white" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white" />
        </div>
      ) : null}
    </div>
  );
};

export const PreviewImage = ({ item, className = '', testId, alt = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    applyMediaPreview(ref.current, item);
  }, [item]);
  if (!item?.media_url) return null;
  return (
    <img
      ref={ref}
      src={item.media_url}
      alt={alt}
      data-testid={testId}
      className={`media-preview object-cover ${className}`}
    />
  );
};

export default MediaFrame;
