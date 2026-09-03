const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const fetchNotifications = async () => {
  const res = await fetch('/api/notifications', { credentials: 'include' });
  return parseJson(res);
};

export const markNotificationRead = async (id) => {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.notification;
};

export const markAllNotificationsRead = async () => {
  const res = await fetch('/api/notifications/read-all', {
    method: 'POST',
    credentials: 'include',
  });
  return parseJson(res);
};

export const fetchNotificationPreferences = async () => {
  const res = await fetch('/api/notifications/preferences', { credentials: 'include' });
  const data = await parseJson(res);
  return data.preferences;
};

export const updateNotificationPreferences = async (payload) => {
  const res = await fetch('/api/notifications/preferences', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data.preferences;
};
