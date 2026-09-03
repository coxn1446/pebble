import React, { useEffect } from 'react';

/**
 * Shared modal shell for dialogs (report, save, advanced search, user lists).
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
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const panelProps =
    Root === 'form'
      ? { onSubmit }
      : {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      data-testid={testId}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <Root
        {...panelProps}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-surface p-5"
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        ) : null}
        {children}
        {footer ? <div className="flex justify-end gap-2">{footer}</div> : null}
      </Root>
    </div>
  );
};

export default Modal;
