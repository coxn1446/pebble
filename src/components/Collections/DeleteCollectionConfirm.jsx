import React from 'react';
import Modal from '../Modal/Modal';

const DeleteCollectionConfirm = ({ collection, onCancel, onConfirm }) => {
  if (!collection) return null;

  return (
    <Modal
      open
      title="Delete collection?"
      testId="delete-collection-modal"
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
      <p className="text-sm text-ink">{collection.name}</p>
    </Modal>
  );
};

export default DeleteCollectionConfirm;
