import React, { useEffect, useRef } from 'react';
import MediaFrame from './MediaFrame';

const MediaCarousel = ({
  items,
  index = 0,
  onIndexChange,
  onOpen,
  showText = false,
  adjusting = false,
  onAdjust,
  controls = false,
  testId = 'media-carousel',
}) => {
  const scrollerRef = useRef(null);
  const safeIndex = items.length ? Math.min(index, items.length - 1) : 0;
  const active = items[safeIndex];

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const slide = scroller.children[safeIndex];
    if (slide && typeof slide.scrollIntoView === 'function') {
      slide.scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' });
    }
  }, [safeIndex, items.length]);

  const onScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || !scroller.clientWidth) return;
    const next = Math.round(scroller.scrollLeft / scroller.clientWidth);
    if (next !== safeIndex) onIndexChange?.(next);
  };

  return (
    <div>
      <div className="relative">
        <div
          ref={scrollerRef}
          data-testid={testId}
          className={`flex w-full min-w-0 snap-x snap-mandatory overflow-y-hidden ${
            adjusting ? 'overflow-x-hidden' : 'overflow-x-auto'
          }`}
          onScroll={onScroll}
        >
          {items.map((item, itemIndex) => {
            const name = item.filename || item.media_type || 'File';
            const visual = item.media_type === 'image' || item.media_type === 'video';
            const current = itemIndex === safeIndex;
            const frame = (
              <MediaFrame
                item={item}
                decorative={Boolean(onOpen)}
                active={current}
                controls={controls && current}
                adjusting={adjusting && current}
                onAdjust={onAdjust}
              />
            );
            return (
              <div key={item.media_id || `${name}-${itemIndex}`} className="w-full shrink-0 snap-center">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
                  {visual && onOpen ? (
                    <button
                      type="button"
                      aria-label={name}
                      className="block h-full w-full min-w-0"
                      onClick={() => onOpen(item)}
                    >
                      {frame}
                    </button>
                  ) : item.media_type === 'audio' ? (
                    <div className="flex h-full min-w-0 items-center p-2">
                      <audio src={item.media_url} controls className="w-full min-w-0" />
                    </div>
                  ) : visual ? (
                    frame
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
              </div>
            );
          })}
        </div>
        {items.length > 1 ? (
          <ol
            data-testid={`${testId}-dots`}
            aria-label="Slides"
            className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5"
          >
            {items.map((item, dotIndex) => (
              <li key={item.media_id || dotIndex}>
                <button
                  type="button"
                  aria-current={dotIndex === safeIndex ? 'true' : undefined}
                  aria-label={`Slide ${dotIndex + 1} of ${items.length}`}
                  onClick={() => onIndexChange?.(dotIndex)}
                  className={`block rounded-full shadow-sm ${
                    dotIndex === safeIndex ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/70'
                  }`}
                />
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      {showText && active?.title ? (
        <h2 className="mt-3 font-display text-lg font-semibold text-ink">{active.title}</h2>
      ) : null}
      {showText && active?.caption ? <p className="mt-1 text-sm text-ink">{active.caption}</p> : null}
    </div>
  );
};

export default MediaCarousel;
