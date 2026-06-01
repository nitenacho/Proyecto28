/* Proyecto28 freshness worker
   Keeps proyecto28.com navigations network-first even when the edge/browser
   applies the default GitHub Pages max-age header. */

const P28_SW_VERSION = 'v0.25.2-20260601-fresh-nav-popup-image';
const P28_CMS_HOST = 'honest-candy-800d1e4a92.strapiapp.com';

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

function freshCMS(request) {
  const url = new URL(request.url);
  url.searchParams.set('_p28sw', `${Date.now()}`);
  return fetch(url.toString(), {
    cache: 'no-store',
    credentials: 'omit',
    mode: 'cors',
    headers: { accept: 'application/json' },
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(freshNavigation(request));
    return;
  }

  if (url.hostname === P28_CMS_HOST && url.pathname.startsWith('/api/')) {
    event.respondWith(freshCMS(request));
  }
});
