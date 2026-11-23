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

// ---------- Lashes: de foto volgt de gekozen techniek ----------
const lashPhotos = [...document.querySelectorAll('.lash-photo')];
const lashItems = [...document.querySelectorAll('.lash-item')];
function showLash(i) {
  lashPhotos.forEach((img, n) => img.classList.toggle('is-active', n === i));
  lashItems.forEach((li, n) => li.classList.toggle('is-active', n === i));
}
lashItems.forEach((li, i) => {
  li.addEventListener('pointerenter', () => showLash(i));
  li.addEventListener('focusin', () => showLash(i));
  li.addEventListener('click', () => showLash(i));
});

// ---------- Reviews: glijdende rij met pijltjes ----------
const rvGrid = document.getElementById('rv-grid');
const rvBtns = [...document.querySelectorAll('.rv-btn')];
if (rvGrid && rvBtns.length) {
  const step = () => {
    const card = rvGrid.querySelector('.rv-card');
    return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(rvGrid).columnGap || 18) : rvGrid.clientWidth;
  };
  const update = () => {
    const max = rvGrid.scrollWidth - rvGrid.clientWidth - 2;
    rvBtns[0].disabled = rvGrid.scrollLeft <= 2;
    rvBtns[1].disabled = rvGrid.scrollLeft >= max;
  };
  rvBtns.forEach((b) => b.addEventListener('click', () => rvGrid.scrollBy({ left: step() * Number(b.dataset.dir), behavior: reduce ? 'auto' : 'smooth' })));
  rvGrid.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// ---------- Slot: levend portaal + lichtdeeltjes, alleen als het in beeld is ----------
(() => {
  const fin = document.querySelector('.final-cta');
  if (!fin || reduce || !('IntersectionObserver' in window)) return;
  const video = fin.querySelector('.final-video');
  const canvas = fin.querySelector('.final-particles');
  const ctx = canvas && canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, parts = [], running = false, last = 0;
  const rand = (a, b) => a + Math.random() * (b - a);
  const spawn = (p, initial) => {
    const nearArch = Math.random() < 0.45;
    p.x0 = nearArch ? W * (0.7 + (Math.random() - 0.5) * 0.3) : rand(W * 0.3, W);
    p.y = initial ? rand(0, H) : H + rand(10, 50);
    p.r = rand(1, 2.8); p.vy = rand(6, 16); p.sway = rand(6, 20);
    p.ph = rand(0, 6.28); p.f = rand(.15, .4); p.a = rand(.55, 1); p.tw = rand(.6, 1.6);
    return p;
  };
  const resize = () => {
    if (!canvas) return;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: Math.round(W * H / 9000) }, () => spawn({}, true));
  };
  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y -= p.vy * dt; if (p.y < -30) spawn(p, false);
      const x = p.x0 + Math.sin(t * p.f + p.ph) * p.sway;
      const a = p.a * (.55 + .45 * Math.sin(t * p.tw + p.ph)) * Math.min(1, p.y / (H * .3));
      if (a <= .01) continue;
      const R = p.r * 5, g = ctx.createRadialGradient(x, p.y, 0, x, p.y, R);
      g.addColorStop(0, `rgba(170, 215, 255, ${a * .8})`); g.addColorStop(1, 'rgba(170, 215, 255, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, p.y, R, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, a)})`; ctx.beginPath(); ctx.arc(x, p.y, p.r * .8, 0, 6.283); ctx.fill();
    }
    requestAnimationFrame(tick);
  };
  if (canvas) { resize(); new ResizeObserver(resize).observe(canvas); }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (video) video.play().catch(() => {});
      if (canvas && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
    } else {
      if (video) video.pause();
      running = false;
    }
  }, { rootMargin: '200px 0px' }).observe(fin);
})();
