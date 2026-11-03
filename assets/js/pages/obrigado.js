(function () {
  var L = window.Lab;
  var el = document.getElementById('order');
  var order = L.SS.get('gtmlab_last_order', null);

  if (!order) {
    el.innerHTML = '<div class="card"><h1>Nenhum pedido recente</h1><p>Faça uma compra para ver o evento <code>purchase</code>.</p><a class="btn" href="produtos.html">Ver produtos</a></div>';
    return;
  }

  function pushPurchase(duplicate) {
    L.track('purchase', {
      ecommerce: {
        transaction_id: order.transaction_id,
        value: order.value,
        tax: order.tax,
        shipping: order.shipping,
        currency: L.CURRENCY,
        coupon: order.coupon,
        payment_type: order.payment_type,
        shipping_tier: order.shipping_tier,
        items: order.items
      },
      new_customer: order.new_customer,
      user_data: L.userData(order.customer),
      is_duplicate_test: !!duplicate
    });
  }

  // Deduplicação: o purchase só é enviado uma vez por pedido (recarregar a página não reenvia)
  if (!order.tracked) {
    pushPurchase(false);
    order.tracked = true;
    L.SS.set('gtmlab_last_order', order);
  }

  el.innerHTML =
    '<div class="card" style="max-width:720px;margin:0 auto">' +
    '<p style="font-size:3rem;margin:0">🎉</p>' +
    '<h1>Pedido confirmado!</h1>' +
    '<p>Obrigado, ' + L.esc(order.customer.name.split(' ')[0]) + '. Seu pedido <strong id="transaction-id">' + L.esc(order.transaction_id) + '</strong> foi recebido.</p>' +
    '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Qtd</th><th>Preço</th></tr></thead><tbody>' +
    order.items.map(function (i) {
      return '<tr><td>' + L.esc(i.item_name) + ' <span class="muted small">(' + L.esc(i.item_variant || '') + ')</span></td><td>' + i.quantity + '</td><td>' + L.brl(i.price) + '</td></tr>';
    }).join('') +
    '</tbody></table></div>' +
    '<div class="summary" style="position:static;margin-top:12px">' +
    (order.discount ? '<div class="summary-row"><span>Desconto (' + L.esc(order.coupon) + ')</span><span>− ' + L.brl(order.discount) + '</span></div>' : '') +
    '<div class="summary-row"><span>Frete (' + L.esc(order.shipping_tier) + ')</span><span>' + L.brl(order.shipping) + '</span></div>' +
    '<div class="summary-row"><span>Pagamento</span><span>' + L.esc(order.payment_type) + '</span></div>' +
    '<div class="summary-row summary-total"><span>Total</span><span id="order-total" data-value="' + order.value + '">' + L.brl(order.total) + '</span></div></div>' +
    '<p class="small muted">Cliente novo: <b>' + (order.new_customer ? 'sim' : 'não') + '</b> · value enviado ao GA4/Ads (sem frete): <b>' + L.brl(order.value) + '</b></p>' +
    '<div class="row" style="margin-top:16px"><a class="btn" href="produtos.html">Continuar comprando</a>' +
    '<button class="btn btn-outline" id="dup" data-gtm="duplicate-purchase">Reenviar purchase (testar duplicação)</button></div>' +
    '</div>';

  document.getElementById('dup').onclick = function () {
    pushPurchase(true);
    L.toast('purchase reenviado com o mesmo transaction_id');
  };
})();
