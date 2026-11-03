(function () {
  var L = window.Lab;
  var q = (L.param('q') || '').trim();
  var category = L.param('categoria') || '';
  var sort = 'relevancia';
  var grid = document.getElementById('product-grid');
  var categories = Array.from(new Set(window.PRODUCTS.map(function (p) { return p.category; })));

  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function render() {
    var list = window.PRODUCTS.filter(function (p) {
      if (category && p.category !== category) return false;
      if (q && norm(p.name + ' ' + p.category + ' ' + p.category2 + ' ' + p.brand).indexOf(norm(q)) === -1) return false;
      return true;
    });
    if (sort === 'menor') list.sort(function (a, b) { return a.price - b.price; });
    if (sort === 'maior') list.sort(function (a, b) { return b.price - a.price; });

    document.getElementById('list-title').textContent = q
      ? 'Resultados para “' + q + '” (' + list.length + ')'
      : category || 'Todos os produtos';

    L.renderProductGrid(grid, list);
  }

  var chips = document.getElementById('categories');
  chips.innerHTML = '<button class="chip' + (!category ? ' active' : '') + '" data-cat="" data-gtm="filtro-categoria">Todas</button>' +
    categories.map(function (c) {
      return '<button class="chip' + (c === category ? ' active' : '') + '" data-cat="' + L.esc(c) + '" data-gtm="filtro-categoria">' + L.esc(c) + '</button>';
    }).join('');

  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    category = b.dataset.cat;
    chips.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === b); });
    var url = new URL(location.href);
    if (category) url.searchParams.set('categoria', category); else url.searchParams.delete('categoria');
    history.replaceState(null, '', url);
    render();
  });

  document.getElementById('sort').addEventListener('change', function () {
    sort = this.value;
    render();
  });

  render();
})();
