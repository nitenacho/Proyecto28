/* =========================================================
   PROYECTO 28 — Pixel Streaming iframe shell
   Minimal first cut: load an iframe when a valid stream URL exists,
   otherwise render the project media fallback without touching WebRTC.
   ========================================================= */

const FRAME_ALLOW = [
  'autoplay',
  'fullscreen',
  'gamepad',
  'clipboard-read',
  'clipboard-write',
].join('; ');

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'text') node.textContent = value;
    else if (value === false || value == null) continue;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function resolveHttpURL(value, { allowRelative = false } = {}) {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim();
  if (!allowRelative && !/^https?:\/\//i.test(raw)) return null;
  try {
    const url = new URL(raw, window.location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

function streamURLForProject(project, streaming) {
  if (!streaming?.enabled || !project?.unrealEnabled) return null;
  return resolveHttpURL(project.unrealStreamURL);
}

function buildFallbackMedia(project) {
  const videoURL = resolveHttpURL(project?.videoLoopURL, { allowRelative: true });
  if (videoURL) {
    const video = el('video', {
      className: 'stream-fallback-video',
      src: videoURL,
      muted: true,
      playsinline: true,
      autoplay: true,
      loop: true,
    });
    video.muted = true;
    video.playsInline = true;
    return video;
  }

  const imageURL = resolveHttpURL(project?.popupImageURL || project?.imageURL, { allowRelative: true });
  if (imageURL) {
    return el('img', {
      className: 'stream-fallback-image',
      src: imageURL,
      alt: project?.title || '',
      loading: 'lazy',
      decoding: 'async',
    });
  }

  return el('div', { className: 'stream-fallback-empty', 'aria-hidden': 'true' }, [
    el('span', { text: project?.id || '028' }),
  ]);
}

function fallbackStatus(project, streaming) {
  if (!streaming?.enabled) return 'Standby';
  if (!project?.unrealEnabled) return 'Offline';
  if (!project?.unrealStreamURL) return 'Sin URL';
  return 'Fallback';
}

export function createPixelStreamFrame({ root }) {
  const headId = el('span', { className: 'stream-head-id', text: '028' });
  const headStatus = el('span', { className: 'stream-head-status', text: 'Standby' });
  const title = el('div', { className: 'stream-title', text: 'Pixel Streaming' });
  const subtitle = el('div', { className: 'stream-subtitle', text: 'Unreal Engine' });
  const media = el('div', { className: 'stream-fallback-media' });

  const frame = el('iframe', {
    className: 'stream-frame',
    title: 'Pixel Streaming',
    allow: FRAME_ALLOW,
    referrerpolicy: 'strict-origin-when-cross-origin',
    hidden: true,
  });

  const fallback = el('div', { className: 'stream-fallback' }, [
    media,
    el('div', { className: 'stream-fallback-copy' }, [title, subtitle]),
  ]);

  root.classList.add('stream-overlay');
  root.dataset.interactive = 'false';
  root.dataset.state = 'fallback';
  root.replaceChildren(
    el('div', { className: 'stream-card' }, [
      el('div', { className: 'stream-head' }, [
        el('span', { className: 'stream-live-dot', 'aria-hidden': 'true' }),
        headId,
        headStatus,
      ]),
      el('div', { className: 'stream-stage' }, [frame, fallback]),
    ]),
  );

  let currentProject = null;
  let currentStreaming = null;
  let currentSrc = '';
  let loadTimer = null;

  function clearLoadTimer() {
    if (loadTimer) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
  }

  function showFallback(status = 'Fallback') {
    clearLoadTimer();
    root.classList.remove('is-loading');
    root.dataset.state = 'fallback';
    root.dataset.interactive = 'false';
    headStatus.textContent = status;
    frame.hidden = true;
    fallback.hidden = false;
  }

  function postProjectCommand() {
    if (!currentSrc || !frame.contentWindow || !currentProject) return;
    const payload = {
      command: 'showProject',
      projectId: currentProject.id,
      unrealLevelName: currentProject.unrealLevelName || null,
      mode: currentStreaming?.mode || 'shared',
    };
    frame.contentWindow.postMessage(payload, '*');
    frame.contentWindow.postMessage({ type: 'p28:pixel-stream', payload }, '*');
  }

  frame.addEventListener('load', () => {
    clearLoadTimer();
    root.classList.remove('is-loading');
    if (currentSrc && streamURLForProject(currentProject, currentStreaming)) {
      root.dataset.state = 'stream';
      root.dataset.interactive = 'true';
      headStatus.textContent = 'Live';
      frame.hidden = false;
      fallback.hidden = true;
    }
    postProjectCommand();
  });
  frame.addEventListener('error', () => showFallback('Sin respuesta'));

  function setProject({ project, streaming }) {
    currentProject = project || null;
    currentStreaming = streaming || { enabled: false, mode: 'shared' };

    if (!currentProject) {
      clear();
      return;
    }

    const streamURL = streamURLForProject(currentProject, currentStreaming);
    const hasStream = !!streamURL;

    headId.textContent = currentProject.id || '028';
    headStatus.textContent = hasStream ? 'Live' : fallbackStatus(currentProject, currentStreaming);
    title.textContent = currentProject.title || 'Proyecto 28';
    subtitle.textContent = currentProject.unrealLevelName || currentProject.id || 'Unreal Engine';
    frame.title = `Pixel Streaming — ${currentProject.title || currentProject.id || 'Proyecto 28'}`;
    media.replaceChildren(buildFallbackMedia(currentProject));

    root.dataset.state = hasStream ? 'stream' : 'fallback';
    root.dataset.interactive = hasStream ? 'true' : 'false';
    frame.hidden = !hasStream;
    fallback.hidden = hasStream;

    if (!hasStream) {
      if (currentSrc) frame.removeAttribute('src');
      currentSrc = '';
      showFallback(fallbackStatus(currentProject, currentStreaming));
      return;
    }

    if (streamURL !== currentSrc) {
      currentSrc = streamURL;
      root.classList.add('is-loading');
      frame.src = streamURL;
      clearLoadTimer();
      loadTimer = setTimeout(() => showFallback('Sin respuesta'), 12000);
    } else {
      postProjectCommand();
    }
  }

  function clear() {
    clearLoadTimer();
    currentProject = null;
    currentStreaming = null;
    currentSrc = '';
    frame.removeAttribute('src');
    frame.hidden = true;
    fallback.hidden = false;
    media.replaceChildren();
    root.dataset.state = 'fallback';
    root.dataset.interactive = 'false';
    root.classList.remove('is-loading');
  }

  return {
    setProject,
    clear,
    postProjectCommand,
    get currentSrc() { return currentSrc; },
  };
}
