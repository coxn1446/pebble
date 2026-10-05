import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FieldNotesEditor from '../FieldNotes/FieldNotesEditor';
import LocationField from '../Places/LocationField';
import { fetchFields, fetchPhenomena } from '../../helpers/taxonomyHelpers';
import { EMPTY_FIELD_NOTES } from '../../helpers/fieldNotesHelpers';
import { readObservation } from '../../helpers/pebbleHelpers';
import { uploadFile } from '../../helpers/uploadHelpers';
import MediaFrame from './MediaFrame';
import { fetchWeatherSuggestion } from '../../helpers/weatherHelpers';
import {
  CloudIcon,
  FogIcon,
  IceIcon,
  MoonIcon,
  PartlyCloudyIcon,
  RainIcon,
  SevereIcon,
  SleetIcon,
  SnowIcon,
  SunIcon,
  ThunderIcon,
  WindIcon,
  fieldIconForName,
} from '../Icons/Icons';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-pebble focus:border-accent';

const WEATHER = [
  { id: 'sunny', label: 'Sunny', Icon: SunIcon },
  { id: 'partly_cloudy', label: 'Partly cloudy', Icon: PartlyCloudyIcon },
  { id: 'cloudy', label: 'Cloudy', Icon: CloudIcon },
  { id: 'rain', label: 'Rain', Icon: RainIcon },
  { id: 'thunderstorm', label: 'Thunderstorm', Icon: ThunderIcon },
  { id: 'snow', label: 'Snow', Icon: SnowIcon },
  { id: 'sleet', label: 'Sleet / wintry mix', Icon: SleetIcon },
  { id: 'windy', label: 'Windy', Icon: WindIcon },
  { id: 'foggy', label: 'Foggy', Icon: FogIcon },
  { id: 'icy', label: 'Icy / frost', Icon: IceIcon },
  { id: 'severe', label: 'Severe weather', Icon: SevereIcon },
  { id: 'clear_night', label: 'Clear night', Icon: MoonIcon },
];

const WEATHER_IDS = new Set(WEATHER.map((item) => item.id));
const LEGACY_WEATHER = { sun: 'sunny', cloud: 'cloudy', wind: 'windy' };

const initialWeather = (value) => {
  if (!value) return '';
  const mapped = LEGACY_WEATHER[value] || value;
  return WEATHER_IDS.has(mapped) ? mapped : '';
};

const MEDIA_KINDS = [
  { type: 'image', label: 'Photo', accept: 'image/*' },
  { type: 'video', label: 'Video', accept: 'video/*' },
  { type: 'audio', label: 'Audio', accept: 'audio/*' },
  { type: 'data', label: 'Data', accept: '.json,.csv,.tsv,.txt' },
  { type: 'attachment', label: 'Attachment', accept: '*/*' },
];

const PebbleForm = ({
  initial,
  onSubmit,
  onSaveDraft,
  isSubmitting,
  pageTitle = 'Create pebble',
  submitLabel = 'Publish',
  onDelete,
}) => {
  const [pebbleId, setPebbleId] = useState(initial?.pebble_id || null);
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const startingObservation = readObservation(initial);
  const [observedOn, setObservedOn] = useState(startingObservation.observedOn);
  const [observedTime, setObservedTime] = useState(startingObservation.observedTime);
  const [weather, setWeather] = useState(initialWeather(initial?.weather));
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [pinName, setPinName] = useState(initial?.pin_name || initial?.place_name || '');
  const [isPrivate, setIsPrivate] = useState(Boolean(initial?.is_private));
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.hero_image_url || null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [media, setMedia] = useState(initial?.media || []);
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
  const [fieldIds, setFieldIds] = useState((initial?.fields || []).map((f) => f.field_id));
  const [selectedPhenomena, setSelectedPhenomena] = useState(
    (initial?.phenomena || []).map((p) => p.phenomenon_id)
  );
  const [otherTags, setOtherTags] = useState((initial?.other_tags || []).map((tag) => tag.name));
  const [otherDraft, setOtherDraft] = useState('');
  const [resources, setResources] = useState(
    (initial?.resources || []).map((item) => item.url).concat([''])
  );
  const [questions, setQuestions] = useState(
    (initial?.questions || []).map((item) => item.prompt).concat([''])
  );
  const [saveState, setSaveState] = useState('idle');
  const heroInputRef = useRef(null);
  const skipAutosave = useRef(true);
  const aliveRef = useRef(true);
  const weatherChosen = useRef(Boolean(initialWeather(initial?.weather)));
  const pinTouched = useRef(Boolean(initial?.pin_name));
  const observationEdited = useRef(false);
  const keptObservedAt = useRef(
    startingObservation.observedTime && initial?.observed_at ? initial.observed_at : null
  );
  const saveChain = useRef(Promise.resolve());
  const publishingRef = useRef(false);
  const pebbleIdRef = useRef(pebbleId);
  const saveDraftRef = useRef(onSaveDraft);
  saveDraftRef.current = onSaveDraft;
  const status = initial?.status === 'published' ? 'published' : 'draft';

  useEffect(() => {
    if (pebbleId) pebbleIdRef.current = pebbleId;
  }, [pebbleId]);

  useEffect(() => {
    let active = true;
    fetchFields()
      .then((rows) => {
        if (active) setFields(rows);
      })
      .catch(() => {
        if (active) setFields([]);
      });
    fetchPhenomena()
      .then((rows) => {
        if (active) setPhenomena(rows);
      })
      .catch(() => {
        if (active) setPhenomena([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const payload = () => ({
    pebbleId: pebbleIdRef.current,
    title,
    description,
    observedOn: observedOn || null,
    observedTime: observedTime || null,
    observedAt: observationEdited.current ? null : keptObservedAt.current || null,
    weather: weather || null,
    pinName: pinName.trim() || null,
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
    fieldIds,
    otherTags,
    resources: resources.map((url) => url.trim()).filter(Boolean),
    questions: questions.map((prompt) => prompt.trim()).filter(Boolean),
    mediaIds: media.map((item) => item.media_id),
    status,
  });

  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const hasContent = () => {
    const next = payloadRef.current();
    return Boolean(
      next.title.trim() ||
        next.description.trim() ||
        next.placeName ||
        next.placeLat != null ||
        next.heroImageUrl ||
        next.mediaIds.length ||
        next.fieldIds.length ||
        next.phenomenonIds.length ||
        next.otherTags.length ||
        next.resources.length ||
        next.questions.length ||
        next.weather ||
        next.observedOn ||
        next.pinName
    );
  };

  const persistDraft = () => {
    if (publishingRef.current) return Promise.resolve(null);
    const run = saveChain.current.then(async () => {
      if (!saveDraftRef.current || publishingRef.current) return null;
      if (!pebbleIdRef.current && !hasContent()) return null;
      if (aliveRef.current) setSaveState('saving');
      try {
        const saved = await saveDraftRef.current(payloadRef.current());
        if (saved?.pebble_id) {
          pebbleIdRef.current = saved.pebble_id;
          if (aliveRef.current) setPebbleId(saved.pebble_id);
        }
        if (aliveRef.current) setSaveState('saved');
        return saved;
      } catch (err) {
        if (aliveRef.current) setSaveState('error');
        throw err;
      }
    });
    saveChain.current = run.catch(() => {});
    return run;
  };

  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      persistDraft().catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    description,
    observedOn,
    observedTime,
    weather,
    pinName,
    isPrivate,
    heroImageUrl,
    place,
    fieldNotes,
    fieldIds,
    selectedPhenomena,
    otherTags,
    resources,
    questions,
    media,
  ]);

  useEffect(() => {
    aliveRef.current = true;
    const flush = () => {
      persistDraft().catch(() => {});
    };
    window.addEventListener('beforeunload', flush);
    return () => {
      aliveRef.current = false;
      window.removeEventListener('beforeunload', flush);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (weatherChosen.current) return undefined;
    if (place.placeLat == null || place.placeLng == null || !observedOn) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchWeatherSuggestion({
        lat: place.placeLat,
        lng: place.placeLng,
        date: observedOn,
        time: observedTime || undefined,
      })
        .then((code) => {
          if (cancelled || weatherChosen.current || !code || !WEATHER_IDS.has(code)) return;
          setWeather(code);
        })
        .catch(() => {});
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [place.placeLat, place.placeLng, observedOn, observedTime]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    publishingRef.current = true;
    try {
      await saveChain.current.catch(() => {});
      await onSubmit({ ...payload(), status: 'published' });
    } catch {
      publishingRef.current = false;
    }
  };

  const editObservation = (setter) => (value) => {
    observationEdited.current = true;
    setter(value);
  };

  const handlePlaceChange = (next) => {
    setPlace(next);
    if (!pinTouched.current && next?.placeName) setPinName(next.placeName);
  };

  const saveProgress = () => {
    persistDraft()
      .then(() => toast.success('Progress saved'))
      .catch((err) => toast.error(err.message || 'Could not save'));
  };

  const toggleField = (id) => {
    setFieldIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const togglePhenomenon = (id) => {
    setSelectedPhenomena((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const catalogPhenomena = phenomena.filter((item) => fieldIds.includes(item.field_id));
  const catalogIds = new Set(catalogPhenomena.map((item) => item.phenomenon_id));
  const attachedById = new Map(
    (initial?.phenomena || []).map((item) => [item.phenomenon_id, item])
  );
  const keptPhenomena = selectedPhenomena
    .map((id) => attachedById.get(id))
    .filter(
      (item) => item && fieldIds.includes(item.field_id) && !catalogIds.has(item.phenomenon_id)
    );
  const visiblePhenomena = [...catalogPhenomena, ...keptPhenomena];
  const chosenWeather = WEATHER.find((item) => item.id === weather);
  const ChosenWeatherIcon = chosenWeather?.Icon;

  const addOtherTag = () => {
    const name = otherDraft.trim();
    if (!name) return;
    setOtherTags((prev) => (prev.some((tag) => tag.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name]));
    setOtherDraft('');
  };

  const uploadHero = async (file) => {
    if (!file) return;
    setUploadingHero(true);
    try {
      const uploaded = await uploadFile(file, 'image');
      setHeroImageUrl(uploaded.media_url);
      toast.success('Featured image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingHero(false);
      if (heroInputRef.current) heroInputRef.current.value = '';
    }
  };

  const uploadMedia = async (kind, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploadingMedia(true);
    try {
      for (const file of files) {
        try {
          const uploaded = await uploadFile(file, kind.type);
          setMedia((prev) => [
            ...prev,
            {
              media_id: uploaded.media_id,
              media_url: uploaded.media_url,
              media_type: uploaded.media_type || kind.type,
              filename: uploaded.filename || file.name,
            },
          ]);
        } catch (err) {
          const message = err.message || 'Upload failed';
          toast.error(file.name && !message.includes(file.name) ? `${file.name}: ${message}` : message);
        }
      }
    } finally {
      setUploadingMedia(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 max-w-full space-y-4">
      <div className="sticky top-0 z-20 -mx-6 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              onClick={() => {
                persistDraft().catch(() => {});
              }}
              className="text-sm text-muted hover:text-ink"
            >
              Back
            </Link>
            <h1 className="font-display text-2xl font-semibold text-ink">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
            </span>
            {onDelete ? (
              <button
                type="button"
                aria-label="Delete pebble"
                onClick={onDelete}
                className="rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-ink"
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              disabled={isSubmitting || uploadingHero}
              onClick={saveProgress}
              className="rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-ink"
            >
              Save progress
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingHero || uploadingMedia}
              className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">At a glance</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="One or two sentences"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Date</span>
          <input
            type="date"
            value={observedOn}
            onChange={(e) => editObservation(setObservedOn)(e.target.value)}
            className={inputClass}
          />
        </label>
        <div>
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Time</span>
            <input
              type="time"
              lang="en-GB"
              step={60}
              min="00:00"
              max="23:59"
              value={observedTime}
              onChange={(e) => editObservation(setObservedTime)(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="button"
            onClick={() => editObservation(setObservedTime)('')}
            className="mt-2 text-sm text-accent"
          >
            Clear time
          </button>
        </div>
      </div>

      <LocationField
        value={place}
        onChange={handlePlaceChange}
        pinName={pinName}
        onPinNameChange={(value) => {
          pinTouched.current = true;
          setPinName(value);
        }}
      />

      <div>
        <p className="text-sm text-ink">
          Weather: Choose a Location / Date / Time to select the weather{' '}
          <button
            type="button"
            aria-expanded={weatherOpen}
            onClick={() => setWeatherOpen((open) => !open)}
            className="text-accent underline"
          >
            Override?
          </button>
        </p>
        {!weatherOpen && chosenWeather && ChosenWeatherIcon ? (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-accent px-2 py-1 text-xs text-white">
            <ChosenWeatherIcon className="h-3.5 w-3.5" />
            {chosenWeather.label}
          </span>
        ) : null}
        {weatherOpen ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {WEATHER.map(({ id, label, Icon }) => {
              const active = weather === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  aria-label={label}
                  onClick={() => {
                    weatherChosen.current = true;
                    setWeather(active ? '' : id);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs ${
                    active ? 'bg-accent text-white' : 'border border-border text-ink'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div>
        <span className="mb-1.5 block text-sm text-muted">Featured image</span>
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt=""
            className="mb-2 max-h-56 w-full rounded-2xl border border-border object-cover"
          />
        ) : null}
        <input
          ref={heroInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => uploadHero(e.target.files?.[0])}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={uploadingHero}
            onClick={() => heroInputRef.current?.click()}
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {heroImageUrl ? 'Replace image' : 'Choose image'}
          </button>
          {heroImageUrl ? (
            <button
              type="button"
              className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
              onClick={() => setHeroImageUrl(null)}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 max-w-full">
        <span className="mb-1.5 block text-sm text-muted">Media</span>
        <div className="mb-2 flex max-w-full flex-wrap gap-2">
          {MEDIA_KINDS.map((kind) => (
            <label
              key={kind.type}
              className="cursor-pointer rounded-xl border border-border px-2 py-1 text-xs text-ink"
            >
              {kind.label}
              <input
                type="file"
                accept={kind.accept}
                multiple
                className="sr-only"
                disabled={uploadingMedia}
                onChange={(e) => {
                  const picked = Array.from(e.target.files || []);
                  e.target.value = '';
                  uploadMedia(kind, picked);
                }}
              />
            </label>
          ))}
        </div>
        <div className="grid w-full min-w-0 grid-cols-3 gap-2" data-testid="pebble-form-media">
          {media.map((item) => (
            <div
              key={item.media_id}
              className="relative h-24 min-w-0 overflow-hidden rounded-xl border border-border bg-surface"
            >
              <MediaFrame item={item} />
              <button
                type="button"
                aria-label={`Remove ${item.filename || item.media_type}`}
                className="absolute right-1 top-1 rounded-full bg-background px-1.5 text-xs text-ink"
                onClick={() => setMedia((prev) => prev.filter((row) => row.media_id !== item.media_id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm text-muted">Scientific fields</span>
        <div className="flex flex-wrap gap-2">
          {fields.map((field) => {
            const active = fieldIds.includes(field.field_id);
            const FieldIcon = fieldIconForName(field.name);
            return (
              <button
                key={field.field_id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleField(field.field_id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs ${
                  active ? 'bg-accent text-white' : 'border border-border text-ink'
                }`}
              >
                <FieldIcon className="h-3.5 w-3.5" />
                {field.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm text-muted">Phenomenon tags</span>
        <div className="flex flex-wrap gap-2">
          {visiblePhenomena.map((ph) => {
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
        <div className="mt-2 flex gap-2">
          <input
            value={otherDraft}
            onChange={(e) => setOtherDraft(e.target.value)}
            placeholder="Other"
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addOtherTag();
              }
            }}
          />
          <button
            type="button"
            onClick={addOtherTag}
            className="rounded-2xl border border-border px-3 text-sm text-ink"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {otherTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setOtherTags((prev) => prev.filter((item) => item !== tag))}
              className="rounded-xl bg-accent px-2 py-1 text-xs text-white"
            >
              {tag} ×
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm text-muted">Further reading</span>
        <div className="space-y-2">
          {resources.map((url, index) => (
            <input
              key={`resource-${index}`}
              value={url}
              placeholder="https://"
              onChange={(e) => {
                const next = [...resources];
                next[index] = e.target.value;
                setResources(next);
              }}
              className={inputClass}
            />
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm text-accent"
          onClick={() => setResources((prev) => [...prev, ''])}
        >
          Add link
        </button>
      </div>

      <div>
        <span className="mb-1.5 block text-sm text-muted">Questions to consider</span>
        <div className="space-y-2">
          {questions.map((prompt, index) => (
            <input
              key={`question-${index}`}
              value={prompt}
              onChange={(e) => {
                const next = [...questions];
                next[index] = e.target.value;
                setQuestions(next);
              }}
              className={inputClass}
            />
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm text-accent"
          onClick={() => setQuestions((prev) => [...prev, ''])}
        >
          Add question
        </button>
      </div>

      <div>
        <span className="mb-1.5 block text-sm text-muted">Field notes</span>
        <FieldNotesEditor value={fieldNotes} onChange={setFieldNotes} />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
        />
        Private
      </label>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          disabled={isSubmitting || uploadingHero}
          onClick={saveProgress}
          className="rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-ink"
        >
          Save progress
        </button>
        <button
          type="submit"
          disabled={isSubmitting || uploadingHero || uploadingMedia}
          className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default PebbleForm;
