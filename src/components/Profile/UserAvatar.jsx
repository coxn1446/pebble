import React, { useEffect, useState } from 'react';
import { getDefaultAvatarColorClass } from '../../helpers/avatarHelpers';
import { PenguinIcon } from '../Icons/Icons';

const UserAvatar = ({
  user,
  className = 'h-10 w-10 rounded-full',
  alt,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [user?.profile_pic_url]);

  const url = user?.profile_pic_url;
  const colorClass = getDefaultAvatarColorClass(user?.user_id);
  const label = alt || user?.display_name || user?.username || 'User avatar';

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={label}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} ${colorClass} flex items-center justify-center overflow-hidden rounded-full select-none`}
      data-testid="user-avatar-default"
      aria-label={label}
    >
      <PenguinIcon className="h-4/5 w-4/5" />
    </div>
  );
};

export default UserAvatar;
