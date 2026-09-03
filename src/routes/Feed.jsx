import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PebbleCard from '../components/Pebbles/PebbleCard';
import { fetchFeed, searchPebbles } from '../helpers/pebbleHelpers';

const Feed = () => {
  const [pebbles, setPebbles] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = query.trim() ? await searchPebbles({ q: query.trim() }) : await fetchFeed();
      setPebbles(data);
    } catch (err) {
      toast.error(err.message || 'Could not load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Feed</h1>
          <p className="text-sm text-muted">Discoveries from people you follow and the public stream.</p>
        </div>
        <Link
          to="/pebbles/new"
          className="rounded-2xl bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New pebble
        </Link>
      </div>
      <form
        className="flex gap-2 px-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pebbles"
          className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-2xl border border-border px-3 py-2 text-sm text-ink hover:border-pebble"
        >
          Search
        </button>
      </form>
      {loading ? (
        <p className="px-2 text-sm text-muted">Loading…</p>
      ) : pebbles.length === 0 ? (
        <p className="px-2 text-sm text-muted">No pebbles yet. Follow someone or create your first one.</p>
      ) : (
        <div className="border-t border-border">
          {pebbles.map((pebble) => (
            <PebbleCard
              key={pebble.pebble_id}
              pebble={pebble}
              onChange={(next) =>
                setPebbles((prev) =>
                  prev.map((p) => (p.pebble_id === next.pebble_id ? next : p))
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
