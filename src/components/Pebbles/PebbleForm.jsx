import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FieldNotesEditor from '../FieldNotes/FieldNotesEditor';
import PlaceAutocomplete from '../Places/PlaceAutocomplete';
import { fetchFields, fetchPhenomena } from '../../helpers/taxonomyHelpers';
import { EMPTY_FIELD_NOTES } from '../../helpers/fieldNotesHelpers';
import { uploadFile } from '../../helpers/uploadHelpers';
import { fieldIconForName } from '../Icons/Icons';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-pebble focus:border-accent';

const PebbleForm = ({
  initial,
  onSubmit,
  isSubmitting,
  pageTitle = 'Create pebble',
  submitLabel = 'Publish',
}) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [isPrivate, setIsPrivate] = useState(Boolean(initial?.is_private));
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.hero_image_url || null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [place, setPlace] = useState({
    placeId: initial?.place_id || null,
    placeName: initial?.place_name || '',
    placeLat: initial?.place_lat ?? null,
    placeLng: initial?.place_lng ?? null,
    placeLocality: initial?.place_locality || null,
    placeAdminArea: initial?.place_admin_area || null,
    placeCountry: initial?.place_country || null,
  });
  const [fieldNotes, setFieldNotes] = useState(initial?.field_notes || EMPTY_FIELD_NOTES);
  const [fields, setFields] = useState([]);
  const [phenomena, setPhenomena] = useState([]);
  const [fieldId, setFieldId] = useState('');
  const [selectedPhenomena, setSelectedPhenomena] = useState(
    (initial?.phenomena || []).map((p) => p.phenomenon_id)
  );

  useEffect(() => {
    fetchFields().then(setFields).catch(() => setFields([]));
  }, []);

  useEffect(() => {
    fetchPhenomena(fieldId || undefined)
      .then(setPhenomena)
      .catch(() => setPhenomena([]));
  }, [fieldId]);

  const togglePhenomenon = (id) => {
    setSelectedPhenomena((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      title,
      description,
      isPrivate,
      placeId: place.placeId,
      placeName: place.placeName,
      placeLat: place.placeLat,
      placeLng: place.placeLng,
      placeLocality: place.placeLocality,
      placeAdminArea: place.placeAdminArea,
      placeCountry: place.placeCountry,
      heroImageUrl,
      fieldNotes,
      phenomenonIds: selectedPhenomena,
    });
  };

  const selectedField = fields.find((f) => String(f.field_id) === String(fieldId));
  const FieldIcon = fieldIconForName(selectedField?.name);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="sticky top-0 z-20 -mx-6 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">{pageTitle}</h1>
          <button
            type="submit"
            disabled={isSubmitting || uploadingHero}
            className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Title</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </label>
      <div>
        <span className="mb-1.5 block text-sm text-muted">Hero image</span>
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt=""
            className="mb-2 max-h-56 w-full rounded-2xl border border-border object-cover"
          />
        ) : null}
        <input
          type="file"
          accept="image/*"
          disabled={uploadingHero}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadingHero(true);
            try {
              const media = await uploadFile(file, 'image');
              setHeroImageUrl(media.media_url);
              toast.success('Hero image uploaded');
            } catch (err) {
              toast.error(err.message || 'Upload failed');
            } finally {
              setUploadingHero(false);
              e.target.value = '';
            }
          }}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-2xl file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
        />
        {heroImageUrl ? (
          <button
            type="button"
            className="mt-2 text-xs text-muted hover:text-ink"
            onClick={() => setHeroImageUrl(null)}
          >
            Remove hero image
          </button>
        ) : null}
      </div>
      <PlaceAutocomplete value={place} onChange={setPlace} />
      <div>
        <span className="mb-1.5 block text-sm text-muted">Field notes</span>
        <FieldNotesEditor value={fieldNotes} onChange={setFieldNotes} />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Scientific field</span>
        <select
          value={fieldId}
          onChange={(e) => setFieldId(e.target.value)}
          className={inputClass}
        >
          <option value="">All fields</option>
          {fields.map((f) => (
            <option key={f.field_id} value={f.field_id}>
              {f.name}
            </option>
          ))}
        </select>
        {selectedField ? (
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
            <FieldIcon className="h-3.5 w-3.5" />
            {selectedField.name}
          </span>
        ) : null}
      </label>
      <div>
        <span className="mb-1.5 block text-sm text-muted">Phenomenon tags</span>
        <div className="flex flex-wrap gap-2">
          {phenomena.map((ph) => {
            const active = selectedPhenomena.includes(ph.phenomenon_id);
            return (
              <button
                key={ph.phenomenon_id}
                type="button"
                onClick={() => togglePhenomenon(ph.phenomenon_id)}
                className={`rounded-xl px-2 py-1 text-xs ${
                  active ? 'bg-accent text-white' : 'border border-border text-ink'
                }`}
              >
                {ph.name}
              </button>
            );
          })}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
        />
        Private (not searchable by others)
      </label>
    </form>
  );
};

export default PebbleForm;
