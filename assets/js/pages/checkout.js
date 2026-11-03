(function () {
  var L = window.Lab;
  var Cart = L.Cart;

  if (!Cart.lines().length) {
    document.getElementById('checkout').innerHTML = '<div class="card"><p>Seu carrinho está vazio.</p><a class="btn" href="produtos.html">Ver produtos</a></div>';
    return;
  }

  var shippingForm = document.getElementById('shipping-form');
  var paymentForm = document.getElementById('payment-form');
  var summary = document.getElementById('summary');
  var customer = null;

  // Preenche com dados do usuário logado
  var user = L.User.get();
  if (user) {
    shippingForm.elements.name.value = user.name || '';
    shippingForm.email.value = user.email || '';
    shippingForm.phone.value = user.phone || '';
  }

  function shipping() {
    var r = shippingForm.querySelector('input[name=shipping_tier]:checked');
    return { tier: r.value, price: Number(r.dataset.price) };
  }

  function totals() {
    var subtotal = Cart.subtotal();
    var discount = L.round(subtotal * Cart.discountRate());
    var ship = shipping();
    var value = L.round(subtotal - discount);
    return { subtotal: subtotal, discount: discount, shipping: ship.price, tier: ship.tier, value: value, total: L.round(value + ship.price) };
  }

  function renderSummary() {
    var t = totals();
    summary.innerHTML = '<h3 style="margin-top:0">Resumo do pedido</h3>' +
      Cart.lines().map(function (l) {
        return '<div class="summary-row small"><span>' + l.quantity + '× ' + L.esc(l.product.name) + ' (' + L.esc(l.variant) + ')</span><span>' + L.brl(l.product.price * l.quantity) + '</span></div>';
      }).join('') +
      '<hr style="border:0;border-top:1px solid var(--border)">' +
      '<div class="summary-row"><span>Subtotal</span><span>' + L.brl(t.subtotal) + '</span></div>' +
      (t.discount ? '<div class="summary-row" style="color:var(--ok)"><span>Cupom ' + L.esc(Cart.coupon()) + '</span><span>− ' + L.brl(t.discount) + '</span></div>' : '') +
      '<div class="summary-row"><span>Frete (' + L.esc(t.tier) + ')</span><span>' + L.brl(t.shipping) + '</span></div>' +
      '<div class="summary-row summary-total"><span>Total</span><span>' + L.brl(t.total) + '</span></div>';
  }

  renderSummary();
  shippingForm.addEventListener('change', renderSummary);

  shippingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = shippingForm;
    customer = {
      name: f.elements.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
      street: f.street.value.trim(), city: f.city.value.trim(), region: f.region.value.trim().toUpperCase(),
      postal_code: f.postal_code.value.trim()
    };
    shippingForm.hidden = true;
    paymentForm.hidden = false;
    document.getElementById('step-1').className = 'step done';
    document.getElementById('step-2').className = 'step active';
    window.scrollTo(0, 0);
  });

  document.getElementById('back-shipping').onclick = function () {
    paymentForm.hidden = true;
    shippingForm.hidden = false;
    document.getElementById('step-1').className = 'step active';
    document.getElementById('step-2').className = 'step';
  };

  paymentForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var payment = paymentForm.querySelector('input[name=payment_type]:checked').value;
    var t = totals();
    var orders = L.LS.get('gtmlab_orders', []);
    var order = {
      transaction_id: 'T' + Date.now().toString().slice(-8),
      created_at: new Date().toISOString(),
      value: t.value,
      tax: L.round(t.value * 0.05),
      shipping: t.shipping,
      shipping_tier: t.tier,
      payment_type: payment,
      coupon: Cart.coupon() || undefined,
      discount: t.discount,
      total: t.total,
      items: Cart.items(),
      customer: customer
    };
    orders.push({ transaction_id: order.transaction_id, email: customer.email, value: order.value });
    L.LS.set('gtmlab_orders', orders);
    L.SS.set('gtmlab_last_order', order);
    Cart.clear();
    this.querySelector('#place-order').disabled = true;
    location.href = 'obrigado.html';
  });
})();
