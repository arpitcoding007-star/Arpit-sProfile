// Static checks for the built site: anchors resolve, local assets exist, the pre-render is current.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { versionOf } from '../assets/js/render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const problems = [];

for (const page of ['index.html', '404.html']) {
  const html = read(page);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  for (const [, id] of html.matchAll(/href="#([^"]*)"/g)) {
    if (!ids.has(id)) problems.push(`${page}: link to missing #${id}`);
  }

  const refs = [
    ...[...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
    const file = path.join(root, ref.replace(/^\//, '').split(/[?#]/)[0]);
    if (!fs.existsSync(file)) problems.push(`${page}: missing file ${ref}`);
  }

  if (/<!-- region:(\w+) --><!-- \/region:\1 -->/.test(html)) problems.push(`${page}: an empty region, run npm run build`);
  if (/\[HOBBY|placeholder|Attach photo/i.test(html)) problems.push(`${page}: placeholder text left in markup`);
}

const index = read('index.html');
const version = index.match(/<meta name="content-version" content="([^"]*)">/)?.[1];
const expected = versionOf(JSON.parse(read('data/content.json')));
if (version !== expected) problems.push(`index.html pre-render is stale (${version} vs ${expected}), run npm run build`);

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('✓ anchors, assets and pre-render all check out');
