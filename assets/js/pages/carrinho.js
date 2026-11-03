(function () {
  var L = window.Lab;
  var Cart = L.Cart;
  var el = document.getElementById('cart');

  function render() {
    var lines = Cart.lines();
    if (!lines.length) {
      el.innerHTML = '<div class="card"><p>Seu carrinho está vazio.</p><a class="btn" href="produtos.html">Ver produtos</a></div>';
      return;
    }
    var subtotal = Cart.subtotal();
    var discount = L.round(subtotal * Cart.discountRate());
    el.innerHTML =
      '<div class="layout-cart"><div class="card">' +
      lines.map(function (l) {
        return '<div class="cart-line" data-id="' + l.id + '" data-variant="' + L.esc(l.variant) + '">' +
          '<div class="product-thumb">' + l.product.emoji + '</div>' +
          '<div><a href="produto.html?id=' + l.id + '"><strong>' + L.esc(l.product.name) + '</strong></a>' +
          '<div class="small muted">' + L.esc(l.variant) + ' · ' + L.brl(l.product.price) + '</div></div>' +
          '<span class="qty"><button data-act="minus" aria-label="Diminuir">−</button><input value="' + l.quantity + '" readonly aria-label="Quantidade"><button data-act="plus" aria-label="Aumentar">+</button></span>' +
          '<button class="btn btn-danger btn-sm" data-act="remove" data-gtm="remove-from-cart">Remover</button>' +
          '</div>';
      }).join('') +
      '</div><aside class="card summary">' +
      '<h3 style="margin-top:0">Resumo</h3>' +
      '<div class="summary-row"><span>Subtotal</span><span>' + L.brl(subtotal) + '</span></div>' +
      (discount ? '<div class="summary-row" style="color:var(--ok)"><span>Cupom ' + L.esc(Cart.coupon()) + '</span><span>− ' + L.brl(discount) + '</span></div>' : '') +
      '<div class="summary-row summary-total"><span>Total</span><span>' + L.brl(subtotal - discount) + '</span></div>' +
      '<p class="small muted">Frete calculado no checkout.</p>' +
      '<form id="coupon-form" class="row" style="margin:12px 0">' +
      '<input name="coupon" placeholder="Cupom (tente GTM10)" value="' + L.esc(Cart.coupon()) + '" style="flex:1;width:auto">' +
      '<button class="btn btn-outline btn-sm" data-gtm="apply-coupon">Aplicar</button></form>' +
      '<a class="btn" style="width:100%" href="checkout.html" data-gtm="begin-checkout">Finalizar compra</a>' +
      '</aside></div>';
  }

  el.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b) return;
    var row = b.closest('.cart-line');
    var line = Cart.lines().find(function (l) { return l.id === row.dataset.id && l.variant === row.dataset.variant; });
    var item = function (q) { return L.toItem(line.product, { variant: line.variant, quantity: q, list_id: line.list_id, list_name: line.list_name }); };
    var act = b.dataset.act;
    if (act === 'plus') {
      Cart.setQty(line.id, line.variant, line.quantity + 1);
      L.track('add_to_cart', { ecommerce: L.ecommerce([item(1)]) });
    } else if (act === 'minus') {
      Cart.setQty(line.id, line.variant, line.quantity - 1);
      L.track('remove_from_cart', { ecommerce: L.ecommerce([item(1)]) });
    } else if (act === 'remove') {
      Cart.setQty(line.id, line.variant, 0);
      L.track('remove_from_cart', { ecommerce: L.ecommerce([item(line.quantity)]) });
    }
    render();
  });

  el.addEventListener('submit', function (e) {
    if (e.target.id !== 'coupon-form') return;
    e.preventDefault();
    var code = e.target.coupon.value.trim().toUpperCase();
    if (code === 'GTM10') {
      Cart.setCoupon(code);
      L.track('coupon_applied', { coupon: code, coupon_valid: true });
      L.toast('🎉 Cupom aplicado: 10% OFF');
    } else {
      Cart.setCoupon('');
      L.track('coupon_applied', { coupon: code, coupon_valid: false });
      L.toast('Cupom inválido');
    }
    render();
  });

  render();
  if (Cart.lines().length) L.track('view_cart', { ecommerce: L.ecommerce(Cart.items()) });
})();
