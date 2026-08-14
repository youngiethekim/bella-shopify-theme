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
  var ORDER_URL = '/products/virtual-staging-1';
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
