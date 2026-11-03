(function () {
  var L = window.Lab;
  var q = (L.param('q') || '').trim();
  var category = L.param('categoria') || '';
  var sort = 'relevancia';
  var grid = document.getElementById('product-grid');
  var categories = Array.from(new Set(window.PRODUCTS.map(function (p) { return p.category; })));

  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  if (q) L.track('search', { search_term: q });

  function render() {
    var list = window.PRODUCTS.filter(function (p) {
      if (category && p.category !== category) return false;
      if (q && norm(p.name + ' ' + p.category + ' ' + p.category2 + ' ' + p.brand).indexOf(norm(q)) === -1) return false;
      return true;
    });
    if (sort === 'menor') list.sort(function (a, b) { return a.price - b.price; });
    if (sort === 'maior') list.sort(function (a, b) { return b.price - a.price; });

    var listInfo = q
      ? { id: 'resultado_busca', name: 'Resultado da busca' }
      : category
        ? { id: 'categoria_' + norm(category), name: 'Categoria - ' + category }
        : { id: 'catalogo', name: 'Catálogo completo' };

    document.getElementById('list-title').textContent = q
      ? 'Resultados para “' + q + '” (' + list.length + ')'
      : category || 'Todos os produtos';

    if (q && !list.length) L.track('search_no_results', { search_term: q });
    L.renderProductGrid(grid, list, listInfo);
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
    L.track('filter_category', { filter_value: category || 'todas' });
    render();
  });

  document.getElementById('sort').addEventListener('change', function () {
    sort = this.value;
    L.track('sort_products', { sort_by: sort });
    render();
  });

  render();
})();
