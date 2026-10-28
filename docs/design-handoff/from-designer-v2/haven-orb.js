// <haven-orb size="230" state="idle|listening|thinking|speaking|breathing|concerned"></haven-orb>. The 5f halo orb.
(() => {
  if (customElements.get('haven-orb')) return;
  const css = document.createElement('style');
  css.textContent = '@keyframes hoSpin{to{transform:rotate(360deg)}}@keyframes hoBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}@keyframes hoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@media (prefers-reduced-motion: reduce){haven-orb *{animation:none!important}}';
  document.head.appendChild(css);
  const mask = 'radial-gradient(circle, transparent 56%, #000 59%, #000 66%, transparent 69%)';
  const R1 = '#6ff0e6, #3fd6cd 16%, #1aa8b5 30%, #4f7dff 46%, #b8a8ff 60%, #f0a8d8 72%, #a6f4ee 88%, #6ff0e6';
  const R2 = 'transparent 0 20%, #a6f4ee 35%, #8f9cff 50%, transparent 65%, #2a6fd0 82%, transparent';
  const R3 = 'transparent 0 40%, #dccfff 55%, #ffc4a8 64%, #6ff0e6 74%, transparent 85%';
  const ring = (inset, c, dur, rev, tilt, blur, op, z) => `<div style="position:absolute;inset:${inset}px;transform:translateZ(${z}px) ${tilt}"><div style="position:absolute;inset:0;border-radius:50%;background:conic-gradient(${c});filter:blur(${blur}px);opacity:${op};animation:hoSpin ${dur}s linear infinite${rev ? ' reverse' : ''};-webkit-mask:${mask};mask:${mask}"></div></div>`;
  const eye = '<span style="width:12px;height:26px;border-radius:6px;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.6)"></span>';
  // per-state targets: yaw/pitch in deg, s = scale, k = ring speed, g = glow, ey = eye lift px, eo = eye openness
  const T = {
    idle:      { k: 1,   g: 1,    s: 1,    pitch: 0,  ey: 0,  eo: 1 },
    listening: { k: 1.25, g: 1.3, s: 1.03, pitch: -5, ey: 0,  eo: 1 },
    thinking:  { k: .6,  g: 1,    s: .98,  pitch: 7,  ey: -5, eo: .8 },
    speaking:  { k: 1.8, g: 1.45, s: 1,    pitch: 0,  ey: 0,  eo: 1 },
    breathing: { k: .7,  g: 1,    s: 1,    pitch: 0,  ey: 0,  eo: .25 },
    concerned: { k: .45, g: 1.2,  s: .97,  pitch: -4, ey: 3,  eo: .82 },
  };
  class HavenOrb extends HTMLElement {
    static get observedAttributes() { return ['size', 'state']; }
    attributeChangedCallback() { this.layout && this.layout(); }
    connectedCallback() {
      if (!this.firstChild) this.innerHTML = `<div aria-hidden="true" style="position:absolute;left:50%;top:50%;width:230px;height:230px;margin:-115px 0 0 -115px"><div style="position:absolute;inset:0;animation:hoFloat 8s ease-in-out infinite"><div data-tilt style="position:absolute;inset:0;transform-style:preserve-3d">
<div data-glow style="position:absolute;inset:-24px;border-radius:50%;background:radial-gradient(circle, rgba(63,214,205,.22), transparent 66%);filter:blur(14px)"></div>
<div style="position:absolute;inset:34px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 42%, #1a8c84, #0b3c44 62%, #04141a 100%);box-shadow:inset 0 0 30px #04141a"><div data-shine style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 34% 26%, rgba(255,255,255,.18), transparent 34%), radial-gradient(circle at 50% 108%, rgba(111,240,230,.24), transparent 46%)"></div><div data-shade style="position:absolute;inset:-20%;border-radius:50%;background:radial-gradient(circle at 50% 50%, transparent 38%, rgba(2,10,14,.55) 62%)"></div><div data-rim style="position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 0 rgba(143,240,232,0)"></div></div>
<div data-rings style="position:absolute;inset:0;transform-style:preserve-3d">${ring(4, R1, 11, false, 'rotate(-12deg) scaleY(.92)', 3, .95, 14)}${ring(0, R2, 16, true, 'rotate(24deg) scaleX(.9)', 5, .8, -18)}${ring(10, R3, 8, false, 'rotate(70deg) scaleY(.82)', 2, .7, 6)}</div>
<div data-eyes style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div data-lids style="display:flex;gap:22px"><div style="display:flex;gap:22px;animation:hoBlink 6s ease-in-out infinite">${eye}${eye}</div></div></div></div></div></div>`;
      const q = (s) => this.querySelector(s);
      this.tilt = q('[data-tilt]'); this.glow = q('[data-glow]'); this.shine = q('[data-shine]'); this.eyes = q('[data-eyes]'); this.lids = q('[data-lids]'); this.rings = q('[data-rings]'); this.shade = q('[data-shade]'); this.rim = q('[data-rim]');
      this.layout = () => {
        const S = parseFloat(this.getAttribute('size')) || 230;
        Object.assign(this.style, { display: 'block', position: 'relative', width: S + 'px', height: S + 'px', flex: 'none' });
        this.firstChild.style.transform = `scale(${S / 230})`;
      };
      this.layout();
      this.cur = { yaw: 0, pitch: 0, s: 1, k: 1, g: 1, ey: 0, eo: 1 };
      this.look = { at: 0, yaw: 0, next: 2 };
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, t0 = performance.now();
      this.vis = true;
      if ('IntersectionObserver' in window) {
        this.io = new IntersectionObserver(([e]) => {
          this.vis = e.isIntersecting;
          (this.anims || []).forEach((a) => (this.vis ? a.play() : a.pause()));
          if (this.vis && !reduce) { cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(loop); }
        });
        this.io.observe(this);
      }
      const loop = (now) => { this.frame((now - t0) / 1000); if (!reduce && this.isConnected && this.vis) this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
    }
    disconnectedCallback() { cancelAnimationFrame(this.raf); this.io && this.io.disconnect(); }
    frame(t) {
      const st = T[this.getAttribute('state')] ? this.getAttribute('state') : 'idle', tg = { ...T[st] };
      // yaw: idle looks around now and then; thinking drifts; speaking sways; listening and breathing face you
      if (st === 'idle') {
        if (t > this.look.next) { this.look.yaw = this.look.yaw ? 0 : (Math.random() < .5 ? -1 : 1) * (18 + Math.random() * 14); this.look.next = t + (this.look.yaw ? 1.8 : 4 + Math.random() * 4); }
        tg.yaw = this.look.yaw; tg.pitch = 2 * Math.sin(t * .4);
      } else if (st === 'thinking') { tg.yaw = 14 * Math.sin(t * .45); }
      else if (st === 'speaking') {
        const v = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.9 + 1));
        tg.yaw = 8 * Math.sin(t * .9) + 3 * Math.sin(t * 2.3); tg.pitch = 2 * Math.sin(t * 1.7);
        tg.s = 1 + .04 * v; tg.g += .5 * v; tg.eo = 1 - .25 * v;
      } else if (st === 'breathing') {
        const c = t % 10, inh = c < 4 ? c / 4 : 1 - (c - 4) / 6, e = .5 - .5 * Math.cos(inh * Math.PI);
        tg.s = .86 + .22 * e; tg.g = .8 + .7 * e; tg.eo = .2 + .8 * e; tg.yaw = 0;
      } else tg.yaw = 0;
      const c = this.cur, f = st === 'speaking' || st === 'breathing' ? .2 : .06;
      for (const k in c) c[k] += ((tg[k] ?? 0) - c[k]) * (k === 'yaw' ? .045 : f);
      // A sphere never foreshortens: keep the core round, move what's ON it (eyes, shade, rim light) and swing the rings in real 3D for parallax.
      const yr = c.yaw * Math.PI / 180, pr = c.pitch * Math.PI / 180;
      this.tilt.style.transform = `scale(${c.s})`;
      this.rings.style.transform = `perspective(520px) rotateY(${c.yaw * .9}deg) rotateX(${c.pitch * .8}deg)`;
      this.shine.style.transform = `translate(${-Math.sin(yr) * 10}px, ${Math.sin(pr) * 8}px)`;
      this.shade.style.transform = `translate(${-Math.sin(yr) * 34}px, ${Math.sin(pr) * 26}px)`;
      const rimA = Math.min(.5, Math.abs(Math.sin(yr)) * 1.4);
      this.rim.style.boxShadow = `inset ${Math.sign(c.yaw) * -6}px 0 14px -4px rgba(143,240,232,${rimA.toFixed(3)})`;
      this.eyes.style.transform = `translate(${Math.sin(yr) * 48}px, ${c.ey - Math.sin(pr) * 40}px) scaleX(${(.55 + .45 * Math.cos(yr)).toFixed(3)})`;
      this.lids.style.transform = `scaleY(${c.eo})`;
      this.glow.style.opacity = c.g;
      if (!this.anims || !this.anims.length) this.anims = this.getAnimations({ subtree: true }).filter((a) => a.animationName === 'hoSpin');
      for (const a of this.anims) a.playbackRate = c.k;
    }
  }
  customElements.define('haven-orb', HavenOrb);
})();
