import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createCollection, inviteToCollection } from '../../helpers/collectionHelpers';
import { fetchSearchSuggestions } from '../../helpers/searchHelpers';
import { uploadFile } from '../../helpers/uploadHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-accent';

const NewCollectionForm = ({ onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [collaborate, setCollaborate] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteMatches, setInviteMatches] = useState([]);
  const [invitee, setInvitee] = useState(null);
  const [saving, setSaving] = useState(false);

  const searchPeople = async (value) => {
    setInviteQuery(value);
    setInvitee(null);
    if (value.trim().length < 2) {
      setInviteMatches([]);
      return;
    }
    try {
      const rows = await fetchSearchSuggestions(value);
      setInviteMatches(rows.filter((row) => row.type === 'user'));
    } catch {
      setInviteMatches([]);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const collection = await createCollection({
        name,
        isPrivate,
        isCollaborative: collaborate,
        coverImageUrl: coverUrl || null,
      });
      if (collaborate && invitee?.user_id) {
        await inviteToCollection(collection.collection_id, invitee.user_id);
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
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Cover photo</span>
        <input
          type="file"
          accept="image/*"
          className="text-base text-ink"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const uploaded = await uploadFile(file, 'image');
              setCoverUrl(uploaded.url || uploaded.media_url);
            } catch (err) {
              toast.error(err.message || 'Upload failed');
            }
          }}
        />
      </label>
      {coverUrl ? (
        <img src={coverUrl} alt="" className="h-24 w-24 rounded-2xl object-cover" />
      ) : null}
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
        Private
      </label>
      <div className="relative">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={collaborate}
            onChange={(e) => {
              setCollaborate(e.target.checked);
              if (!e.target.checked) {
                setInvitee(null);
                setInviteMatches([]);
              }
            }}
          />
          Collaborate
        </label>
        {collaborate ? (
          <div
            data-testid="invite-popover"
            className="absolute left-0 z-10 mt-2 w-full space-y-2 rounded-2xl border border-border bg-surface p-3 shadow-sm"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Who to invite</span>
              <input
                value={inviteQuery}
                onChange={(e) => searchPeople(e.target.value)}
                className={inputClass}
                placeholder="Name or username"
              />
            </label>
            {invitee ? <p className="text-sm text-ink">@{invitee.username}</p> : null}
            {inviteMatches.length ? (
              <ul className="space-y-1">
                {inviteMatches.map((person) => (
                  <li key={person.user_id}>
                    <button
                      type="button"
                      className="text-sm text-accent hover:underline"
                      onClick={() => {
                        setInvitee(person);
                        setInviteMatches([]);
                        setInviteQuery(person.username);
                      }}
                    >
                      {person.label} {person.subtitle}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
        >
          Create collection
        </button>
        <button type="button" onClick={onCancel} className="rounded-2xl border border-border px-3 py-2 text-sm text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default NewCollectionForm;
