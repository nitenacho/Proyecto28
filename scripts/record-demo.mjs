import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const targetUrl = process.argv[2] || 'https://proyecto28.com';
const outputPath = resolve(process.argv[3] || 'docs/proyecto28-demo.webm');
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync);

if (!chromePath) {
  console.error('Chrome not found. Set CHROME_PATH and retry.');
  process.exit(1);
}

const port = 9248;
const profile = join(tmpdir(), `p28-demo-${Date.now()}`);

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitForJson(url, retries = 100) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();

  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (!payload.id || !pending.has(payload.id)) return;
    const { resolve: resolveCall, reject } = pending.get(payload.id);
    pending.delete(payload.id);
    if (payload.error) reject(new Error(JSON.stringify(payload.error)));
    else resolveCall(payload.result || {});
  };

  return {
    ready: new Promise((resolveReady, rejectReady) => {
      ws.onopen = resolveReady;
      ws.onerror = rejectReady;
    }),
    send(method, params = {}) {
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolveCall, reject) => {
        pending.set(callId, { resolve: resolveCall, reject });
      });
    },
    close() {
      ws.close();
    },
  };
}

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--disable-gpu',
  '--autoplay-policy=no-user-gesture-required',
  'about:blank',
], { stdio: 'ignore' });

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const client = createCdpClient(target.webSocketDebuggerUrl);
  await client.ready;

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send('Page.navigate', { url: `${targetUrl}?demo-record=${Date.now()}` });
  await sleep(5000);

  const result = await client.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `new Promise(async (resolve) => {
      const canvas = document.querySelector('#c');
      if (!canvas || !canvas.captureStream || typeof MediaRecorder === 'undefined') {
        resolve({ ok: false, error: 'Canvas captureStream or MediaRecorder unavailable' });
        return;
      }

      const chunks = [];
      const stream = canvas.captureStream(24);
      let options = {};
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm;codecs=vp9' };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options = { mimeType: 'video/webm;codecs=vp8' };
      }

      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const buffer = await blob.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...bytes.slice(i, i + 0x8000));
        }
        resolve({ ok: true, mimeType: blob.type, base64: btoa(binary), size: blob.size });
      };

      recorder.start();
      const keys = ['KeyD', 'KeyD', 'KeyA', 'KeyW', 'Space', 'KeyD', 'KeyS'];
      for (const code of keys) {
        document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code.replace('Key', '').toLowerCase(), bubbles: true }));
        await new Promise((r) => setTimeout(r, 800));
        document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code.replace('Key', '').toLowerCase(), bubbles: true }));
        await new Promise((r) => setTimeout(r, 350));
      }
      setTimeout(() => recorder.stop(), 7000);
    })`,
  });

  const value = result.result?.value;
  if (!value?.ok || !value.base64) {
    throw new Error(value?.error || 'Recording failed');
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.from(value.base64, 'base64'));
  console.log(`Wrote ${outputPath} (${value.size} bytes, ${value.mimeType})`);
  client.close();
} finally {
  chrome.kill();
  await sleep(250);
  rmSync(profile, { recursive: true, force: true });
}
