/* Proyecto28 freshness worker
   Keeps proyecto28.com navigations network-first even when the edge/browser
   applies the default GitHub Pages max-age header. */

const P28_SW_VERSION = 'v0.26.0-20260602-floor-ascension';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('p28-') && key !== `p28-${P28_SW_VERSION}`)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function withFreshParam(rawURL, key) {
  const url = new URL(rawURL);
  url.searchParams.set(key, `${P28_SW_VERSION}-${Date.now()}`);
  return url.toString();
}

async function freshNavigation(request) {
  try {
    const freshURL = withFreshParam(request.url, 'p28sw');
    const response = await fetch(freshURL, {
      cache: 'reload',
      credentials: 'same-origin',
      redirect: 'follow',
    });
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    return fetch(request);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(freshNavigation(request));
  }
});
