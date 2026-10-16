import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import NewCollectionForm from '../components/Collections/NewCollectionForm';
import { fetchCollections } from '../helpers/collectionHelpers';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setCollections(await fetchCollections());
    } catch (err) {
      toast.error(err.message || 'Could not load collections');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Collections</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-2xl bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover"
        >
          New collection
        </button>
      </div>
      {showForm ? (
        <NewCollectionForm
          onCancel={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      ) : null}
      <div className="space-y-3">
        {collections.map((c) => (
          <Link
            key={c.collection_id}
            to={`/collections/${c.collection_id}`}
            className="block rounded-2xl border border-border bg-surface px-4 py-3 text-ink hover:border-pebble"
          >
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-muted">
              {c.is_private ? 'Private' : 'Public'}
              {c.is_collaborative ? ' · Collaborate' : ''}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Collections;
