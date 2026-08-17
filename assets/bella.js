/* Bella theme JS — ported from the design mockups */
(function () {
  'use strict';

  /* ---- hero video: replay with a beat after it ends ---- */
  (function () {
    var v = document.querySelector('.hero-vid, .hero video');
    if (!v) return;
    v.addEventListener('ended', function () {
      setTimeout(function () { try { v.currentTime = 0; v.play(); } catch (e) {} }, 3500);
    });
  })();

  /* ---- generic before/after compare sliders ---- */
  document.querySelectorAll('.compare').forEach(function (el) {
    var clip = el.querySelector('.clip'), h = el.querySelector('.h'), down = false;
    if (!clip || !h) return;
    function setPct(p) { p = Math.max(0, Math.min(100, p)); clip.style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)'; h.style.left = p + '%'; }
    function set(x) { var r = el.getBoundingClientRect(); if (!r.width) return; setPct(((x - r.left) / r.width) * 100); }
    var isHero = el.closest('.hero'), auto = !!isHero, raf = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function loop(t) {
      if (!auto) return;
      var phase = (t % 6000) / 6000;
      var e = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
      setPct(14 + e * 72);
      raf = requestAnimationFrame(loop);
    }
    function stopAuto() { if (!auto) return; auto = false; if (raf) cancelAnimationFrame(raf); if (isHero) isHero.classList.add('touched'); }
    if (auto && !reduce) { raf = requestAnimationFrame(loop); } else if (auto) { setPct(62); }
    el.addEventListener('pointerdown', function (e) { down = true; stopAuto(); set(e.clientX); e.preventDefault(); });
    el.addEventListener('mouseenter', function () { stopAuto(); });
    window.addEventListener('pointermove', function (e) { if (down) set(e.clientX); });
    window.addEventListener('pointerup', function () { down = false; });
  });

  /* ---- before/after project browser (drag divider, thumbs, arrows) ---- */
  (function () {
    var wrap = document.getElementById('pbrowse'); if (!wrap) return;
    var slider = document.getElementById('pbSlider'), beforeI = document.getElementById('pbBefore'),
        afterI = document.getElementById('pbAfter'), roomEl = document.getElementById('pbRoom'),
        numEl = document.getElementById('pbNum'), thumbsWrap = document.getElementById('pbThumbs');
    var thumbs = [].slice.call(thumbsWrap.querySelectorAll('button'));
    if (!thumbs.length) return;
    var i = 0;
    document.getElementById('pbTot').textContent = ('0' + thumbs.length).slice(-2);
    thumbs.forEach(function (b, x) { b.addEventListener('click', function () { go(x); }); });
    function setX(pct) { pct = Math.max(2, Math.min(98, pct)); slider.style.setProperty('--x', pct + '%'); }
    function paint() {
      var t = thumbs[i];
      beforeI.src = t.getAttribute('data-before'); beforeI.alt = t.getAttribute('data-room') + ' before staging';
      afterI.src = t.getAttribute('data-after'); afterI.alt = t.getAttribute('data-room') + ' staged';
      roomEl.textContent = t.getAttribute('data-room'); numEl.textContent = ('0' + (i + 1)).slice(-2);
      thumbs.forEach(function (b, x) { b.classList.toggle('on', x === i); });
      setX(56);
    }
    function go(x) { i = (x + thumbs.length) % thumbs.length; paint(); }
    document.getElementById('pbPrev').onclick = function () { go(i - 1); };
    document.getElementById('pbNext').onclick = function () { go(i + 1); };
    var dragging = false;
    function fromEvent(e) { var r = slider.getBoundingClientRect(); var cx = (e.touches ? e.touches[0].clientX : e.clientX); setX((cx - r.left) / r.width * 100); }
    slider.addEventListener('pointerdown', function (e) { dragging = true; fromEvent(e); try { if (e.pointerId != null) slider.setPointerCapture(e.pointerId); } catch (_) {} });
    slider.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    window.addEventListener('pointerup', function () { dragging = false; });
    wrap.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') { go(i - 1); } else if (e.key === 'ArrowRight') { go(i + 1); } });
    paint();
  })();

  /* ---- completed jobs: tap-to-peek + mouse drag-scroll ---- */
  (function () {
    var el = document.getElementById('jobs'); if (!el) return;
    el.addEventListener('click', function (e) { var c = e.target.closest('.job-card'); if (c) c.classList.toggle('peek'); });
    var down = false, moved = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 6) { moved = true; el.classList.add('dragging'); }
      if (moved) el.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () { down = false; el.classList.remove('dragging'); });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  })();

  /* ---- scroll reveal ---- */
  (function () {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var els = [].slice.call(document.querySelectorAll('main section, main .doors'));
    if (!els.length) return;
    function force(el) { el.style.setProperty('transition', 'none', 'important'); el.style.setProperty('opacity', '1', 'important'); el.style.setProperty('transform', 'none', 'important'); }
    els.forEach(function (el) { el.classList.add('bv-r'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var el = e.target; el.classList.add('bv-in'); setTimeout(function () { force(el); }, 900); io.unobserve(el); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(force); }, 4000);
  })();

  /* ---- Bella assistant (scripted) ---- */
  (function () {
    var launch = document.getElementById('baLaunch'), panel = document.getElementById('baPanel');
    if (!launch || !panel) return;
    var body = document.getElementById('baBody'), chipsEl = document.getElementById('baChips'),
        form = document.getElementById('baForm'), input = document.getElementById('baInput'), started = false;
    var ORDER = panel.getAttribute('data-order-url') || '/', PRICING = panel.getAttribute('data-pricing-url') || '/',
        SERVICES = panel.getAttribute('data-services-url') || '/';
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    function add(cls, html) { var d = document.createElement('div'); d.className = 'ba-msg ' + cls; d.innerHTML = html; body.appendChild(d); body.scrollTop = body.scrollHeight; }
    function acts(list) {
      if (!list || !list.length) return; var w = document.createElement('div'); w.className = 'ba-acts';
      w.innerHTML = list.map(function (a) { return a.href ? '<a class="ba-act' + (a.primary ? ' primary' : '') + '" href="' + a.href + '">' + a.label + '</a>' : '<button type="button" class="ba-act' + (a.primary ? ' primary' : '') + '" data-q="' + esc(a.q || a.label) + '">' + a.label + '</button>'; }).join('');
      body.appendChild(w); body.scrollTop = body.scrollHeight;
      w.querySelectorAll('button[data-q]').forEach(function (b) { b.onclick = function () { ask(b.getAttribute('data-q')); }; });
    }
    function typing() { var t = document.createElement('div'); t.className = 'ba-typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); body.scrollTop = body.scrollHeight; return t; }
    function answer(q) {
      q = q.toLowerCase();
      if (/price|cost|how much|pricing|\$|expensive|rate|cheap/.test(q))
        return { t: 'Virtual staging is priced per photo, paid once, with volume discounts up to 20% — most listings only need 5 to 8 photos. Floor plans, photo edits, tours and 3D renders each have simple per-item pricing on their pages. Want the full breakdown, or shall I start your order?', a: [{ label: 'See full pricing', href: PRICING }, { label: 'Start my order →', href: ORDER, primary: true }] };
      if (/which|what.*(service|need)|not sure|recommend|choose|help me decide/.test(q))
        return { t: 'Happy to help. Quick version — <b>Virtual staging</b> for empty or dated rooms, <b>3D renders</b> if it isn’t built yet, plus <b>floor plans</b> and <b>3D tours</b> to round out the listing.', a: [{ label: 'See all services', href: SERVICES }, { label: 'Start my order →', href: ORDER, primary: true }] };
      if (/how.*work|turnaround|how long|fast|time|revision|process|deliver/.test(q))
        return { t: 'Simple: upload your photos → real interior designers stage them → back in <b>24–48 hours</b>, MLS-ready. You approve every photo, and revisions are free and unlimited for two weeks.', a: [{ label: 'Start my order →', href: ORDER, primary: true }] };
      if (/what is|virtual staging|explain|how.*stage/.test(q))
        return { t: 'Virtual staging digitally furnishes your listing photos so buyers can picture the home — at a fraction of the cost of physical staging. Real interior designers do it (never one-click AI), matched to your buyer and market.', a: [{ label: 'See before & afters', href: '#work' }, { label: 'Start my order →', href: ORDER, primary: true }] };
      if (/start|order|buy|get started|place|checkout/.test(q))
        return { t: 'Perfect — pick your service, tell us how many photos, and check out. You can send the photos right after you order.', a: [{ label: 'Start my order →', href: ORDER, primary: true }, { label: 'See pricing first', href: PRICING }] };
      if (/mls|legal|disclosure|allowed|license/.test(q))
        return { t: 'Yes — every image is built to MLS specs and disclosure standards (like AB 723), and we tell you exactly what to note. Check your local board for any extra requirements.', a: [{ label: 'Start my order →', href: ORDER, primary: true }] };
      return { t: 'Good question. Quickest path to a precise answer is our pricing page, or just start an order and we’ll guide you the whole way. What are you working on?', a: [{ label: 'See pricing', href: PRICING }, { label: 'Which service do I need?', q: 'which service do I need' }, { label: 'Start my order →', href: ORDER, primary: true }] };
    }
    function ask(q) { add('me', esc(q)); var r = answer(q), t = typing(); setTimeout(function () { t.remove(); add('them', r.t); acts(r.a); }, 650 + Math.min(600, q.length * 8)); }
    var CHIPS = ['How much is it?', 'Which service do I need?', 'How does it work?', 'Start my order'];
    function boot() {
      if (started) return; started = true;
      add('them', 'Hi 👋 I’m Bella’s assistant. Ask me anything — pricing, which service fits your listing, or I can walk you through placing an order.');
      chipsEl.innerHTML = CHIPS.map(function (c) { return '<button type="button" class="ba-chip" data-q="' + c + '">' + c + '</button>'; }).join('');
      chipsEl.querySelectorAll('.ba-chip').forEach(function (b) { b.onclick = function () { ask(b.getAttribute('data-q')); }; });
    }
    launch.onclick = function () { panel.classList.add('open'); launch.style.display = 'none'; boot(); setTimeout(function () { input.focus(); }, 80); };
    document.getElementById('baClose').onclick = function () { panel.classList.remove('open'); launch.style.display = ''; };
    form.onsubmit = function (e) { e.preventDefault(); var v = input.value.trim(); if (!v) return; input.value = ''; ask(v); };
  })();

  /* ---- free-stage popup ---- */
  (function () {
    var KEY = 'bella_freestage_v1', back = document.getElementById('fsBack');
    if (!back) return;
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (stored === 'done') return;
    var vis = document.getElementById('fsVis'), tag = document.getElementById('fsTag');
    var shown = false, fired = false, faded = false;
    function crossfade() { if (faded) return; faded = true; setInterval(function () { var on = vis.classList.toggle('show-after'); tag.textContent = on ? 'After · staged' : 'Before'; }, 2600); }
    function open() { if (shown) return; shown = true; back.classList.add('on'); crossfade(); document.body.style.overflow = 'hidden'; }
    function close(dismiss) { back.classList.remove('on'); document.body.style.overflow = ''; if (dismiss) { try { localStorage.setItem(KEY, 'dismiss'); } catch (e) {} } }
    document.addEventListener('mouseout', function (e) { if (!fired && e.clientY <= 0 && !e.relatedTarget) { fired = true; open(); } });
    window.addEventListener('scroll', function () {
      if (fired) return; var s = (window.scrollY + innerHeight) / document.documentElement.scrollHeight;
      if (s > 0.55) { fired = true; open(); }
    }, { passive: true });
    setTimeout(function () { if (!fired) { fired = true; open(); } }, 30000);
    document.getElementById('fsX').onclick = function () { close(true); };
    back.addEventListener('click', function (e) { if (e.target === back) close(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && back.classList.contains('on')) close(true); });
    var fm = document.getElementById('fsFm');
    if (fm) {
      fm.addEventListener('submit', function (e) {
        var role = document.getElementById('fsRole').value;
        if (role === 'notpro') {
          e.preventDefault();
          document.getElementById('fsForm').style.display = 'none';
          document.getElementById('fsGate').style.display = 'block';
          return;
        }
        try { localStorage.setItem(KEY, 'done'); } catch (err) {}
        /* form posts natively to Shopify's contact endpoint */
      });
    }
  })();
})();

/* ---- product buy box: quantity, live volume pricing, tier chips ---- */
(function () {
  var box = document.getElementById('BuyBox');
  if (!box) return;
  var qtyEl = document.getElementById('BuyQty'),
      minus = document.getElementById('QtyMinus'),
      plus = document.getElementById('QtyPlus'),
      variantEl = document.getElementById('BuyVariant'),
      nowEl = document.getElementById('BbNow'),
      wasEl = document.getElementById('BbWas'),
      perEl = document.getElementById('BbPer'),
      saveEl = document.getElementById('BbSave'),
      nudgeEl = document.getElementById('BbNudge'),
      tiersEl = document.getElementById('BbTiers'),
      phUnit = document.getElementById('PhUnit');

  var tiersOn = box.getAttribute('data-tiers-enabled') === 'true';
  var unit = box.getAttribute('data-unit-label') || 'photo';
  var fmt = box.getAttribute('data-money-format') || '${{amount}}';
  var RECO = parseInt(box.getAttribute('data-reco'), 10) || 0;
  var TIERS = [];
  try { TIERS = JSON.parse(box.getAttribute('data-tiers') || '[]'); } catch (e) {}
  TIERS = TIERS.filter(function (t) { return t && t.m > 0 && t.d > 0; }).sort(function (a, b) { return a.m - b.m; });

  function money(cents) {
    var n = cents / 100;
    var amount = (n % 1 === 0) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return fmt
      .replace(/\{\{\s*amount\s*\}\}/g, amount)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, Math.round(n).toLocaleString('en-US'))
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, amount.replace(/,/g, ' ').replace('.', ','))
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/g, Math.round(n).toLocaleString('en-US'));
  }
  function unitPrice() {
    if (!variantEl) return 0;
    if (variantEl.tagName === 'SELECT') {
      var o = variantEl.options[variantEl.selectedIndex];
      return o ? parseInt(o.getAttribute('data-price'), 10) || 0 : 0;
    }
    return parseInt(variantEl.getAttribute('data-price'), 10) || 0;
  }
  function qty() { return Math.max(1, Math.min(99, parseInt(qtyEl.value, 10) || 1)); }
  function discFor(q) {
    if (!tiersOn) return 0;
    var d = 0;
    TIERS.forEach(function (t) { if (q >= t.m) d = t.d; });
    return d;
  }
  function nextTier(q) {
    for (var i = 0; i < TIERS.length; i++) { if (TIERS[i].m > q) return TIERS[i]; }
    return null;
  }
  function paint() {
    var q = qty(), u = unitPrice(), d = discFor(q);
    var full = u * q, disc = Math.round(full * (1 - d / 100));
    nowEl.textContent = money(disc);
    if (d > 0) { wasEl.hidden = false; wasEl.textContent = money(full); } else { wasEl.hidden = true; }
    var perNow = Math.round(u * (1 - d / 100));
    perEl.textContent = q + ' ' + unit + (q === 1 ? '' : 's') + ' × ' + money(perNow) + ' / ' + unit;
    if (phUnit) phUnit.textContent = money(perNow);
    if (saveEl) {
      saveEl.textContent = d > 0
        ? '✓ ' + d + '% volume discount — you save ' + money(full - disc) + ' (applied at checkout)'
        : (tiersOn && TIERS.length ? '' : '');
    }
    if (nudgeEl) {
      var nt = nextTier(q);
      nudgeEl.textContent = (tiersOn && nt)
        ? 'Add ' + (nt.m - q) + ' more ' + unit + (nt.m - q === 1 ? '' : 's') + ' to unlock ' + nt.d + '% off'
        : (tiersOn && d > 0 && !nt ? 'Top tier unlocked — your best price.' : '');
    }
    if (tiersEl) {
      tiersEl.innerHTML = TIERS.map(function (t, i) {
        var on = q >= t.m && (nextTier(q) === null ? t.d === discFor(q) : t.d === discFor(q));
        var best = i === TIERS.length - 1 ? '<span class="bt-best">Best value</span>' : (t.m === RECO ? '<span class="bt-best bt-pop">Most popular</span>' : '');
        return '<button type="button" class="bb-tier' + (on ? ' on' : '') + '" data-q="' + t.m + '">' + best + '<b>' + t.d + '% off</b>' + t.m + '+ ' + unit + 's</button>';
      }).join('');
      tiersEl.querySelectorAll('button').forEach(function (b) {
        b.onclick = function () { qtyEl.value = b.getAttribute('data-q'); paint(); };
      });
    }
  }
  minus.addEventListener('click', function () { qtyEl.value = Math.max(1, qty() - 1); paint(); });
  plus.addEventListener('click', function () { qtyEl.value = Math.min(99, qty() + 1); paint(); });
  qtyEl.addEventListener('input', paint);
  qtyEl.addEventListener('change', function () { qtyEl.value = qty(); paint(); });
  if (variantEl && variantEl.tagName === 'SELECT') variantEl.addEventListener('change', paint);
  paint();
})();

/* ---- mobile menu toggle ---- */
(function () {
  var burger = document.getElementById('NavBurger'), panel = document.getElementById('MobileNav');
  if (!burger || !panel) return;
  function setOpen(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('open', open);
  }
  burger.addEventListener('click', function () {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
})();
