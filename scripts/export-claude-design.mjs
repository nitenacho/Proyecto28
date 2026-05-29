import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sourcePath = resolve(root, 'src/styles/tokens.css');
const outDir = resolve(root, process.argv[2] || 'claude-design-export');

function shellValue(command, fallback = '') {
  try {
    return execSync(command, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function classifyToken(name) {
  if (name.startsWith('bg-')) return 'color.background';
  if (name.startsWith('ink-')) return 'color.text';
  if (/^(cyan|blue|copper)/.test(name)) return 'color.brand';
  if (/^(success|warning|danger|info)$/.test(name)) return 'color.semantic';
  if (name.startsWith('font-')) return 'typography.family';
  if (name.startsWith('fs-')) return 'typography.size';
  if (name.startsWith('lh-')) return 'typography.lineHeight';
  if (name.startsWith('tr-')) return 'typography.tracking';
  if (name.startsWith('sp-')) return 'spacing';
  if (name.startsWith('r-')) return 'radius';
  if (name.startsWith('bd-')) return 'border';
  if (name.startsWith('sh-') || name.startsWith('glow-')) return 'shadow';
  if (name.startsWith('ease-')) return 'motion.easing';
  if (name.startsWith('dur-')) return 'motion.duration';
  return 'misc';
}

function parseTokens(css) {
  const rootMatch = stripComments(css).match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!rootMatch) {
    throw new Error('Could not find :root token block in src/styles/tokens.css');
  }

  const tokens = [];
  const re = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = re.exec(rootMatch[1])) !== null) {
    const name = match[1];
    const value = match[2].replace(/\s+/g, ' ').trim();
    tokens.push({
      name,
      cssVariable: `--${name}`,
      value,
      category: classifyToken(name),
    });
  }

  if (!tokens.length) {
    throw new Error('No CSS custom properties found in :root token block');
  }
  return tokens;
}

const css = readFileSync(sourcePath, 'utf8');
const tokens = parseTokens(css);
const now = new Date().toISOString();
const commit = process.env.GITHUB_SHA || shellValue('git rev-parse HEAD');
const ref = process.env.GITHUB_REF_NAME || shellValue('git describe --tags --abbrev=0', 'local');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyFileSync(sourcePath, resolve(outDir, 'tokens.css'));

const manifest = {
  name: 'Proyecto28 Claude Design token export',
  version: ref,
  generatedAt: now,
  source: {
    repository: process.env.GITHUB_REPOSITORY || 'nitenacho/Proyecto28',
    commit,
    ref,
    path: 'src/styles/tokens.css',
  },
  files: ['tokens.css', 'tokens.json', 'manifest.json', 'README.md'],
  tokenCount: tokens.length,
};

writeFileSync(resolve(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(resolve(outDir, 'tokens.json'), `${JSON.stringify({
  $schema: 'https://proyecto28.com/schemas/claude-design-tokens.json',
  ...manifest,
  tokens,
  cssVariables: Object.fromEntries(tokens.map((token) => [token.cssVariable, token.value])),
}, null, 2)}\n`);
writeFileSync(resolve(outDir, 'README.md'), `# Proyecto28 Claude Design export

Generated: ${now}
Source commit: ${commit}
Source ref: ${ref}

This package is the portable Claude Design handoff for Proyecto28 design tokens.

Files:
- tokens.css: canonical CSS custom properties used by the live site.
- tokens.json: machine-readable token list grouped by category.
- manifest.json: export metadata for GitHub / downstream agents.

Import contract:
1. Treat src/styles/tokens.css as the source of truth.
2. Use tokens.json for tools that prefer structured data.
3. Do not edit generated files directly; change src/styles/tokens.css and rerun the export.
`);

console.log(`Exported ${tokens.length} tokens to ${outDir}`);
