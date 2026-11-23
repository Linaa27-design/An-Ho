/* =========================================================
   AN HO — levende hero
   Portaalvideo, lichteffecten op de boog, zwevende lichtdeeltjes
   en lichte parallax tussen portaal en model.
   ========================================================= */
(() => {
  const stage = document.querySelector('.hero-stage');
  if (!stage) return;

  // Levend portaal: start de lus pas als hij echt speelt, anders blijft de foto staan
  const bg = stage.querySelector('.hero-bg');
  const loop = stage.querySelector('.hero-bg-video');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (loop) {
    if (reduce) {
      loop.removeAttribute('src');
      loop.load();
    } else {
      loop.addEventListener('playing', () => bg.classList.add('is-playing'), { once: true });
      const p = loop.play();
      if (p && p.catch) p.catch(() => {});
      // Pauzeren buiten beeld bespaart batterij
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) loop.play().catch(() => {}); else loop.pause();
      }).observe(stage);
    }
  }

  // ---------- Boogpositie: lichteffecten precies op het portaal leggen ----------
  // Boog in het portaalbeeld (1344×752): midden ±70% / 42%, buitenmaat ±39% × 75%
  const IMG = { w: 1344, h: 752 }, ARCH = { x: 0.697, y: 0.42, w: 0.39, h: 0.76 };
  const arch = { x: 0, y: 0, w: 0, h: 0 };
  function placeArch() {
    if (!bg) return;
    const W = bg.clientWidth, H = bg.clientHeight;
    const pos = (loop ? getComputedStyle(loop).objectPosition : '68% 50%').split(' ').map(parseFloat);
    const s = Math.max(W / IMG.w, H / IMG.h);
    const dw = IMG.w * s, dh = IMG.h * s;
    const ox = (W - dw) * ((pos[0] || 68) / 100), oy = (H - dh) * ((pos[1] || 50) / 100);
    arch.x = ox + ARCH.x * dw; arch.y = oy + ARCH.y * dh; arch.w = ARCH.w * dw; arch.h = ARCH.h * dh;
    bg.style.setProperty('--arch-x', arch.x + 'px');
    bg.style.setProperty('--arch-y', arch.y + 'px');
    bg.style.setProperty('--arch-w', arch.w + 'px');
    bg.style.setProperty('--arch-h', arch.h + 'px');
  }
  placeArch();
  new ResizeObserver(placeArch).observe(stage);

  if (reduce) return;

  // ---------- Zwevende lichtdeeltjes ----------
  const backCanvas = stage.querySelector('.hero-particles-back');
  const frontCanvas = stage.querySelector('.hero-particles-front');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  function makeLayer(canvas, cfg) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, parts = [];
    function spawn(p, initial) {
      // dichter bij de boog, maar ook verspreid over de rest van het beeld
      const nearArch = Math.random() < cfg.archBias;
      p.x = nearArch ? arch.x + gauss() * arch.w * 0.9 : rand(0, W);
      p.y = initial ? rand(0, H) : H + rand(10, 60);
      p.r = rand(cfg.r[0], cfg.r[1]);
      p.vy = rand(cfg.speed[0], cfg.speed[1]);
      p.sway = rand(6, 22); p.phase = rand(0, Math.PI * 2); p.freq = rand(0.15, 0.45);
      p.a = rand(cfg.alpha[0], cfg.alpha[1]); p.tw = rand(0.6, 1.8); p.x0 = p.x;
      p.star = cfg.stars && Math.random() < 0.35;
      return p;
    }
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(cfg.density * (W * H) / 1e5);
      parts = Array.from({ length: n }, () => spawn({}, true));
    }
    resize();
    new ResizeObserver(resize).observe(canvas);
    return function draw(t, dt) {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.vy * dt;
        if (p.y < -40) spawn(p, false);
        const x = p.x0 + Math.sin(t * p.freq + p.phase) * p.sway;
        const tw = 0.55 + 0.45 * Math.sin(t * p.tw + p.phase);
        const fade = Math.min(1, p.y / (H * 0.25), (H - p.y) / (H * 0.12) + 0.2);
        const a = p.a * tw * Math.max(0, fade);
        if (a <= 0.003) continue;
        const R = p.r * cfg.glow;
        // ijsblauwe halo (zichtbaar op licht én donker)
        const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, R);
        g.addColorStop(0, `rgba(120, 185, 250, ${a * cfg.halo})`);
        g.addColorStop(0.45, `rgba(150, 205, 255, ${a * cfg.halo * 0.45})`);
        g.addColorStop(1, 'rgba(150, 205, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, p.y, R, 0, Math.PI * 2); ctx.fill();
        // helder wit hartje
        if (cfg.core) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, a * 1.1)})`;
          ctx.beginPath(); ctx.arc(x, p.y, p.r * 0.85, 0, Math.PI * 2); ctx.fill();
        }
        // kristalglinstering: kort sterretje op het hoogtepunt van de twinkel
        if (p.star && tw > 0.82) {
          const s = (tw - 0.82) / 0.18, len = p.r * 8 * s;
          ctx.strokeStyle = `rgba(235, 246, 255, ${a * s})`; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - len, p.y); ctx.lineTo(x + len, p.y);
          ctx.moveTo(x, p.y - len); ctx.lineTo(x, p.y + len);
          ctx.stroke();
        }
      }
    };
  }

  const small = window.innerWidth < 860;
  const drawBack = makeLayer(backCanvas, {
    density: small ? 10 : 9, archBias: 0.3, r: [1.2, 3.2], glow: 4.5, halo: 0.85, core: true, stars: true,
    speed: [6, 18], alpha: [0.7, 1],
  });
  const drawFront = makeLayer(frontCanvas, {
    density: small ? 0.5 : 0.4, archBias: 0.3, r: [8, 20], glow: 2, halo: 0.8, core: false, stars: false,
    speed: [3, 8], alpha: [0.3, 0.5],
  });

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0, s: 0 };
  let visible = true;

  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible) {
      const t = now / 1000;
      if (drawBack) drawBack(t, dt);
      if (drawFront) drawFront(t, dt);
      const s = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      cur.s += (s - cur.s) * 0.15;
      stage.style.setProperty('--mx', cur.x.toFixed(4));
      stage.style.setProperty('--my', cur.y.toFixed(4));
      stage.style.setProperty('--scroll', cur.s.toFixed(4));
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
