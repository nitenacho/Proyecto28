/* =========================================================
   PROYECTO 28 — lazy Pixel Streaming overlay
   Keeps the WebRTC/iframe preview chunk out of the initial
   route until streaming or preview is actually needed.
   ========================================================= */

function normalizeStreamingConfig(streaming = {}) {
  const mode = streaming.mode === 'per-cube' || streaming.mode === 'dedicated'
    ? 'per-cube'
    : 'shared';
  return {
    enabled: !!streaming.enabled,
    previewEnabled: !!streaming.previewEnabled,
    mode,
  };
}

function resolveProject(tile, overrides = null) {
  if (!tile?.userData?.isProject) return null;
  const project = tile.userData.project || null;
  return project && overrides ? { ...project, ...overrides } : project;
}

function hasValidStream(project, streaming) {
  if (!streaming.enabled || !project?.unrealEnabled || !project?.unrealStreamURL) return false;
  return /^https?:\/\//i.test(String(project.unrealStreamURL).trim());
}

export function createLazyStreamOverlay({ site, camera }) {
  let overlay = null;
  let loading = null;
  let streaming = normalizeStreamingConfig(site?.streaming);
  let activeTile = null;
  let previewOverrides = null;
  let activeProject = null;

  function shouldMount(tile, overrides = null) {
    const project = resolveProject(tile, overrides);
    if (!project) return false;
    return streaming.previewEnabled || hasValidStream(project, streaming);
  }

  async function ensureOverlay() {
    if (overlay) return overlay;
    if (!loading) {
      loading = import('./streamOverlay.js')
        .then((mod) => {
          overlay = mod.createStreamOverlay({ site: { streaming }, camera });
          overlay.setStreamingConfig(streaming);
          return overlay;
        })
        .catch((err) => {
          loading = null;
          console.warn('[p28 stream] lazy overlay load failed:', err.message);
          throw err;
        });
    }
    return loading;
  }

  function clearLoadedOverlay() {
    activeProject = null;
    if (overlay) overlay.setActiveTile(null);
  }

  function applyTile(tile, overrides = null) {
    activeTile = tile?.userData?.isProject ? tile : null;
    previewOverrides = overrides;
    activeProject = resolveProject(activeTile, previewOverrides);

    if (!activeTile || !shouldMount(activeTile, previewOverrides)) {
      clearLoadedOverlay();
      return;
    }

    ensureOverlay().then((loaded) => {
      if (!activeTile || !shouldMount(activeTile, previewOverrides)) {
        loaded.setActiveTile(null);
        return;
      }
      loaded.setStreamingConfig(streaming);
      if (previewOverrides) loaded.setPreviewTile(activeTile, previewOverrides);
      else loaded.setActiveTile(activeTile);
      activeProject = loaded.activeProject || activeProject;
    }).catch(() => {});
  }

  function setActiveTile(tile) {
    applyTile(tile, null);
  }

  function setPreviewTile(tile, projectOverrides = {}) {
    applyTile(tile, projectOverrides);
  }

  function setStreamingConfig(nextStreaming) {
    streaming = normalizeStreamingConfig(nextStreaming);
    if (overlay) overlay.setStreamingConfig(streaming);
    applyTile(activeTile, previewOverrides);
  }

  function update(activeCamera = camera) {
    if (overlay) overlay.update(activeCamera);
  }

  function destroy() {
    if (overlay) overlay.destroy();
    overlay = null;
    loading = null;
    activeTile = null;
    activeProject = null;
  }

  return {
    setActiveTile,
    setStreamingConfig,
    update,
    destroy,
    setPreviewTile,
    get activeProject() {
      return overlay?.activeProject || activeProject;
    },
  };
}
