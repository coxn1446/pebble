import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import PebbleCard from '../components/Pebbles/PebbleCard';
import FlagDialog from '../components/Moderation/FlagDialog';
import UserAvatar from '../components/Profile/UserAvatar';
import UserListModal from '../components/Profile/UserListModal';
import { selectUser } from '../store/auth.reducer';
import { fetchUserProfile } from '../helpers/userHelpers';
import { blockUser, followUser, unfollowUser } from '../helpers/socialHelpers';

const Profile = () => {
  const { username: paramUsername } = useParams();
  const me = useSelector(selectUser);
  const username = paramUsername || me?.username;
  const [profile, setProfile] = useState(null);
  const [pebbles, setPebbles] = useState([]);
  const [showFlag, setShowFlag] = useState(false);
  const [listMode, setListMode] = useState(null);

  const load = async () => {
    if (!username) return;
    try {
      const data = await fetchUserProfile(username);
      setProfile(data.user);
      setPebbles(data.pebbles || []);
    } catch (err) {
      toast.error(err.message || 'Profile not found');
    }
  };

  useEffect(() => {
    setProfile(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (!username) return <p className="text-sm text-muted">Loading…</p>;
  if (!profile) return <p className="text-sm text-muted">Loading…</p>;

  const isSelf = me?.user_id === profile.user_id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <UserAvatar
            user={profile}
            className="h-16 w-16 rounded-full"
            emojiClassName="text-3xl"
          />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-muted">@{profile.username}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink">
              <button
                type="button"
                onClick={() => setListMode('followers')}
                className="hover:underline"
              >
                <span className="font-semibold">{profile.follower_count ?? 0}</span>{' '}
                <span className="text-muted">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => setListMode('following')}
                className="hover:underline"
              >
                <span className="font-semibold">{profile.following_count ?? 0}</span>{' '}
                <span className="text-muted">Following</span>
              </button>
            </div>
            {profile.profession ? <p className="mt-2 text-sm text-ink">{profile.profession}</p> : null}
            {profile.field_of_study ? (
              <p className="text-sm text-muted">{profile.field_of_study}</p>
            ) : null}
            {profile.place_name ? <p className="text-sm text-muted">{profile.place_name}</p> : null}
            {profile.employer ? (
              <p className="text-sm text-muted">Employer: {profile.employer.name}</p>
            ) : null}
          </div>
        </div>
        {!isSelf ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  if (profile.is_following) {
                    await unfollowUser(profile.user_id);
                  } else {
                    await followUser(profile.user_id);
                  }
                  load();
                } catch (err) {
                  toast.error(err.message);
                }
              }}
              className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover"
            >
              {profile.is_following ? 'Unfollow' : 'Follow'}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await blockUser(profile.user_id);
                  toast.success('User blocked');
                } catch (err) {
                  toast.error(err.message);
                }
              }}
              className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
            >
              Block
            </button>
            <button
              type="button"
              onClick={() => setShowFlag(true)}
              className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
            >
              Report
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              to="/pebbles/new"
              className="rounded-2xl bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              New pebble
            </Link>
            <Link
              to="/collections"
              className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
            >
              Collections
            </Link>
            <Link
              to="/settings"
              className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
            >
              Edit profile
            </Link>
          </div>
        )}
      </div>
      <div className="space-y-0 border-t border-border">
        {pebbles.map((pebble) => (
          <PebbleCard
            key={pebble.pebble_id}
            pebble={pebble}
            onChange={(next) =>
              setPebbles((prev) => prev.map((p) => (p.pebble_id === next.pebble_id ? next : p)))
            }
          />
        ))}
      </div>
      {showFlag ? (
        <FlagDialog
          targetType="user"
          targetId={profile.user_id}
          onClose={() => setShowFlag(false)}
        />
      ) : null}
      {listMode ? (
        <UserListModal
          username={profile.username}
          mode={listMode}
          onClose={() => setListMode(null)}
        />
      ) : null}
    </div>
  );
};

export default Profile;
