import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../Modal/Modal';
import UserAvatar from './UserAvatar';
import { fetchFollowers, fetchFollowing } from '../../helpers/userHelpers';

const UserListModal = ({ username, mode, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const title = mode === 'following' ? 'Following' : 'Followers';

  useEffect(() => {
    let active = true;
    setLoading(true);
    const loader = mode === 'following' ? fetchFollowing : fetchFollowers;
    loader(username)
      .then((rows) => {
        if (active) setUsers(rows);
      })
      .catch((err) => toast.error(err.message || `Could not load ${title.toLowerCase()}`))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [username, mode, title]);

  return (
    <Modal open onClose={onClose} title={title} testId="user-list-modal">
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted">No users yet.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {users.map((user) => (
            <li key={user.user_id}>
              <Link
                to={`/u/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 hover:border-pebble"
              >
                <UserAvatar user={user} className="h-9 w-9 rounded-full" emojiClassName="text-base" />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {user.display_name || user.username}
                  </span>
                  <span className="block text-xs text-muted">@{user.username}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default UserListModal;
