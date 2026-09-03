import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserAvatar from '../components/Profile/UserAvatar';
import { formatRelativeTime } from '../helpers/timeHelpers';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../helpers/notificationHelpers';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      toast.error(err.message || 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
          <p className="text-sm text-muted">Follows and likes on your pebbles.</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await markAllNotificationsRead();
              await load();
            } catch (err) {
              toast.error(err.message || 'Could not update notifications');
            }
          }}
          className="rounded-2xl border border-border px-3 py-2 text-sm text-ink hover:border-pebble"
        >
          Mark all read
        </button>
      </div>
      {loading ? (
        <p className="px-2 text-sm text-muted">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="px-2 text-sm text-muted">No notifications yet.</p>
      ) : (
        <ul className="border-t border-border">
          {notifications.map((item) => {
            const actor = {
              user_id: item.actor_id,
              username: item.actor_username,
              display_name: item.actor_display_name,
              profile_pic_url: item.actor_profile_pic_url,
            };
            const unread = !item.read_at;
            const message =
              item.type === 'follow'
                ? 'followed you'
                : `liked your pebble${item.pebble_title ? ` “${item.pebble_title}”` : ''}`;
            return (
              <li key={item.notification_id}>
                <button
                  type="button"
                  className={`flex w-full items-start gap-3 border-b border-border px-2 py-4 text-left ${
                    unread ? 'bg-background' : ''
                  }`}
                  onClick={async () => {
                    try {
                      if (unread) {
                        await markNotificationRead(item.notification_id);
                        setNotifications((prev) =>
                          prev.map((row) =>
                            row.notification_id === item.notification_id
                              ? { ...row, read_at: new Date().toISOString() }
                              : row
                          )
                        );
                      }
                    } catch {
                      // ignore mark-read failures for navigation
                    }
                  }}
                >
                  <UserAvatar user={actor} className="h-10 w-10 rounded-full" emojiClassName="text-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">
                      <Link
                        to={`/u/${item.actor_username}`}
                        className="font-semibold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.actor_display_name || item.actor_username}
                      </Link>{' '}
                      {message}
                      {item.type === 'like' && item.pebble_id ? (
                        <>
                          {' '}
                          <Link
                            to={`/pebbles/${item.pebble_id}`}
                            className="text-accent hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </Link>
                        </>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
