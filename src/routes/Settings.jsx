import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FormModal, { formPrimaryClass } from '../components/Modal/FormModal';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import PlaceAutocomplete from '../components/Places/PlaceAutocomplete';
import UserAvatar from '../components/Profile/UserAvatar';
import { setUser } from '../store/auth.reducer';
import { fetchMe, updateMe } from '../helpers/userHelpers';
import { searchOrganizations } from '../helpers/organizationHelpers';
import { uploadFile } from '../helpers/uploadHelpers';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../helpers/notificationHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-accent';

const Settings = ({ onBack, onSaved }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);
  const [orgQuery, setOrgQuery] = useState('');
  const [orgResults, setOrgResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [notifyOnFollow, setNotifyOnFollow] = useState(true);
  const [notifyOnLike, setNotifyOnLike] = useState(true);

  useEffect(() => {
    Promise.all([fetchMe(), fetchNotificationPreferences().catch(() => null)])
      .then(([user, preferences]) => {
        setPreviewUser(user);
        setForm({
          displayName: user.display_name || '',
          blurb: user.blurb || '',
          username: user.username || '',
          profession: user.profession || '',
          fieldOfStudy: user.field_of_study || '',
          employerOrgId: user.employer_org_id || null,
          employerName: user.employer?.name || '',
          contentSearchable: user.content_searchable !== false,
          profilePicUrl: user.profile_pic_url || null,
          place: {
            placeId: user.place_id,
            placeName: user.place_name || '',
            placeLat: user.place_lat,
            placeLng: user.place_lng,
            placeLocality: user.place_locality || null,
            placeAdminArea: user.place_admin_area || null,
            placeCountry: user.place_country || null,
          },
        });
        if (preferences) {
          setNotifyOnFollow(preferences.notify_on_follow !== false);
          setNotifyOnLike(preferences.notify_on_like !== false);
        }
        dispatch(setUser(user));
      })
      .catch((err) => toast.error(err.message));
  }, [dispatch]);

  useEffect(() => {
    const linked = searchParams.get('linked');
    if (linked === 'google') toast.success('Google connected');
    if (linked === 'apple') toast.success('Apple connected');
    if (searchParams.get('error') === 'conflict') {
      toast.error('That account is already linked to someone else');
    }
  }, [searchParams]);

  if (!form) return <p className="text-sm text-muted">Loading…</p>;

  const avatarPreview = {
    ...(previewUser || {}),
    user_id: previewUser?.user_id,
    profile_pic_url: form.profilePicUrl,
    display_name: form.displayName,
    username: form.username,
  };

  return (
    <FormModal
      title="Edit profile"
      testId="edit-profile-modal"
      onBack={onBack || (() => navigate('/profile'))}
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          const user = await updateMe({
            displayName: form.displayName,
            blurb: form.blurb,
            username: form.username,
            profession: form.profession,
            fieldOfStudy: form.fieldOfStudy,
            employerOrgId: form.employerOrgId,
            contentSearchable: form.contentSearchable,
            profilePicUrl: form.profilePicUrl,
            placeId: form.place.placeId,
            placeName: form.place.placeName,
            placeLat: form.place.placeLat,
            placeLng: form.place.placeLng,
            placeLocality: form.place.placeLocality,
            placeAdminArea: form.place.placeAdminArea,
            placeCountry: form.place.placeCountry,
          });
          await updateNotificationPreferences({
            notifyOnFollow,
            notifyOnLike,
          });
          dispatch(setUser(user));
          setPreviewUser(user);
          toast.success('Profile updated');
          onSaved?.();
        } catch (err) {
          toast.error(err.message);
        } finally {
          setSaving(false);
        }
      }}
      actions={
        <button type="submit" disabled={saving || uploadingPic} className={formPrimaryClass}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      }
    >
      <div className="space-y-4">
      <div className="flex items-center gap-4">
        <UserAvatar
          user={avatarPreview}
          className="h-16 w-16 rounded-full"
        />
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Profile picture</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploadingPic}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingPic(true);
                try {
                  const media = await uploadFile(file, 'image');
                  setForm({ ...form, profilePicUrl: media.media_url });
                  toast.success('Photo uploaded — save to apply');
                } catch (err) {
                  toast.error(err.message || 'Upload failed');
                } finally {
                  setUploadingPic(false);
                  e.target.value = '';
                }
              }}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-2xl file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
          </label>
          {form.profilePicUrl ? (
            <button
              type="button"
              className="text-xs text-muted hover:text-ink"
              onClick={() => setForm({ ...form, profilePicUrl: null })}
            >
              Use penguin avatar
            </button>
          ) : null}
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Display name</span>
        <input
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Blurb</span>
        <textarea
          value={form.blurb}
          onChange={(e) => setForm({ ...form, blurb: e.target.value })}
          maxLength={500}
          rows={4}
          className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-accent"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Username</span>
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Profession</span>
        <input
          value={form.profession}
          onChange={(e) => setForm({ ...form, profession: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Field of study</span>
        <input
          value={form.fieldOfStudy}
          onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
          className={inputClass}
        />
      </label>
      <PlaceAutocomplete
        value={form.place}
        onChange={(place) => setForm({ ...form, place })}
      />
      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Employer organization</span>
          <input
            value={orgQuery}
            onChange={async (e) => {
              const q = e.target.value;
              setOrgQuery(q);
              if (q.trim().length < 2) {
                setOrgResults([]);
                return;
              }
              try {
                setOrgResults(await searchOrganizations(q.trim()));
              } catch {
                setOrgResults([]);
              }
            }}
            placeholder={form.employerName || 'Search organizations'}
            className={inputClass}
          />
        </label>
        {orgResults.length ? (
          <div className="mt-2 space-y-1">
            {orgResults.map((org) => (
              <button
                key={org.organization_id}
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    employerOrgId: org.organization_id,
                    employerName: org.name,
                  });
                  setOrgQuery(org.name);
                  setOrgResults([]);
                }}
                className="block w-full rounded-xl border border-border px-3 py-2 text-left text-sm hover:border-pebble"
              >
                {org.name}
              </button>
            ))}
          </div>
        ) : null}
        {form.employerOrgId ? (
          <button
            type="button"
            className="mt-2 text-xs text-muted hover:text-ink"
            onClick={() => {
              setOrgQuery('');
              setForm({ ...form, employerOrgId: null, employerName: '' });
            }}
          >
            Clear employer
          </button>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={form.contentSearchable}
          onChange={(e) => setForm({ ...form, contentSearchable: e.target.checked })}
        />
        Allow my content to appear in search
      </label>

      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-semibold text-ink">Sign in</h2>
        <div className="flex items-center justify-between text-sm text-ink">
          <span>Password</span>
          <span className="text-muted">{previewUser?.has_password ? 'Connected' : 'Not connected'}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-ink">
          <span>Google</span>
          {previewUser?.google_id ? (
            <span className="text-muted">Connected</span>
          ) : (
            <a
              href="/api/auth/google?link=1&return=/settings"
              aria-label="Connect Google"
              className="font-medium text-ocean hover:underline"
            >
              Connect
            </a>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-ink">
          <span>Apple</span>
          {previewUser?.apple_id ? (
            <span className="text-muted">Connected</span>
          ) : (
            <a
              href="/api/auth/apple?link=1&return=/settings"
              aria-label="Connect Apple"
              className="font-medium text-ocean hover:underline"
            >
              Connect
            </a>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-semibold text-ink">Notifications</h2>
        <p className="text-sm text-muted">Choose which in-app alerts you receive.</p>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={notifyOnFollow}
            onChange={(e) => setNotifyOnFollow(e.target.checked)}
          />
          Notify me when someone follows me
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={notifyOnLike}
            onChange={(e) => setNotifyOnLike(e.target.checked)}
          />
          Notify me when someone likes my pebble
        </label>
      </div>
      </div>
    </FormModal>
  );
};

export default Settings;
