const KEY = 'pebble-screen-return';

export const rememberScreen = () => {
  if (typeof window === 'undefined') return;
  const pane = document.querySelector('[data-testid="content-pane"]');
  const feed = document.querySelector('[data-testid="map-feed-list"]');
  const snapshot = {
    path: `${window.location.pathname}${window.location.search}`,
    pane: pane?.scrollTop || 0,
    feed: feed?.scrollTop || 0,
  };
  window.sessionStorage.setItem(KEY, JSON.stringify(snapshot));
};

export const restoreScreen = () => {
  if (typeof window === 'undefined') return;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return;
  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch {
    return;
  }
  if (snapshot?.path !== `${window.location.pathname}${window.location.search}`) return;
  const apply = () => {
    const pane = document.querySelector('[data-testid="content-pane"]');
    const feed = document.querySelector('[data-testid="map-feed-list"]');
    if (pane && snapshot.pane) pane.scrollTop = snapshot.pane;
    if (feed && snapshot.feed) feed.scrollTop = snapshot.feed;
  };
  apply();
  window.requestAnimationFrame(apply);
  window.setTimeout(apply, 50);
};
