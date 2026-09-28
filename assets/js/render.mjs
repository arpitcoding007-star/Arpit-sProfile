// Pure renderers shared by the browser (live CMS content) and scripts/build.mjs (pre-render).
// Every value is escaped: content.json is edited through the CMS, never trusted as markup.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

const list = (value) => (Array.isArray(value) ? value : []);
const pad = (n) => String(n).padStart(2, '0');
const digits = (value) => String(value ?? '').replace(/\D/g, '');

export function versionOf(data) {
  const text = JSON.stringify(data);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export const icons = {
  arrow: '<svg class="icon-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4"/></svg>',
  download: '<svg class="icon-down" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2v9M3 7l4 4 4-4M2 13h10"/></svg>',
};

const rv = (cls, i) => `class="${cls ? cls + " " : ""}reveal" style="--i:${i}"`;

export const regions = {
  heroName: (d) => esc(d.hero?.name),

  heroTagline: (d) => esc(d.hero?.tagline),

  journey: (d) =>
    list(d.journey)
      .map(
        (row, i) =>
          `<li class="tl__row reveal" style="--i:${i + 1}"><span class="tl__year">${esc(row.year)}</span><span class="tl__label">${esc(row.label)}</span></li>`,
      )
      .join(''),

  focus: (d) => esc(d.hero?.focus),

  stats: (d) =>
    list(d.stats)
      .map(
        (s) =>
          `<div class="stat"><span class="stat__value">${esc(s.value)}</span><span class="stat__label">${esc(s.label)}</span></div>`,
      )
      .join(''),

  featured: (d) => {
    const f = d.experience?.featured ?? {};
    const total = 1 + list(d.experience?.roles).length;
    const badge = f.badge
      ? ` <span class="pill"${f.badge_note ? ` title="${esc(f.badge_note)}"` : ''}>${esc(f.badge)}${f.badge_note ? `<span class="sr-only">: ${esc(f.badge_note)}</span>` : ''}</span>`
      : '';
    const meta = [f.location, f.dates].filter(Boolean).map(esc).join(' · ');
    return [
      `<h2 id="experience-h" ${rv("label", 0)}>Professional experience <span aria-hidden="true">· 01 / ${pad(total)}</span></h2>`,
      `<h3 ${rv("feature__company", 1)}>${esc(f.company)}</h3>`,
      `<p ${rv("feature__role", 2)}>${esc(f.role)}${badge}</p>`,
      meta ? `<p ${rv("meta", 3)}>${meta}</p>` : '',
      f.summary ? `<p ${rv("feature__summary", 4)}>${esc(f.summary)}</p>` : '',
      `<ul ${rv("dots", 5)}>${list(f.highlights).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`,
    ].join('');
  },

  strategic: (d) => {
    const f = d.experience?.featured ?? {};
    const items = list(f.strategic).map((s) => `<li>${esc(s)}</li>`).join('');
    return `<h3 class="disc__label">${esc(f.strategic_title || 'Strategic impact highlights')}</h3><ul class="highlights__list">${items}</ul>`;
  },

  roles: (d) =>
    list(d.experience?.roles)
      .map((r) => {
        const when = [r.dates, r.duration].filter(Boolean).map(esc).join(' · ');
        return `<li class="xrow reveal-self"><div class="xrow__cell"><h3 class="xrow__company">${esc(r.company)}</h3>${r.note ? `<p class="xrow__note">${esc(r.note)}</p>` : ''}</div><div class="xrow__cell"><p class="xrow__role">${esc(r.role)}</p>${when ? `<p class="meta meta--sm">${when}</p>` : ''}</div><ul class="xrow__cell xrow__list">${list(r.highlights).map((h) => `<li>${esc(h)}</li>`).join('')}</ul></li>`;
      })
      .join(''),

  skillsHeadline: (d) => esc(d.skills?.headline),

  expertise: (d) => list(d.skills?.expertise).map((e) => `<li>${esc(e)}</li>`).join(''),

  categories: (d) =>
    list(d.skills?.categories)
      .map(
        (c) =>
          `<li class="cat reveal-self"><h3 class="cat__name">${esc(c.category)}</h3><ul class="taglist">${list(c.tags).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></li>`,
      )
      .join(''),

  hobbies: (d) =>
    `<p ${rv("hobbies__intro", 3)}>${esc(d.hobbies?.intro)}</p><ul ${rv('chips', 4)}>${list(d.hobbies?.tags).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`,

  education: (d) =>
    list(d.education?.entries)
      .map(
        (e, i) =>
          `<li class="edu reveal" style="--i:${i + 1}">${e.when ? `<p class="meta meta--sm">${esc(e.when)}</p>` : ''}<h3 class="edu__degree">${esc(e.degree)}</h3>${e.field ? `<p class="edu__field">${esc(e.field)}</p>` : ''}${e.school ? `<p class="edu__school">${esc(e.school)}</p>` : ''}</li>`,
      )
      .join(''),

  educationFeature: (d) => {
    const f = d.education?.feature ?? {};
    return `<span class="edu-feature__title">${esc(f.title)}</span><span class="disc__label">${esc(f.school)}</span><span class="edu-feature__years">${esc(f.years)}</span>`;
  },

  contact: (d) => {
    const c = d.contact ?? {};
    const linkedin = c.linkedin?.url
      ? `<a class="linkbtn" href="${esc(c.linkedin.url)}" target="_blank" rel="noopener">LinkedIn profile<span class="dot dot--ink">${icons.arrow}</span></a>`
      : '';
    return `<p class="disc__label">Contact</p><h2 class="contact__headline" id="contact-h">${esc(c.headline)}</h2><p class="contact__text">${esc(c.text)}</p><div class="contact__ctas">${linkedin}<a class="linkbtn" href="Arpit_Resume.pdf" download>Resume<span class="dot dot--paper">${icons.download}</span></a></div>`;
  },

  channels: (d) => {
    const c = d.contact ?? {};
    const rows = [];
    if (c.email) rows.push(['Email', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`]);
    if (c.whatsapp) rows.push(['WhatsApp', `<a href="https://wa.me/${digits(c.whatsapp)}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a>`]);
    if (c.telegram) rows.push(['Telegram', `<a href="https://t.me/${esc(String(c.telegram).replace(/^@/, ''))}" target="_blank" rel="noopener">${esc(c.telegram)}</a>`]);
    if (c.location) rows.push(['Location', `<span>${esc(c.location)}</span>`]);
    return rows
      .map(([k, v], i) => `<li class="reveal" style="--i:${i + 1}"><span class="channels__key">${k}</span>${v}</li>`)
      .join('');
  },
};
