import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const formActionClass =
  'shrink-0 whitespace-nowrap rounded-2xl border border-border px-2.5 py-1.5 text-sm font-medium text-ink';

export const formPrimaryClass =
  'shrink-0 whitespace-nowrap rounded-2xl bg-accent px-2.5 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60';

/**
 * Full-screen form: the header stays put and only the fields scroll.
 */
const FormModal = ({
  title,
  onBack,
  actions,
  onSubmit,
  children,
  testId = 'form-modal',
  stacked = false,
  meta = null,
}) => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onBack?.();
    };
    const html = document.documentElement;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyWidth: document.body.style.width,
      bodyHeight: document.body.style.height,
      bodyInset: document.body.style.inset,
    };
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.inset = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      html.style.overflow = previous.htmlOverflow;
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.position = previous.bodyPosition;
      document.body.style.width = previous.bodyWidth;
      document.body.style.height = previous.bodyHeight;
      document.body.style.inset = previous.bodyInset;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onBack]);

  return createPortal(
    <form
      onSubmit={onSubmit}
      data-testid={testId}
      className="fixed inset-0 z-50 flex h-dvh max-h-dvh w-full flex-col overflow-hidden overscroll-none bg-surface"
    >
      <header
        className={
          stacked
            ? 'shrink-0 border-b border-border bg-surface px-3 py-3 pt-safe-top'
            : 'flex shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-3 pt-safe-top'
        }
      >
        <button type="button" onClick={onBack} className="shrink-0 text-sm text-muted hover:text-ink">
          ← Back
        </button>
        {stacked ? (
          <>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className="min-w-0 font-display text-lg font-semibold text-ink">{title}</h1>
              {meta ? (
                <p className="shrink-0 pt-1 text-xs text-muted" data-testid="form-saved-at">
                  {meta}
                </p>
              ) : null}
            </div>
            {actions ? <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div> : null}
          </>
        ) : (
          <>
            <h1 className="min-w-0 flex-1 truncate text-center font-display text-lg font-semibold text-ink">
              {title}
            </h1>
            <div className="flex shrink-0 items-center gap-1">{actions}</div>
          </>
        )}
      </header>
      <div data-testid="form-scroll" className="min-h-0 w-full flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-none px-4 py-4 pb-safe-bottom">
        {children}
      </div>
    </form>,
    document.body
  );
};

export default FormModal;
