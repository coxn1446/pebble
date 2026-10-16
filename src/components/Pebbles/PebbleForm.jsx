import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormModal, { formActionClass, formPrimaryClass } from '../Modal/FormModal';
import Modal from '../Modal/Modal';
import toast from 'react-hot-toast';
import FieldNotesEditor from '../FieldNotes/FieldNotesEditor';
import LocationField from '../Places/LocationField';
import { fetchFields, fetchPhenomena } from '../../helpers/taxonomyHelpers';
import { EMPTY_FIELD_NOTES, countFieldNoteWords } from '../../helpers/fieldNotesHelpers';
import { readObservation } from '../../helpers/pebbleHelpers';
import { uploadFiles } from '../../helpers/uploadHelpers';
import {
  MAX_UPLOAD_BYTES,
  VISUAL_MEDIA_LIMIT,
  isVisualMedia,
  mediaKindForFile,
} from '../../helpers/mediaPreview';
import MediaCarousel from './MediaCarousel';
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
  CloseIcon,
  PlusIcon,
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
  { type: 'audio', label: 'Audio', accept: 'audio/*' },
  { type: 'data', label: 'Data', accept: '.json,.csv,.tsv,.txt' },
  { type: 'attachment', label: 'Attachment', accept: '*/*' },
];

const LIBRARY_ACCEPT = 'image/*,video/*,.mov,.mp4,.m4v,.webm,.heic,.jpg,.jpeg,.png';

const formatSavedStamp = (date) => {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `Saved ${hour12}:${minutes} ${suffix}`;
};

const filledCount = (rows) => rows.map((value) => String(value || '').trim()).filter(Boolean).length;

const PebbleForm = ({
  initial,
  onSubmit,
  onSaveDraft,
  isSubmitting,
  pageTitle = 'Create pebble',
  submitLabel = 'Publish',
  onDelete,
  onDiscardDraft,
}) => {
  const navigate = useNavigate();
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
  const [media, setMedia] = useState(initial?.media || []);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [adjusting, setAdjusting] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
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
  const libraryInputRef = useRef(null);
  const pendingKey = useRef(0);
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
  const discardRef = useRef(false);
  const pebbleIdRef = useRef(pebbleId);
  const saveDraftRef = useRef(onSaveDraft);
  saveDraftRef.current = onSaveDraft;
  const status = initial?.status === 'published' ? 'published' : 'draft';
  const isPublished = status === 'published' && Boolean(initial);
  const isDraft = initial?.status === 'draft';

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
    mediaIds: media.filter((item) => !item.pending).map((item) => item.media_id),
    media: media
      .filter((item) => !item.pending)
      .map((item) => ({
        mediaId: item.media_id,
        title: item.title || null,
        caption: item.caption || null,
        previewX: item.preview_x ?? 50,
        previewY: item.preview_y ?? 50,
        previewScale: item.preview_scale ?? 1,
      })),
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
        if (aliveRef.current) {
          setSaveState('saved');
          setSavedAt(new Date());
        }
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
    if (isPublished) return undefined;
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
      if (discardRef.current || isPublished) return;
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
    if (!selectedPhenomena.length) {
      toast.error('Choose a phenomenon topic');
      return;
    }
    if (place.placeLat == null || place.placeLng == null) {
      toast.error('Add a location');
      return;
    }
    if (!String(place.placeName || '').trim() && !pinName.trim()) {
      toast.error('Name the pin');
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
    const manualPin = Boolean(next?.manualPin);
    const placeNext = { ...(next || {}) };
    delete placeNext.manualPin;
    setPlace(placeNext);
    if (manualPin) {
      if (!pinTouched.current) setPinName('');
      return;
    }
    if (!pinTouched.current && placeNext.placeName) setPinName(placeNext.placeName);
  };

  const saveProgress = () => {
    persistDraft()
      .then(() => toast.success('Changes saved'))
      .catch((err) => toast.error(err.message || 'Could not save'));
  };

  const discardChanges = async () => {
    discardRef.current = true;
    publishingRef.current = true;
    try {
      if (!initial && pebbleIdRef.current && onDiscardDraft) {
        await onDiscardDraft(pebbleIdRef.current);
      }
    } catch (err) {
      discardRef.current = false;
      publishingRef.current = false;
      toast.error(err.message || 'Could not discard');
      return;
    }
    navigate(isPublished ? `/pebbles/${initial.pebble_id}` : '/profile');
  };

  const goBack = () => {
    if (isPublished) {
      discardRef.current = true;
      publishingRef.current = true;
      navigate(`/pebbles/${initial.pebble_id}`);
      return;
    }
    navigate('/profile');
  };

  const handleChromeBack = () => {
    if (carouselOpen) {
      setCarouselOpen(false);
      setAdjusting(false);
      return;
    }
    if (activeDrawer) {
      setActiveDrawer(null);
      return;
    }
    goBack();
  };

  const renderActions = () => (
    <>
      {isDraft && onDelete ? (
        <button type="button" onClick={onDelete} className={formActionClass} aria-label="Delete draft">
          Delete
        </button>
      ) : (
        <button type="button" onClick={discardChanges} className={formActionClass}>
          Discard
        </button>
      )}
      {isPublished ? (
        <button
          type="submit"
          disabled={isSubmitting || media.some((item) => item.pending)}
          className={formPrimaryClass}
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={isSubmitting || media.some((item) => item.pending)}
            onClick={saveProgress}
            className={formActionClass}
          >
            Save changes
          </button>
          <button
            type="submit"
            disabled={isSubmitting || media.some((item) => item.pending)}
            className={formPrimaryClass}
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        </>
      )}
    </>
  );

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
  const readyMedia = media.filter((item) => !item.pending);
  const safeMediaIndex = readyMedia.length ? Math.min(mediaIndex, readyMedia.length - 1) : 0;
  const activeMedia = readyMedia[safeMediaIndex] || null;

  const addOtherTag = () => {
    const name = otherDraft.trim();
    if (!name) return;
    setOtherTags((prev) => (prev.some((tag) => tag.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name]));
    setOtherDraft('');
  };

  const reportUploadError = (result, fallbackName) => {
    const message = result?.error?.message || 'Upload failed';
    const name = result?.file?.name || fallbackName;
    toast.error(name && !message.includes(name) ? `${name}: ${message}` : message);
  };

  const queueUploads = (entries) => {
    if (!entries.length) return;
    const placeholders = entries.map((entry) => {
      pendingKey.current += 1;
      return {
        media_id: `pending-${pendingKey.current}`,
        pending: true,
        filename: entry.file.name,
        media_type: entry.mediaType,
        media_url: '',
        title: '',
        caption: '',
        preview_x: 50,
        preview_y: 50,
        preview_scale: 1,
      };
    });
    setMedia((prev) => [...prev, ...placeholders]);
    uploadFiles(entries).then((results) => {
      results.forEach((result, index) => {
        if (!result?.ok) reportUploadError(result, placeholders[index].filename);
      });
      setMedia((prev) => {
        let next = prev;
        results.forEach((result, index) => {
          const placeholder = placeholders[index];
          if (!next.some((item) => item.media_id === placeholder.media_id)) return;
          if (!result?.ok) {
            next = next.filter((item) => item.media_id !== placeholder.media_id);
            return;
          }
          next = next.map((item) =>
            item.media_id === placeholder.media_id
              ? {
                  media_id: result.media.media_id,
                  media_url: result.media.media_url,
                  media_type: result.media.media_type || placeholder.media_type,
                  filename: result.media.filename || placeholder.filename,
                  title: '',
                  caption: '',
                  preview_x: 50,
                  preview_y: 50,
                  preview_scale: 1,
                }
              : item
          );
        });
        return next;
      });
    });
  };

  const uploadLibrary = (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    const room = VISUAL_MEDIA_LIMIT - media.filter(isVisualMedia).length;
    if (room <= 0) {
      toast.error('You can add up to 10 photos and videos');
      return;
    }
    const accepted = [];
    for (const file of picked) {
      const kind = mediaKindForFile(file);
      if (!kind) {
        toast.error(`${file.name} is not a photo or video`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name} is too large`);
        continue;
      }
      accepted.push({ file, mediaType: kind });
    }
    const batch = accepted.slice(0, room);
    if (accepted.length > room) toast.error('You can add up to 10 photos and videos');
    queueUploads(batch);
  };

  const uploadMedia = (kind, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    queueUploads(files.map((file) => ({ file, mediaType: kind.type })));
  };

  const updateMediaItem = (mediaId, patch) => {
    setMedia((prev) => prev.map((item) => (item.media_id === mediaId ? { ...item, ...patch } : item)));
  };

  const removeMediaItem = (item) => {
    setMedia((prev) => prev.filter((row) => row.media_id !== item.media_id));
    if (item.media_url && item.media_url === heroImageUrl) setHeroImageUrl(null);
    setCarouselOpen(false);
    setAdjusting(false);
    setMediaIndex(0);
  };

  const openMedia = (item) => {
    const index = readyMedia.findIndex((row) => row.media_id === item.media_id);
    setMediaIndex(index < 0 ? 0 : index);
    setAdjusting(false);
    setCarouselOpen(true);
  };

  const hasLocation = place.placeLat != null && place.placeLng != null;
  const visualCount = media.filter(isVisualMedia).length;
  const linkCount = filledCount(resources);
  const questionCount = filledCount(questions);
  const noteWords = countFieldNoteWords(fieldNotes);

  const whenStatus = (() => {
    if (!hasLocation) return 'Add a location';
    const parts = [observedOn, observedTime, place.placeName || pinName].filter(Boolean);
    return parts.join(' · ') || 'Location set';
  })();
  const mediaStatus = `${visualCount}/10 items selected`;
  const topicStatus = selectedPhenomena.length
    ? `${selectedPhenomena.length} ${selectedPhenomena.length === 1 ? 'phenomenon' : 'phenomena'} selected`
    : 'You need to select a phenomenon';
  const notesStatus = `${noteWords}/250 words`;
  const otherStatus = (() => {
    if (!linkCount && !questionCount) return 'Add links or questions';
    const bits = [];
    if (linkCount) bits.push(`${linkCount} ${linkCount === 1 ? 'link' : 'links'}`);
    if (questionCount) bits.push(`${questionCount} ${questionCount === 1 ? 'question' : 'questions'}`);
    return bits.join(', ');
  })();

  const drawers = [
    { id: 'when', label: 'Date Time Location', status: whenStatus },
    { id: 'media', label: 'Media', status: mediaStatus },
    { id: 'topics', label: 'Scientific Fields & Phenomenon Tags', status: topicStatus },
    { id: 'notes', label: 'Field Notes', status: notesStatus },
    { id: 'other', label: 'Other', status: otherStatus },
  ];

  const trimmedTitle = title.trim();
  const editing = pageTitle.startsWith('Edit');
  const formTitle = trimmedTitle
    ? `${editing ? 'Edit' : 'Create'} ${trimmedTitle}`
    : `${editing ? 'Edit' : 'Create'} a pebble`;

  const saveMeta = isPublished
    ? null
    : saveState === 'saving'
      ? 'Saving…'
      : savedAt
        ? formatSavedStamp(savedAt)
        : null;

  const mediaName = (item) => item.filename || item.media_type || 'File';

  const renderWhen = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">{whenStatus}</p>
      <div className="grid min-w-0 grid-cols-2 gap-2">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-sm text-muted">Date</span>
          <input
            type="date"
            value={observedOn}
            onChange={(e) => editObservation(setObservedOn)(e.target.value)}
            className={`${inputClass} min-w-0 max-w-full appearance-none`}
          />
        </label>
        <div className="min-w-0">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-sm text-muted">Time</span>
            <input
              type="time"
              lang="en-GB"
              step={60}
              min="00:00"
              max="23:59"
              value={observedTime}
              onChange={(e) => editObservation(setObservedTime)(e.target.value)}
              className={`${inputClass} min-w-0 max-w-full appearance-none`}
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
    </div>
  );

  const renderMedia = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">{mediaStatus}</p>
      <div className="flex max-w-full flex-wrap gap-2">
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
              aria-label={kind.label}
              className="sr-only"
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                e.target.value = '';
                uploadMedia(kind, picked);
              }}
            />
          </label>
        ))}
      </div>
      <div data-testid="pebble-form-media">
      <div className="grid w-full min-w-0 grid-cols-3 gap-2">
        {media.map((item) => {
          const name = mediaName(item);
          return (
            <div key={item.media_id} className="relative h-24 min-w-0">
              {item.pending ? (
                <div
                  aria-busy="true"
                  className="flex h-full w-full items-center justify-center rounded-xl border border-border bg-surface p-2 text-center text-xs text-muted"
                >
                  Loading media
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Open ${name}`}
                  className="relative h-full w-full min-w-0 overflow-hidden rounded-xl border border-border bg-surface"
                  onClick={() => openMedia(item)}
                >
                  <MediaFrame item={item} />
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink"
                onClick={() => removeMediaItem(item)}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <label className="flex h-24 min-w-0 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-surface text-ink">
          <PlusIcon className="h-6 w-6" />
          <input
            ref={libraryInputRef}
            type="file"
            accept={LIBRARY_ACCEPT}
            multiple
            aria-label="Photos & videos"
            className="sr-only"
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              e.target.value = '';
              uploadLibrary(picked);
            }}
          />
        </label>
      </div>
      </div>
    </div>
  );

  const renderTopics = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">{topicStatus}</p>
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
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">{notesStatus}</p>
      <div>
        <span className="mb-1.5 block text-sm text-muted">Field notes</span>
        <FieldNotesEditor value={fieldNotes} onChange={setFieldNotes} />
      </div>
    </div>
  );

  const renderOther = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">{otherStatus}</p>
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
    </div>
  );

  const drawerBody = {
    when: renderWhen,
    media: renderMedia,
    topics: renderTopics,
    notes: renderNotes,
    other: renderOther,
  };

  return (
    <FormModal
      stacked
      meta={saveMeta}
      title={formTitle}
      onBack={handleChromeBack}
      onSubmit={handleSubmit}
      actions={renderActions()}
    >
      {activeDrawer ? (
        drawerBody[activeDrawer]()
      ) : (
        <div className="space-y-4">
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
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">Private</span>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              aria-label="Private"
              onClick={() => setIsPrivate((value) => !value)}
              className={`relative h-6 w-11 shrink-0 rounded-full ${isPrivate ? 'bg-accent' : 'bg-border'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white ${
                  isPrivate ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          <div className="space-y-2">
            {drawers.map((drawer) => (
              <button
                key={drawer.id}
                type="button"
                onClick={() => setActiveDrawer(drawer.id)}
                className="flex w-full flex-col items-start rounded-2xl border border-border px-3 py-3 text-left"
              >
                <span className="text-sm font-medium text-ink">{drawer.label}</span>
                <span className="text-sm text-muted">{drawer.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {carouselOpen && activeMedia ? (
        <Modal open title="Media" testId="media-editor" onClose={() => setCarouselOpen(false)}>
          <div className="space-y-3">
            <MediaCarousel
              items={readyMedia}
              index={safeMediaIndex}
              onIndexChange={setMediaIndex}
              controls
              adjusting={adjusting}
              onAdjust={(patch) => updateMediaItem(activeMedia.media_id, patch)}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Title</span>
              <input
                aria-label="Title"
                value={activeMedia.title || ''}
                placeholder="Title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={(e) => updateMediaItem(activeMedia.media_id, { title: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Caption</span>
              <input
                aria-label="Caption"
                value={activeMedia.caption || ''}
                placeholder="Caption"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={(e) => updateMediaItem(activeMedia.media_id, { caption: e.target.value })}
                className={inputClass}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {activeMedia.media_type === 'image' ? (
                <button
                  type="button"
                  aria-pressed={heroImageUrl === activeMedia.media_url}
                  onClick={() => setHeroImageUrl(activeMedia.media_url)}
                  className={`rounded-2xl px-3 py-1.5 text-sm ${
                    heroImageUrl === activeMedia.media_url
                      ? 'bg-accent text-white'
                      : 'border border-border text-ink'
                  }`}
                >
                  Featured image
                </button>
              ) : null}
              <button
                type="button"
                aria-pressed={adjusting}
                onClick={() => setAdjusting((open) => !open)}
                className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
              >
                Adjust preview
              </button>
              {adjusting ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      updateMediaItem(activeMedia.media_id, {
                        preview_scale: Math.max(1, Number(activeMedia.preview_scale || 1) - 0.25),
                      })
                    }
                    className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
                  >
                    Zoom out
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateMediaItem(activeMedia.media_id, {
                        preview_scale: Math.min(3, Number(activeMedia.preview_scale || 1) + 0.25),
                      })
                    }
                    className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
                  >
                    Zoom in
                  </button>
                </>
              ) : null}
              <button
                type="button"
                aria-label={`Remove ${mediaName(activeMedia)}`}
                className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
                onClick={() => removeMediaItem(activeMedia)}
              >
                Remove
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </FormModal>
  );
};

export default PebbleForm;

