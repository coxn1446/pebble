import React, { useEffect } from 'react';
import { CloseIcon } from '../Icons/Icons';

/**
 * Large dialog: padding around the card, safe-area inset for the notch,
 * and a close control that returns to the screen underneath.
 */
const Modal = ({
  open = true,
  onClose,
  title,
  children,
  footer,
  as: Root = 'div',
  onSubmit,
  testId = 'modal',
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const panelProps = Root === 'form' ? { onSubmit } : {};

  const closeFromBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex bg-ink/40 pt-safe-top pb-safe-bottom"
      data-testid={testId}
      role="presentation"
      onClick={closeFromBackdrop}
    >
      <div className="flex min-h-0 w-full flex-1 p-4" onClick={closeFromBackdrop}>
        <Root
          {...panelProps}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
          className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4">
            {title ? (
              <h2 className="min-w-0 flex-1 font-display text-lg font-semibold text-ink">{title}</h2>
            ) : (
              <span className="flex-1" />
            )}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-ink hover:bg-background"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
          {footer ? <div className="flex shrink-0 justify-end gap-2 px-4 pb-4">{footer}</div> : null}
        </Root>
      </div>
    </div>
  );
};

export default Modal;
