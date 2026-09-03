import React, { useEffect, useState } from 'react';
import {
  getDefaultAvatarColorClass,
  getDefaultAvatarEmoji,
} from '../../helpers/avatarHelpers';

const UserAvatar = ({
  user,
  className = 'h-10 w-10 rounded-full',
  emojiClassName = 'text-xl',
  alt,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [user?.profile_pic_url]);

  const url = user?.profile_pic_url;
  const userId = user?.user_id;
  const emoji = getDefaultAvatarEmoji(userId);
  const colorClass = getDefaultAvatarColorClass(userId);
  const label = alt || user?.display_name || user?.username || 'User avatar';

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={label}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} ${colorClass} flex items-center justify-center select-none`}
      data-testid="user-avatar-default"
      aria-label={label}
    >
      <span role="img" aria-hidden="true" className={emojiClassName}>
        {emoji}
      </span>
    </div>
  );
};

export default UserAvatar;
