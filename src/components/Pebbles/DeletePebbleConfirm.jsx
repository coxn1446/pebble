import React from 'react';
import Modal from '../Modal/Modal';

const DeletePebbleConfirm = ({ pebble, onCancel, onConfirm }) => {
  if (!pebble) return null;

  return (
    <Modal
      open
      title="Delete this pebble?"
      testId="delete-pebble-modal"
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover"
          >
            Delete
          </button>
        </>
      }
    >
      <p className="text-sm text-ink">{pebble.title || 'Untitled'}</p>
      <p className="text-sm text-ink">Are you sure? Deletion is permanent.</p>
    </Modal>
  );
};

export default DeletePebbleConfirm;
