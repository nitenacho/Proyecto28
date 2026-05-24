/* =========================================================
   PROYECTO 28 — 3D-to-2D stream overlay
   Positions the iframe/fallback shell above the tile currently
   occupied by the controllable light.
   ========================================================= */

import * as THREE from 'three';
import { createPixelStreamFrame } from './pixelStream.js';

const ANCHOR_Y = 1.08;
const EDGE_GAP = 16;

const tmpWorld = new THREE.Vector3();
const tmpScreen = new THREE.Vector3();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function visualViewportRect() {
  const vv = window.visualViewport;
  if (vv && vv.width > 0 && vv.height > 0) {
    return {
      left: vv.offsetLeft || 0,
      top: vv.offsetTop || 0,
      width: vv.width,
      height: vv.height,
    };
  }
  return {
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function normalizeStreamingConfig(streaming = {}) {
  const mode = streaming.mode === 'per-cube' || streaming.mode === 'dedicated'
    ? 'per-cube'
    : 'shared';
  return {
    enabled: !!streaming.enabled,
    mode,
  };
}

function overlayWidthForViewport(width) {
  if (width < 520) return clamp(width * 0.56, 184, 244);
  if (width < 900) return clamp(width * 0.42, 240, 340);
  return clamp(width * 0.28, 300, 420);
}

export function createStreamOverlay({ site, camera }) {
  const root = document.createElement('div');
  root.hidden = true;
  document.body.appendChild(root);

  const frame = createPixelStreamFrame({ root });

  let activeTile = null;
  let activeProject = null;
  let streaming = normalizeStreamingConfig(site?.streaming);

  function activateTile(tile, projectOverrides = null) {
    const nextTile = tile?.userData?.isProject ? tile : null;
    const baseProject = nextTile?.userData?.project || null;
    const nextProject = baseProject && projectOverrides
      ? { ...baseProject, ...projectOverrides }
      : baseProject;

    activeTile = nextTile;
    activeProject = nextProject;

    if (!activeProject) {
      root.hidden = true;
      frame.clear();
      return;
    }

    root.hidden = false;
    frame.setProject({ project: activeProject, streaming });
    update(camera);
  }

  function setActiveTile(tile) {
    activateTile(tile);
  }

  function setPreviewTile(tile, projectOverrides = {}) {
    activateTile(tile, projectOverrides);
  }

  function setStreamingConfig(nextStreaming) {
    streaming = normalizeStreamingConfig(nextStreaming);
    if (activeProject) {
      frame.setProject({ project: activeProject, streaming });
    }
  }

  function update(activeCamera = camera) {
    if (!activeTile || !activeProject || !activeCamera || root.hidden) return;

    activeTile.updateWorldMatrix(true, false);
    activeTile.getWorldPosition(tmpWorld);
    tmpWorld.y += ANCHOR_Y;
    tmpScreen.copy(tmpWorld).project(activeCamera);

    if (
      !Number.isFinite(tmpScreen.x) ||
      !Number.isFinite(tmpScreen.y) ||
      tmpScreen.z < -1 ||
      tmpScreen.z > 1 ||
      Math.abs(tmpScreen.x) > 1.6 ||
      Math.abs(tmpScreen.y) > 1.6
    ) {
      root.classList.add('is-offscreen');
      return;
    }

    const viewport = visualViewportRect();
    const width = overlayWidthForViewport(viewport.width);
    const projectedX = viewport.left + ((tmpScreen.x + 1) / 2) * viewport.width;
    const projectedY = viewport.top + ((-tmpScreen.y + 1) / 2) * viewport.height;
    const estimatedHeight = width * 0.62 + 30;

    const minX = viewport.left + EDGE_GAP + width / 2;
    const maxX = viewport.left + viewport.width - EDGE_GAP - width / 2;
    const minY = viewport.top + EDGE_GAP + estimatedHeight;
    const maxY = viewport.top + viewport.height - EDGE_GAP;

    root.style.width = `${width}px`;
    root.style.left = `${clamp(projectedX, minX, Math.max(minX, maxX))}px`;
    root.style.top = `${clamp(projectedY - 24, minY, Math.max(minY, maxY))}px`;
    root.classList.remove('is-offscreen');
  }

  function destroy() {
    frame.clear();
    root.remove();
  }

  return {
    setActiveTile,
    setStreamingConfig,
    update,
    destroy,
    setPreviewTile,
    get activeProject() { return activeProject; },
  };
}
