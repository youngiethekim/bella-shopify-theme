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
