(function () {
  var L = window.Lab;
  var el = document.getElementById('order');
  var order = L.SS.get('gtmlab_last_order', null);

  if (!order) {
    el.innerHTML = '<div class="card"><h1>Nenhum pedido recente</h1><p>Faça uma compra para ver o resumo do pedido.</p><a class="btn" href="produtos.html">Ver produtos</a></div>';
    return;
  }

  el.innerHTML =
    '<div class="card" style="max-width:720px;margin:0 auto">' +
    '<p style="font-size:3rem;margin:0">🎉</p>' +
    '<h1>Pedido confirmado!</h1>' +
    '<p>Obrigado, ' + L.esc(order.customer.name.split(' ')[0]) + '. Seu pedido <strong id="transaction-id">' + L.esc(order.transaction_id) + '</strong> foi recebido.</p>' +
    '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Qtd</th><th>Preço</th></tr></thead><tbody>' +
    order.items.map(function (i) {
      return '<tr data-item-id="' + L.esc(i.id) + '"><td>' + L.esc(i.name) + ' <span class="muted small">(' + L.esc(i.variant || '') + ')</span></td><td>' + i.quantity + '</td><td>' + L.brl(i.price) + '</td></tr>';
    }).join('') +
    '</tbody></table></div>' +
    '<div class="summary" style="position:static;margin-top:12px">' +
    (order.discount ? '<div class="summary-row"><span>Desconto (' + L.esc(order.coupon) + ')</span><span>− ' + L.brl(order.discount) + '</span></div>' : '') +
    '<div class="summary-row"><span>Frete (' + L.esc(order.shipping_tier) + ')</span><span>' + L.brl(order.shipping) + '</span></div>' +
    '<div class="summary-row"><span>Pagamento</span><span>' + L.esc(order.payment_type) + '</span></div>' +
    '<div class="summary-row summary-total"><span>Total</span><span id="order-total" data-value="' + order.value + '">' + L.brl(order.total) + '</span></div></div>' +
    '<p class="small muted">Valor dos produtos com desconto (sem frete): <b>' + L.brl(order.value) + '</b></p>' +
    '<div class="row" style="margin-top:16px"><a class="btn" href="produtos.html">Continuar comprando</a></div>' +
    '</div>';
})();
