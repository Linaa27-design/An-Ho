// Jaartal in footer
document.getElementById('year').textContent = new Date().getFullYear();

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Mobiel menu ----------
const MENU_LABELS = ({
  nl: { open: 'Menu openen', close: 'Menu sluiten' },
  fr: { open: 'Ouvrir le menu', close: 'Fermer le menu' },
  en: { open: 'Open menu', close: 'Close menu' },
})[document.documentElement.lang] || { open: 'Menu openen', close: 'Menu sluiten' };
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('nav');
function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? MENU_LABELS.close : MENU_LABELS.open);
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
}
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// ---------- Header + actieve navigatie + parallax ----------
const header = document.getElementById('header');
const hero = document.querySelector('.hero');
const navLinks = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const ribbons = [...document.querySelectorAll('.ribbon')];

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 20);
  const heroEnd = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
  document.body.classList.toggle('past-hero', y > heroEnd * 0.6);

  // actieve link
  let current = sections[0];
  sections.forEach((s) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s; });
  navLinks.forEach((a) => a.classList.toggle('is-current', document.querySelector(a.getAttribute('href')) === current));

  // vloeibaar chroom drijft mee
  if (!reduce) ribbons.forEach((r, i) => {
    const rect = r.parentElement.getBoundingClientRect();
    const shift = (rect.top - window.innerHeight / 2) * (i % 2 ? -0.12 : 0.1);
    r.style.translate = `0 ${shift.toFixed(1)}px`;
  });
}
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ---------- Rustige fade-in ----------
const items = document.querySelectorAll('.reveal');
if (reduce || !('IntersectionObserver' in window)) {
  items.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  items.forEach((el) => io.observe(el));
}

// ---------- 3D-tilt op portalen en kaarten ----------
if (finePointer && !reduce) {
  document.querySelectorAll('.arch, .pop-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
