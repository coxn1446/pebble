import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createCollection, fetchCollections } from '../helpers/collectionHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCollaborative, setIsCollaborative] = useState(false);

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
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Collections</h1>
        <p className="text-sm text-muted">Save pebbles for later. Invite collaborators when needed.</p>
      </div>
      <form
        className="space-y-3 rounded-2xl border border-border bg-surface p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await createCollection({ name, isPrivate, isCollaborative });
            setName('');
            toast.success('Collection created');
            load();
          } catch (err) {
            toast.error(err.message);
          }
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          Private
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isCollaborative}
            onChange={(e) => setIsCollaborative(e.target.checked)}
          />
          Collaborative
        </label>
        <button type="submit" className="rounded-2xl bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover">
          Create collection
        </button>
      </form>
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
              {c.is_collaborative ? ' · Collaborative' : ''}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Collections;
