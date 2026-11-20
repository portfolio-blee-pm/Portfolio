/* Brandon Lee · Portfolio — subtle motion
   Scroll reveals with stagger, count-up numbers, cursor spotlight on cards,
   gentle tilt on the profile card, and a reading-progress line.
   Everything is skipped when the visitor prefers reduced motion. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var doc = document.documentElement;
  doc.classList.add('js');
  if (reduce) doc.classList.add('reduce-motion');

  var revealEls = document.querySelectorAll('.fu, .fi');

  /* ── Stagger: items inside grids reveal one after another ── */
  var groups = ['.hero-copy', '.stats', '.pillars', '.card-grid', '.principles', '.caps', '.hero-metrics', '.mech', '.glance-grid', '.three-col'];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (g) {
      var kids = g.querySelectorAll(':scope > .fu, :scope > .fi, :scope > *');
      var i = 0;
      kids.forEach(function (k) {
        if (k.classList.contains('fu') || k.classList.contains('fi') || g.classList.contains('fu') || g.classList.contains('fi')) {
          k.style.setProperty('--d', (i * 90) + 'ms');
          if (!k.classList.contains('fu') && !k.classList.contains('fi')) k.classList.add('stag');
          i++;
        }
      });
    });
  });
  var profile = document.querySelector('.profile');
  if (profile) profile.style.setProperty('--d', '280ms');

  /* ── Reveal on scroll; settle afterwards so hover transitions stay snappy ── */
  function reveal(el) {
    if (el.classList.contains('vis')) return;
    el.classList.add('vis');
    el.querySelectorAll('.stag').forEach(function (s) { s.classList.add('vis'); });
    var d = parseInt(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(function () { el.classList.add('settled'); }, 1100 + d);
  }

  /* ── Count-up for metrics ── */
  var numSel = '.stat-num, .card-feature-stats b, .principle-stat b, .results li b, .hm-num, .stat-card .num';
  document.querySelectorAll(numSel).forEach(function (n) {
    if (/\d/.test(n.textContent)) n.setAttribute('data-count', '');
  });
  function countUp(el) {
    if (el.__counted) return; el.__counted = true;
    if (reduce) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [], t;
    while ((t = walker.nextNode())) if (/\d/.test(t.nodeValue)) nodes.push({ node: t, orig: t.nodeValue });
    if (!nodes.length) return;
    var dur = 1400, start = null;
    function ease(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur), e = ease(p);
      nodes.forEach(function (o) {
        o.node.nodeValue = o.orig.replace(/\d+(?:\.\d+)?/g, function (m) {
          var dec = (m.split('.')[1] || '').length;
          return (parseFloat(m) * e).toFixed(dec);
        });
      });
      if (p < 1) requestAnimationFrame(frame);
      else nodes.forEach(function (o) { o.node.nodeValue = o.orig; });
    }
    requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll('[data-count]');
  if (!reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var t = e.target; setTimeout(function () { countUp(t); }, 250); cio.unobserve(t); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('vis', 'settled'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    /* safety net: anything already scrolled past gets shown */
    window.addEventListener('load', function () {
      setTimeout(function () {
        revealEls.forEach(function (el) { if (el.getBoundingClientRect().bottom < 0) reveal(el); });
      }, 400);
    });
  }

  /* ── Nav border + reading progress ── */
  var nav = document.querySelector('.nav, nav');
  var bar = document.createElement('div');
  bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduce || !finePointer) return;

  /* ── Cursor spotlight on cards ── */
  document.querySelectorAll('.card, .pillar, .principle, .about-side, .decision, .glance, .role-box').forEach(function (c) {
    c.classList.add('spot');
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── Gentle 3D tilt on the profile card ── */
  if (profile) {
    profile.addEventListener('pointermove', function (e) {
      if (!profile.classList.contains('settled')) return;
      var r = profile.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      profile.style.transform = 'perspective(1000px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 5).toFixed(2) + 'deg) translateY(-2px)';
    });
    profile.addEventListener('pointerleave', function () { profile.style.transform = ''; });
  }
})();
