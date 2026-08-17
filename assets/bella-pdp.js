/* ---- product page v2: thumbnails + sticky mobile order bar ---- */
(function () {
  var thumbs = document.getElementById('ShotThumbs'), main = document.getElementById('MainShot');
  if (thumbs && main) {
    thumbs.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        main.src = b.getAttribute('data-src');
        thumbs.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
  }
  var sticky = document.getElementById('BuySticky'), box = document.getElementById('BuyBox'),
      now = document.getElementById('BbNow'), stickyTotal = document.getElementById('StickyTotal');
  if (sticky && box) {
    if (now && stickyTotal && 'MutationObserver' in window) {
      new MutationObserver(function () { stickyTotal.textContent = now.textContent; })
        .observe(now, { childList: true, characterData: true, subtree: true });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        var passed = !e.isIntersecting && e.boundingClientRect.top < 0;
        sticky.classList.toggle('on', passed);
      }, { threshold: 0 }).observe(box);
    }
  }
})();

/* ---- lookbook favorites: hearts, saved-looks bar, order handoff ---- */
(function () {
  var root = document.querySelector('.blb');
  if (!root) return;
  var grid = root.querySelector('.blb-grid');
  if (!grid) return;
  var FKEY = 'bella_lookbook_favs', favs = [];
  try { favs = JSON.parse(localStorage.getItem(FKEY) || '[]'); } catch (e) { favs = []; }
  if (!Array.isArray(favs)) favs = [];
  function save() { try { localStorage.setItem(FKEY, JSON.stringify(favs)); } catch (e) {} }
  var ORDER_URL = root.getAttribute('data-order-url') || '/collections/all';
  function toast(m) {
    var t = document.querySelector('.blb-toast'); if (!t) return;
    t.textContent = m; t.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  var bar = document.createElement('div');
  bar.className = 'blb-favbar';
  var cnt = document.createElement('span'); cnt.className = 'fb-count';
  var cpy = document.createElement('button'); cpy.type = 'button'; cpy.className = 'fb-copy'; cpy.textContent = 'Copy codes';
  var ord = document.createElement('a'); ord.className = 'fb-order'; ord.textContent = 'Use in my order →';
  bar.appendChild(cnt); bar.appendChild(cpy); bar.appendChild(ord);
  document.body.appendChild(bar);
  function paint() {
    grid.querySelectorAll('.blb-fav').forEach(function (b) {
      b.classList.toggle('on', favs.indexOf(b.getAttribute('data-sku')) > -1);
    });
    cnt.innerHTML = '<b>' + favs.length + '</b> look' + (favs.length === 1 ? '' : 's') + ' saved';
    bar.classList.toggle('on', favs.length > 0);
    ord.href = ORDER_URL + '?looks=' + encodeURIComponent(favs.join(','));
  }
  function inject() {
    grid.querySelectorAll('.blb-ph').forEach(function (ph) {
      if (ph.querySelector('.blb-fav')) return;
      var skuEl = ph.querySelector('.blb-sku'); if (!skuEl) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'blb-fav';
      b.setAttribute('data-sku', skuEl.textContent.trim());
      b.setAttribute('aria-label', 'Save this look');
      b.textContent = '♥';
      ph.appendChild(b);
    });
    paint();
  }
  function toggle(sku) {
    if (!sku) return;
    var i = favs.indexOf(sku);
    if (i > -1) { favs.splice(i, 1); toast('Removed ' + sku); }
    else { favs.push(sku); toast('Saved ' + sku + ' ♥'); }
    save(); paint();
  }
  grid.addEventListener('click', function (e) {
    var f = e.target.closest('.blb-fav');
    if (f) { e.preventDefault(); e.stopPropagation(); toggle(f.getAttribute('data-sku')); }
  }, true);
  cpy.addEventListener('click', function () {
    try { navigator.clipboard.writeText(favs.join(', ')); } catch (e) {}
    toast('Copied ' + favs.length + ' code' + (favs.length === 1 ? '' : 's'));
  });
  new MutationObserver(inject).observe(grid, { childList: true });
  var lb = document.querySelector('.blb-lb');
  if (lb) {
    var copyBtn = lb.querySelector('.lb-copy');
    var wrap = copyBtn && copyBtn.parentElement;
    var metaEl = lb.querySelector('.lb-meta');
    if (wrap && metaEl) {
      var lf = document.createElement('button');
      lf.type = 'button'; lf.className = 'lb-fav';
      wrap.insertBefore(lf, wrap.firstChild);
      var lbSku = function () {
        var parts = (metaEl.textContent || '').split('·');
        return (parts[parts.length - 1] || '').trim();
      };
      var lbPaint = function () {
        lf.textContent = favs.indexOf(lbSku()) > -1 ? '♥ Saved' : '♡ Save look';
      };
      lf.addEventListener('click', function () { toggle(lbSku()); lbPaint(); });
      new MutationObserver(lbPaint).observe(metaEl, { childList: true, characterData: true, subtree: true });
      lbPaint();
    }
  }
  inject();
})();

/* ---- per-variant spec line under the type selector ---- */
(function () {
  var spec = document.getElementById('BbSpec'), sel = document.getElementById('BuyVariant');
  if (!spec || !sel || sel.tagName !== 'SELECT') return;
  var map = [];
  (spec.getAttribute('data-specs') || '').split('\n').forEach(function (l) {
    var i = l.indexOf('|');
    if (i > 0) map.push([l.slice(0, i).trim().toLowerCase(), l.slice(i + 1).trim()]);
  });
  if (!map.length) return;
  function paint() {
    var t = sel.options[sel.selectedIndex].textContent.trim().toLowerCase();
    var hit = null;
    map.forEach(function (m) { if (!hit && t.indexOf(m[0]) === 0) hit = m[1]; });
    spec.textContent = hit || '';
    spec.style.display = hit ? '' : 'none';
  }
  sel.addEventListener('change', paint);
  paint();
})();

/* ---- recommended quantity badge ---- */
(function () {
  var reco = document.getElementById('BbReco'), qty = document.getElementById('BuyQty');
  if (!reco || !qty) return;
  var n = parseInt(reco.getAttribute('data-reco'), 10) || 1;
  var txt = reco.querySelector('.br-txt');
  function paint() {
    var on = parseInt(qty.value, 10) === n;
    reco.classList.toggle('on', on);
    txt.textContent = on ? 'Most popular' : 'Most popular: ' + n;
  }
  reco.addEventListener('click', function (e) {
    e.preventDefault();
    qty.value = n;
    qty.dispatchEvent(new Event('input', { bubbles: true }));
    qty.dispatchEvent(new Event('change', { bubbles: true }));
    paint();
  });
  ['input', 'change'].forEach(function (ev) { qty.addEventListener(ev, paint); });
  ['QtyMinus', 'QtyPlus'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', function () { setTimeout(paint, 0); });
  });
  paint();
})();

/* ---- ajax add-to-cart: stay on the page so buyers can mix types in one order ---- */
(function () {
  var form = document.getElementById('BellaProductForm'), box = document.getElementById('BuyBox');
  if (!form || !box || !window.fetch || !window.FormData) return;

  function fmt(cents) {
    var f = box.getAttribute('data-money-format') || '${{amount}}';
    var n = (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return f
      .replace(/\{\{\s*amount\s*\}\}/, n)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  }

  var panel = null;
  function show(item, cart) {
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'bb-added';
      var btn = box.querySelector('.prod-buy');
      if (btn && btn.nextElementSibling) box.insertBefore(panel, btn.nextElementSibling);
      else box.appendChild(panel);
    }
    var what = item.variant_title && item.variant_title !== 'Default Title'
      ? item.variant_title : item.product_title;
    panel.innerHTML = '';
    var line = document.createElement('div');
    line.className = 'ba-line';
    line.innerHTML = '✓ Added — <b></b>';
    line.querySelector('b').textContent = what + ' × ' + item.quantity;
    var sub = document.createElement('div');
    sub.className = 'ba-cart';
    sub.textContent = 'Your order: ' + cart.item_count + ' item' + (cart.item_count === 1 ? '' : 's') +
      ' · ' + fmt(cart.total_price);
    var acts = document.createElement('div');
    acts.className = 'ba-actions';
    var go = document.createElement('a');
    go.className = 'btn'; go.href = '/cart'; go.textContent = 'Review & check out →';
    var again = document.createElement('button');
    again.type = 'button'; again.className = 'ba-again'; again.textContent = '+ Add another';
    again.addEventListener('click', function () {
      panel.classList.remove('on');
      var v = document.getElementById('BuyVariant');
      if (v && v.tagName === 'SELECT') v.focus();
    });
    acts.appendChild(go); acts.appendChild(again);
    panel.appendChild(line); panel.appendChild(sub); panel.appendChild(acts);
    panel.classList.add('on');
    var r = panel.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) panel.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  var busy = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    busy = true;
    var btns = document.querySelectorAll('.prod-buy');
    btns.forEach(function (b) { b.dataset.lbl = b.textContent; b.disabled = true; b.textContent = 'Adding…'; });
    fetch('/cart/add.js', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then(function (r) { if (!r.ok) throw new Error('add failed'); return r.json(); })
      .then(function (item) {
        return fetch('/cart.js').then(function (r) { return r.json(); }).then(function (cart) {
          document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = cart.item_count; });
          show(item, cart);
        });
      })
      .catch(function () { form.submit(); })
      .then(function () {
        busy = false;
        btns.forEach(function (b) { b.disabled = false; if (b.dataset.lbl) b.textContent = b.dataset.lbl; });
      });
  });
})();

/* ---- portfolio: tap toggles before/after on touch devices ---- */
(function () {
  document.querySelectorAll('.pf-card').forEach(function (c) {
    c.addEventListener('click', function () { c.classList.toggle('on'); });
  });
})();

/* ---- product page: saved looks arrive via ?looks= and attach to the order ---- */
(function () {
  var form = document.getElementById('BellaProductForm'), box = document.getElementById('BuyBox');
  if (!form || !box) return;
  var m = location.search.match(/[?&]looks=([^&]+)/);
  if (!m) return;
  var looks = decodeURIComponent(m[1]).split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 40);
  if (!looks.length) return;
  var inp = document.createElement('input');
  inp.type = 'hidden';
  inp.name = 'properties[Lookbook styles]';
  inp.value = looks.join(', ');
  form.appendChild(inp);
  var row = document.createElement('div');
  row.className = 'bb-looks';
  var lead = document.createElement('span');
  lead.textContent = '♥ ' + looks.length + ' look' + (looks.length === 1 ? '' : 's') + ' from your lookbook attached:';
  row.appendChild(lead);
  looks.slice(0, 8).forEach(function (s) {
    var c = document.createElement('span'); c.className = 'chip'; c.textContent = s; row.appendChild(c);
  });
  if (looks.length > 8) {
    var more = document.createElement('span'); more.textContent = '+' + (looks.length - 8) + ' more'; row.appendChild(more);
  }
  var btn = box.querySelector('.prod-buy');
  if (btn) box.insertBefore(row, btn); else box.appendChild(row);
})();

/* floating order CTA: appears once the user starts scrolling */
(function () {
  var fl = document.getElementById('BbFloat');
  if (!fl) return;
  var tick = false;
  function update() {
    tick = false;
    var y = window.scrollY || document.documentElement.scrollTop;
    fl.classList.toggle('on', y > 320);
  }
  window.addEventListener('scroll', function () {
    if (!tick) { tick = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

/* ---- variant -> image switching: the photo follows the selected type ---- */
(function () {
  var sel = document.getElementById('BuyVariant'), main = document.getElementById('MainShot');
  if (!sel || !main || sel.tagName !== 'SELECT') return;
  function swap() {
    var src = sel.options[sel.selectedIndex].getAttribute('data-image');
    if (!src || main.src === src) return;
    main.src = src;
    var thumbs = document.getElementById('ShotThumbs');
    if (thumbs) thumbs.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-src') === src);
    });
  }
  sel.addEventListener('change', swap);
  swap();
})();
