// Pre-renders data/content.json into index.html so the page is complete without JavaScript
// and first paint matches the CMS content. The browser re-renders only if content.json changed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { regions, versionOf } from '../assets/js/render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/content.json'), 'utf8'));

const required = [
  ['hero.name', data.hero?.name],
  ['hero.tagline', data.hero?.tagline],
  ['stats', data.stats?.length],
  ['journey', data.journey?.length],
  ['experience.featured.company', data.experience?.featured?.company],
  ['skills.expertise', data.skills?.expertise?.length],
  ['education.entries', data.education?.entries?.length],
  ['contact.email', data.contact?.email],
];
const missing = required.filter(([, value]) => !value).map(([key]) => key);
if (missing.length) {
  console.error(`content.json is missing: ${missing.join(', ')}`);
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');
const rendered = new Set();
html = html.replace(/(<!-- region:([A-Za-z]+) -->)[\s\S]*?(<!-- \/region:\2 -->)/g, (_, open, name, close) => {
  if (!regions[name]) throw new Error(`index.html references unknown region "${name}"`);
  rendered.add(name);
  return open + regions[name](data) + close;
});

const unused = Object.keys(regions).filter((name) => !rendered.has(name));
if (unused.length) {
  console.error(`index.html has no marker for region(s): ${unused.join(', ')}`);
  process.exit(1);
}

const version = versionOf(data);
html = html.replace(/<meta name="content-version" content="[^"]*">/, `<meta name="content-version" content="${version}">`);
fs.writeFileSync(htmlPath, html);
console.log(`Rendered ${rendered.size} regions into index.html (content ${version}).`);
