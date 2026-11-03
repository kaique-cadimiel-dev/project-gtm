(function () {
  var L = window.Lab;

  // --- Checklist -------------------------------------------------------------
  var EXERCISES = [
    ['Instalação e dataLayer', [
      ['Instalar o GTM', 'Cole o snippet nas 9 páginas e confirme "Container Loaded" no Preview.'],
      ['Contexto da página', 'Faça um push inicial (antes do GTM) com <code>page_type</code> (use <code>window.PAGE_TYPE</code>) e se o usuário está logado.'],
      ['Tag base do GA4', 'Crie a tag Google Tag com seu Measurement ID e valide no DebugView.'],
      ['Variáveis de camada de dados', 'Crie variáveis para os parâmetros que você enviar e use-as em tags de evento GA4.'],
      ['Evento personalizado', 'Implemente um evento para o formulário de newsletter (home) e dispare uma tag de evento GA4.']
    ]],
    ['Ecommerce GA4', [
      ['Itens e lista', 'Envie <code>view_item_list</code> e <code>select_item</code> (home, produtos) com a lista de origem.'],
      ['Produto e carrinho', 'Envie <code>view_item</code>, <code>add_to_cart</code>, <code>remove_from_cart</code> e <code>view_cart</code>.'],
      ['Checkout', 'Envie <code>begin_checkout</code>, <code>add_shipping_info</code> e <code>add_payment_info</code>.'],
      ['Compra', 'Envie <code>purchase</code> com <code>transaction_id</code>, <code>value</code>, <code>tax</code>, <code>shipping</code>, <code>coupon</code> e <code>items</code>.'],
      ['Deduplicação do purchase', 'Recarregue a página de pedido e garanta que o <code>purchase</code> não seja enviado duas vezes.'],
      ['Um acionador para vários eventos', 'Use um acionador com regex (ex.: <code>^(add_to_cart|remove_from_cart)$</code>) e <code>{{Event}}</code> como nome do evento.']
    ]],
    ['Google Ads', [
      ['Conversão de compra', 'Crie a tag de conversão no <code>purchase</code> com valor, moeda e <code>transaction_id</code> dinâmicos.'],
      ['Conversão de lead', 'Implemente um evento de lead no formulário de Contato e crie a conversão correspondente.'],
      ['Vinculador de conversões', 'Adicione a tag em All Pages e teste com o link de campanha com <code>gclid</code>.'],
      ['Conversões otimizadas', 'Envie dados do cliente (e-mail, telefone, endereço) no <code>purchase</code> e configure "Dados fornecidos pelo usuário".'],
      ['Remarketing dinâmico', 'Dispare a tag de remarketing com os itens em view_item, add_to_cart e purchase.']
    ]],
    ['Gatilhos avançados', [
      ['Profundidade de rolagem', 'Dispare em 25/50/75/90% na home (texto longo propositalmente).'],
      ['Visibilidade de elemento', 'Dispare quando o banner <code>#promo-rodape</code> ficar 50% visível por 1s.'],
      ['Cliques em links', 'Crie acionadores para <code>tel:</code>, <code>mailto:</code>, WhatsApp, link externo e download de PDF na página Contato.'],
      ['Clique por data-attribute', 'Use o atributo <code>data-gtm</code> dos botões como condição de acionador.'],
      ['Envio de formulário', 'Compare o acionador nativo "Envio de formulário" com um evento seu e explique qual é mais confiável.'],
      ['Vídeo do YouTube', 'Use o acionador de vídeo (início, 25/50/75%, fim) na página Contato.'],
      ['Alteração no histórico', 'Em Produtos, os filtros usam <code>history.replaceState</code>. Teste o acionador "Alteração no histórico".']
    ]],
    ['Privacidade e qualidade', [
      ['Consent Mode v2', 'Defina o consentimento padrão antes do GTM e atualize quando o usuário escolher no banner de cookies.'],
      ['Tags de terceiros com consentimento', 'Exija <code>analytics_storage</code> ou <code>ad_storage</code> em tags não Google.'],
      ['Atribuição', 'Capture UTMs e <code>gclid</code> da URL e confira a origem/mídia no GA4.'],
      ['Ambientes e versões', 'Crie um ambiente de teste, publique versões e pratique o rollback.'],
      ['Tag Assistant e DebugView', 'Valide cada exercício com Preview + DebugView e anote divergências.']
    ]]
  ];

  var KEY = 'gtmlab_exercises';
  var done = L.LS.get(KEY, {});
  var box = document.getElementById('exercises');
  var total = 0;

  box.innerHTML = EXERCISES.map(function (g, gi) {
    return '<h3>' + L.esc(g[0]) + '</h3>' + g[1].map(function (x, xi) {
      total++;
      var id = gi + '-' + xi;
      return '<div class="exercise' + (done[id] ? ' done' : '') + '"><input type="checkbox" id="ex-' + id + '" data-id="' + id + '"' + (done[id] ? ' checked' : '') + '>' +
        '<label for="ex-' + id + '"><h4>' + L.esc(x[0]) + '</h4><p class="muted small">' + x[1] + '</p></label></div>';
    }).join('');
  }).join('');

  function progress() {
    var n = Object.keys(done).filter(function (k) { return done[k]; }).length;
    document.getElementById('progress-label').textContent = n + ' de ' + total + ' concluídos';
    document.getElementById('progress-bar').style.width = (n / total * 100) + '%';
  }
  box.addEventListener('change', function (e) {
    var cb = e.target;
    if (!cb.dataset.id) return;
    if (cb.checked) done[cb.dataset.id] = true; else delete done[cb.dataset.id];
    cb.closest('.exercise').classList.toggle('done', cb.checked);
    L.LS.set(KEY, done);
    progress();
  });
  progress();

  // --- Plano de medição ------------------------------------------------------
  var EVENTS = [
    ['page_data (contexto)', 'Todas', 'Antes do snippet do GTM', 'page_type, user_logged_in, user_id'],
    ['consent_update', 'Todas', 'Usuário escolhe no banner de cookies', 'consent_analytics, consent_ads'],
    ['view_promotion / select_promotion', 'Home', 'Banner visível / clique no CTA', 'promotion_id, promotion_name, creative_name, creative_slot'],
    ['view_item_list', 'Home, Produtos, Produto', 'Lista renderizada', 'item_list_id, item_list_name, items[]'],
    ['select_item', 'Home, Produtos, Produto', 'Clique em um card', 'item_list_*, items[]'],
    ['view_item', 'Produto', 'Página carregada', 'currency, value, items[]'],
    ['add_to_cart / remove_from_cart', 'Cards, Produto, Carrinho', 'Adicionar / remover', 'currency, value, items[]'],
    ['add_to_wishlist, share', 'Produto', 'Clique no botão', 'items[] / method, content_type'],
    ['search', 'Produtos (?q=)', 'Busca com termo', 'search_term'],
    ['view_cart', 'Carrinho', 'Página carregada com itens', 'currency, value, items[]'],
    ['begin_checkout', 'Checkout', 'Página carregada', 'currency, value, coupon, items[]'],
    ['add_shipping_info', 'Checkout', 'Envio da etapa de entrega', 'shipping_tier, items[]'],
    ['add_payment_info', 'Checkout', 'Pedido finalizado (etapa de pagamento)', 'payment_type, items[]'],
    ['purchase', 'Obrigado', 'Uma vez por pedido', 'transaction_id, value, tax, shipping, coupon, items[]'],
    ['generate_lead', 'Contato', 'Envio do formulário', 'value, currency, form_id'],
    ['sign_up / login / logout', 'Conta', 'Envio do formulário / clique em sair', 'method, user_id']
  ];
  document.getElementById('events').innerHTML = EVENTS.map(function (r) {
    return '<tr><td><code>' + L.esc(r[0]) + '</code></td><td>' + L.esc(r[1]) + '</td><td class="small">' + L.esc(r[2]) + '</td><td class="small">' + L.esc(r[3]) + '</td></tr>';
  }).join('');
})();
