const ensurePreferences = `
  INSERT INTO notification_preferences (user_id)
  VALUES ($1)
  ON CONFLICT (user_id) DO NOTHING
`;

const getPreferences = `
  SELECT user_id, notify_on_follow, notify_on_like, created_at, updated_at
  FROM notification_preferences
  WHERE user_id = $1
`;

const updatePreferences = `
  UPDATE notification_preferences
  SET
    notify_on_follow = COALESCE($2, notify_on_follow),
    notify_on_like = COALESCE($3, notify_on_like),
    updated_at = NOW()
  WHERE user_id = $1
  RETURNING user_id, notify_on_follow, notify_on_like, created_at, updated_at
`;

const insert = `
  INSERT INTO notifications (recipient_id, actor_id, type, pebble_id)
  VALUES ($1, $2, $3, $4)
  RETURNING notification_id, recipient_id, actor_id, type, pebble_id, read_at, created_at
`;

const listForUser = `
  SELECT
    n.notification_id,
    n.recipient_id,
    n.actor_id,
    n.type,
    n.pebble_id,
    n.read_at,
    n.created_at,
    u.username AS actor_username,
    u.display_name AS actor_display_name,
    u.profile_pic_url AS actor_profile_pic_url,
    p.title AS pebble_title
  FROM notifications n
  JOIN users u ON u.user_id = n.actor_id
  LEFT JOIN pebbles p ON p.pebble_id = n.pebble_id
  WHERE n.recipient_id = $1
  ORDER BY n.created_at DESC
  LIMIT 50
`;

const markRead = `
  UPDATE notifications
  SET read_at = NOW()
  WHERE notification_id = $1 AND recipient_id = $2 AND read_at IS NULL
  RETURNING notification_id, recipient_id, actor_id, type, pebble_id, read_at, created_at
`;

const markAllRead = `
  UPDATE notifications
  SET read_at = NOW()
  WHERE recipient_id = $1 AND read_at IS NULL
`;

const unreadCount = `
  SELECT COUNT(*)::int AS count
  FROM notifications
  WHERE recipient_id = $1 AND read_at IS NULL
`;

module.exports = {
  ensurePreferences,
  getPreferences,
  updatePreferences,
  insert,
  listForUser,
  markRead,
  markAllRead,
  unreadCount,
};
