import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addPebbleToCollection, fetchCollections } from '../../helpers/collectionHelpers';
import Modal from '../Modal/Modal';

const SaveToCollectionsDialog = ({ pebbleId, onClose }) => {
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCollections()
      .then((rows) => {
        if (active) setCollections(rows);
      })
      .catch((err) => toast.error(err.message || 'Could not load collections'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selected.size) {
      toast.error('Select at least one collection');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        [...selected].map((collectionId) => addPebbleToCollection(collectionId, pebbleId))
      );
      toast.success(
        selected.size === 1 ? 'Saved to collection' : `Saved to ${selected.size} collections`
      );
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Add to collection"
      testId="save-collections-dialog"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || loading || !collections.length}
            onClick={handleSave}
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : collections.length === 0 ? (
        <p className="text-sm text-muted">
          No collections yet.{' '}
          <Link to="/collections" className="text-accent hover:underline" onClick={onClose}>
            Create one
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {collections.map((c) => (
            <li key={c.collection_id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-3 py-2 text-sm text-ink hover:border-pebble">
                <input
                  type="checkbox"
                  checked={selected.has(c.collection_id)}
                  onChange={() => toggle(c.collection_id)}
                />
                <span className="flex-1">
                  {c.name}
                  <span className="ml-2 text-xs text-muted">
                    {c.is_private ? 'Private' : 'Public'}
                    {c.is_collaborative ? ' · Collaborative' : ''}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default SaveToCollectionsDialog;
