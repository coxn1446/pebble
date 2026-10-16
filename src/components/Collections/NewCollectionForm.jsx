import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import FormModal, { formPrimaryClass } from '../Modal/FormModal';
import { selectUser } from '../../store/auth.reducer';
import { addPebbleToCollection, createCollection, inviteToCollection } from '../../helpers/collectionHelpers';
import { fetchSearchSuggestions } from '../../helpers/searchHelpers';
import { fetchUserProfile } from '../../helpers/userHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-accent';

const NewCollectionForm = ({ onCreated, onCancel }) => {
  const me = useSelector(selectUser);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [pebbles, setPebbles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me?.username) return undefined;
    let active = true;
    fetchUserProfile(me.username)
      .then((data) => {
        if (!active) return;
        setPebbles((data.pebbles || []).filter((pebble) => pebble.status !== 'draft'));
      })
      .catch(() => {
        if (active) setPebbles([]);
      });
    return () => {
      active = false;
    };
  }, [me?.username]);

  const searchPeople = async (value) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setMatches([]);
      return;
    }
    try {
      const rows = await fetchSearchSuggestions(value);
      const chosen = new Set(collaborators.map((person) => Number(person.user_id)));
      setMatches(rows.filter((row) => row.type === 'user' && !chosen.has(Number(row.user_id))));
    } catch {
      setMatches([]);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const collection = await createCollection({
        name,
        isPrivate,
        isCollaborative: collaborators.length > 0,
      });
      for (const person of collaborators) {
        if (person.user_id) await inviteToCollection(collection.collection_id, person.user_id);
      }
      for (const pebbleId of selectedIds) {
        await addPebbleToCollection(collection.collection_id, pebbleId);
      }
      toast.success('Collection created');
      onCreated?.(collection);
    } catch (err) {
      toast.error(err.message || 'Could not create collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      title="Create collection"
      testId="create-collection-form"
      onBack={onCancel}
      onSubmit={submit}
      actions={
        <button type="submit" disabled={saving} className={formPrimaryClass}>
          {saving ? 'Saving…' : 'Create'}
        </button>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          Private
        </label>
        <div>
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Add collaborators (optional)</span>
            <input
              value={query}
              onChange={(e) => searchPeople(e.target.value)}
              className={inputClass}
              placeholder="Name or username"
              aria-label="Add collaborators"
            />
          </label>
          {collaborators.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {collaborators.map((person) => (
                <li key={person.user_id}>
                  <button
                    type="button"
                    className="rounded-2xl border border-border px-2.5 py-1 text-sm text-ink"
                    aria-label={`Remove ${person.username || person.label}`}
                    onClick={() =>
                      setCollaborators((prev) => prev.filter((item) => item.user_id !== person.user_id))
                    }
                  >
                    @{person.username || person.label} ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {matches.length ? (
            <ul className="mt-2 space-y-1" data-testid="collaborator-results">
              {matches.map((person) => (
                <li key={person.user_id || person.id}>
                  <button
                    type="button"
                    className="text-sm text-accent hover:underline"
                    onClick={() => {
                      setCollaborators((prev) => [...prev, person]);
                      setMatches([]);
                      setQuery('');
                    }}
                  >
                    {person.label} {person.subtitle}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm text-muted">Pebbles</legend>
          {pebbles.length === 0 ? (
            <p className="text-sm text-muted">No pebbles.</p>
          ) : (
            pebbles.map((pebble) => (
              <label key={pebble.pebble_id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(pebble.pebble_id)}
                  onChange={() =>
                    setSelectedIds((prev) =>
                      prev.includes(pebble.pebble_id)
                        ? prev.filter((id) => id !== pebble.pebble_id)
                        : [...prev, pebble.pebble_id]
                    )
                  }
                />
                {pebble.title || 'Untitled'}
              </label>
            ))
          )}
        </fieldset>
      </div>
    </FormModal>
  );
};

export default NewCollectionForm;
