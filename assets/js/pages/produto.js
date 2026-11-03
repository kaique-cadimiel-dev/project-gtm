(function () {
  var L = window.Lab;
  var el = document.getElementById('product');
  var p = L.getProduct(L.param('id'));

  if (!p) {
    el.innerHTML = '<div class="card"><h1>Produto não encontrado</h1><p><a href="produtos.html">Ver catálogo</a></p></div>';
    L.track('product_not_found', { requested_id: L.param('id') || '' });
    return;
  }

  document.title = p.name + ' | GTM Lab Store';

  // Lista de origem (select_item na página anterior), para manter a atribuição de lista
  var sel = L.SS.get('gtmlab_selected', null);
  var list = sel && sel.item_id === p.id ? { id: sel.list_id, name: sel.list_name } : null;

  el.innerHTML =
    '<div class="product-detail" data-item-id="' + p.id + '">' +
    '<div class="card"><div class="product-thumb">' + p.emoji + '</div></div>' +
    '<div><span class="muted">' + L.esc(p.brand) + ' · ' + L.esc(p.category) + ' › ' + L.esc(p.category2) + '</span>' +
    '<h1>' + L.esc(p.name) + '</h1>' +
    '<p class="price" style="font-size:1.6rem;margin:0">' + L.brl(p.price) + '</p>' +
    '<p class="small muted">ou 3x de ' + L.brl(L.round(p.price / 3)) + ' sem juros</p>' +
    '<p>' + L.esc(p.desc) + '</p>' +
    '<div class="form">' +
    '<label>Variação<div class="chips" id="variants" style="margin-top:6px">' +
    p.variants.map(function (v, i) { return '<button type="button" class="chip' + (i === 0 ? ' active' : '') + '" data-variant="' + L.esc(v) + '">' + L.esc(v) + '</button>'; }).join('') +
    '</div></label>' +
    '<label>Quantidade<div><span class="qty" style="margin-top:6px"><button type="button" id="qty-minus" aria-label="Diminuir">−</button>' +
    '<input id="qty" type="number" min="1" max="10" value="1" aria-label="Quantidade"><button type="button" id="qty-plus" aria-label="Aumentar">+</button></span></div></label>' +
    '<div class="row">' +
    '<button class="btn" id="add-to-cart" data-gtm="add-to-cart">🛒 Adicionar ao carrinho</button>' +
    '<button class="btn btn-accent" id="buy-now" data-gtm="buy-now">Comprar agora</button>' +
    '<button class="btn btn-outline" id="wishlist" data-gtm="wishlist">♡ Favoritar</button>' +
    '</div>' +
    '<button class="btn btn-outline btn-sm" id="share" data-gtm="share" style="justify-self:start">🔗 Compartilhar</button>' +
    '</div></div></div>';

  var variant = p.variants[0];
  var qtyInput = document.getElementById('qty');
  function qty() { return Math.max(1, Math.min(10, parseInt(qtyInput.value, 10) || 1)); }

  L.track('view_item', {
    ecommerce: L.ecommerce([L.toItem(p, { variant: variant, list_id: list && list.id, list_name: list && list.name })])
  });

  document.getElementById('variants').addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    variant = b.dataset.variant;
    this.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === b); });
    L.track('select_variant', { item_id: p.id, item_variant: variant });
  });
  document.getElementById('qty-minus').onclick = function () { qtyInput.value = Math.max(1, qty() - 1); };
  document.getElementById('qty-plus').onclick = function () { qtyInput.value = Math.min(10, qty() + 1); };

  document.getElementById('add-to-cart').onclick = function () { L.addToCart(p, variant, qty(), list); };

  document.getElementById('buy-now').onclick = function () {
    L.Cart.add(p.id, variant, qty(), list);
    L.trackThenGo('add_to_cart', {
      ecommerce: L.ecommerce([L.toItem(p, { variant: variant, quantity: qty(), list_id: list && list.id, list_name: list && list.name })])
    }, 'checkout.html');
  };

  document.getElementById('wishlist').onclick = function () {
    L.track('add_to_wishlist', { ecommerce: L.ecommerce([L.toItem(p, { variant: variant })]) });
    this.textContent = '♥ Favoritado';
    this.disabled = true;
  };

  document.getElementById('share').onclick = function () {
    L.track('share', { method: 'copiar_link', content_type: 'product', item_id: p.id });
    try { navigator.clipboard.writeText(location.href); } catch (e) {}
    L.toast('🔗 Link copiado');
  };

  var related = window.PRODUCTS.filter(function (x) { return x.id !== p.id; })
    .sort(function (a, b) { return (b.category === p.category) - (a.category === p.category); })
    .slice(0, 4);
  L.renderProductGrid(document.getElementById('related'), related, { id: 'relacionados', name: 'Produtos relacionados' });
})();
