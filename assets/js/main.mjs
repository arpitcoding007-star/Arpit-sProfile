import { regions, versionOf } from './render.mjs';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 1100px)');

const chrome = document.querySelector('[data-chrome]');
const barnav = document.querySelector('[data-barnav]');
const vnav = document.querySelector('[data-vnav]');
const sections = [...document.querySelectorAll('[data-section]')];
const pad = (n) => String(n).padStart(2, '0');

/* ---------- Reveal on entry ---------- */

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      sectionObserver.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -16% 0px' },
);

const selfObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      selfObserver.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
);

const observeSelf = () => document.querySelectorAll('.reveal-self:not(.is-in)').forEach((el) => selfObserver.observe(el));

/* ---------- Active section: pager and nav ---------- */

const pagerNow = document.querySelector('[data-pager-now]');
const pagerPrev = document.querySelector('[data-pager-prev]');
const pagerNext = document.querySelector('[data-pager-next]');
const navLinks = [...document.querySelectorAll('[data-nav]')];
let current = -1;

function setCurrent(index) {
  if (index === current || index < 0) return;
  current = index;
  const total = sections.length;
  const prev = (index - 1 + total) % total;
  const next = (index + 1) % total;

  pagerNow.textContent = pad(index + 1);
  pagerNow.classList.remove('is-ticking');
  void pagerNow.offsetWidth;
  pagerNow.classList.add('is-ticking');
  pagerPrev.textContent = pad(prev + 1);
  pagerPrev.href = `#${sections[prev].id}`;
  pagerPrev.setAttribute('aria-label', `Previous section: ${sections[prev].dataset.section}`);
  pagerNext.textContent = pad(next + 1);
  pagerNext.href = `#${sections[next].id}`;
  pagerNext.setAttribute('aria-label', `Next section: ${sections[next].dataset.section}`);

  const id = sections[index].id;
  for (const link of navLinks) {
    if (link.dataset.nav === id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

const activeObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) setCurrent(sections.indexOf(entry.target));
    }
  },
  { rootMargin: '-50% 0px -50% 0px' },
);

/* ---------- Scroll-driven: header state and disc parallax ---------- */

const discs = [...document.querySelectorAll('.stage > .disc, .hero__visual > .disc')];
let ticking = false;

function onFrame() {
  ticking = false;
  const y = window.scrollY;
  chrome.classList.toggle('is-compact', y > 24);

  if (desktop.matches && vnav) {
    barnav.classList.toggle('is-shown', vnav.getBoundingClientRect().bottom < 96);
  }

  if (!desktop.matches || reduceMotion.matches) return;
  const vh = window.innerHeight;
  for (const disc of discs) {
    const stage = disc.closest('.stage');
    const rect = stage.getBoundingClientRect();
    if (rect.bottom < -vh * 0.25 || rect.top > vh * 1.25) continue;
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
    const offset = Math.max(-1, Math.min(1, progress)) * -36;
    disc.style.setProperty('--py', `${offset.toFixed(1)}px`);
  }
}

const requestFrame = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(onFrame);
};

function resetParallax() {
  if (desktop.matches && !reduceMotion.matches) return;
  for (const disc of discs) disc.style.removeProperty('--py');
}

/* ---------- Mobile menu ---------- */

const menu = document.querySelector('[data-menu]');
const menuBtn = document.querySelector('[data-menu-btn]');

function setMenu(open) {
  root.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) menu.querySelector('a')?.focus({ preventScroll: true });
}

menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (!root.classList.contains('menu-open')) return;
  if (event.key === 'Escape') {
    setMenu(false);
    menuBtn.focus();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [menuBtn, ...menu.querySelectorAll('a')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
desktop.addEventListener('change', () => {
  setMenu(false);
  resetParallax();
  requestFrame();
});
reduceMotion.addEventListener('change', resetParallax);

/* ---------- Live CMS content ---------- */

async function refreshContent() {
  const meta = document.querySelector('meta[name="content-version"]');
  try {
    const response = await fetch('data/content.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const data = await response.json();
    if (meta && versionOf(data) === meta.content) return;
    for (const [name, render] of Object.entries(regions)) {
      document.querySelectorAll(`[data-region="${name}"]`).forEach((el) => {
        el.innerHTML = render(data);
      });
    }
    if (meta) meta.content = versionOf(data);
    observeSelf();
  } catch (error) {
    console.warn('Content refresh skipped:', error);
  }
}

/* ---------- Boot ---------- */

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

sections.forEach((section) => {
  sectionObserver.observe(section);
  activeObserver.observe(section);
});
observeSelf();

window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', requestFrame, { passive: true });
onFrame();

window.__asrBooted = true;
requestAnimationFrame(() => {
  root.classList.add('is-ready');
  sections[0]?.classList.add('is-in');
});

refreshContent();
