/* Palette section: swatch copy-to-clipboard and card selection. */
(function () {
  document.querySelectorAll('.pal-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var names = (btn.getAttribute('data-colors') || '').split(',').map(function (c) {
        var p = c.split('|');
        return (p[0] || '').trim() + (p[1] ? ' ' + p[1].trim() : '');
      }).join(', ');
      var text = 'Palette: ' + btn.getAttribute('data-palette') + ' — ' + names;
      try { navigator.clipboard.writeText(text); } catch (e) {}
      var more = document.querySelector('.bb-more');
      if (more) {
        more.setAttribute('open', '');
        var input = more.querySelector('input');
        if (input) input.value = input.value ? input.value + ' · ' + text : text;
      }
      var old = btn.textContent;
      btn.textContent = 'Added to your order notes ✓';
      btn.classList.add('on');
      setTimeout(function () { btn.textContent = old; btn.classList.remove('on'); }, 2200);
    });
  });
})();
