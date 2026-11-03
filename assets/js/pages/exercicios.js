(function () {
  var L = window.Lab;

  // --- Ativação do GTM -------------------------------------------------------
  var status = document.getElementById('gtm-status');
  status.innerHTML = window.GTM_ACTIVE_ID
    ? '<span class="badge badge-ok">Ativo: ' + L.esc(window.GTM_ACTIVE_ID) + '</span>'
    : '<span class="badge badge-off">Nenhum container configurado</span>';

  document.getElementById('gtm-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('gtm-id').value.trim().toUpperCase();
    if (!/^GTM-[A-Z0-9]+$/.test(id)) return;
    location.href = location.pathname + '?gtm_id=' + encodeURIComponent(id);
  });
  document.getElementById('gtm-clear').onclick = function () {
    location.href = location.pathname + '?gtm_id=clear';
  };

  // --- Checklist -------------------------------------------------------------
  var EXERCISES = [
    ['Fundamentos', [
      ['Criar container e instalar', 'Crie um container Web no GTM e ative o ID acima. Confirme no Preview que "Container Loaded" aparece.'],
      ['Tag de configuração do GA4', 'Crie a tag Google Tag com seu Measurement ID no acionador "Initialization - All Pages". Valide no DebugView do GA4.'],
      ['Variáveis de camada de dados', 'Crie variáveis DLV para <code>page_type</code>, <code>user_id</code> e <code>user_logged_in</code> e envie como parâmetros/propriedades de usuário.'],
      ['Acionador de evento personalizado', 'Crie um acionador para o evento <code>newsletter_signup</code> (home) e dispare uma tag de evento GA4.']
    ]],
    ['Ecommerce GA4', [
      ['Ler o objeto ecommerce', 'Dispare uma tag de evento GA4 para <code>view_item</code> usando "Enviar dados de ecommerce → Camada de dados".'],
      ['Funil completo', 'Cubra view_item_list, select_item, view_item, add_to_cart, view_cart, begin_checkout, add_shipping_info, add_payment_info e purchase. Veja o relatório de Compras no GA4.'],
      ['Um evento só para vários', 'Crie uma única tag com acionador regex <code>^(add_to_cart|remove_from_cart|view_item)$</code> usando o nome do evento como <code>{{Event}}</code>.'],
      ['Deduplicação do purchase', 'Clique em "Reenviar purchase" em Obrigado e confirme no GA4 que o <code>transaction_id</code> duplicado não gera duas compras.']
    ]],
    ['Google Ads', [
      ['Conversão de compra', 'Crie a tag "Acompanhamento de conversões do Google Ads" no <code>purchase</code> com <code>value</code>, moeda e <code>transaction_id</code> dinâmicos.'],
      ['Conversão de lead', 'Dispare uma conversão no <code>generate_lead</code> (Contato) usando <code>value</code> do dataLayer.'],
      ['Vinculador de conversões', 'Adicione a tag Vinculador de conversões em All Pages e teste com o link de campanha com <code>gclid</code>.'],
      ['Conversões otimizadas', 'Ative nas configurações da tag e use "Dados fornecidos pelo usuário" lendo a variável <code>user_data</code> do <code>purchase</code> ou <code>generate_lead</code>.'],
      ['Remarketing dinâmico', 'Dispare a tag de remarketing com <code>items</code> do ecommerce em view_item, add_to_cart e purchase.']
    ]],
    ['Gatilhos avançados', [
      ['Profundidade de rolagem', 'Dispare em 25/50/75/90% na home (texto longo propositalmente).'],
      ['Visibilidade de elemento', 'Dispare quando o banner <code>#promo-rodape</code> ficar 50% visível por 1s.'],
      ['Cliques em links', 'Crie acionadores para <code>tel:</code>, <code>mailto:</code>, WhatsApp, link externo e download de PDF na página Contato.'],
      ['Clique em elemento com data-attribute', 'Use o atributo <code>data-gtm</code> dos botões (ex.: <code>add-to-cart</code>) como condição de acionador.'],
      ['Envio de formulário', 'Compare o acionador nativo "Envio de formulário" com o evento <code>generate_lead</code> e explique qual é mais confiável.'],
      ['Vídeo do YouTube', 'Use o acionador de vídeo (início, 25/50/75%, fim) na página Contato.'],
      ['Visualização de página do histórico', 'Em Produtos, os filtros usam <code>history.replaceState</code>. Teste o acionador "Alteração no histórico".']
    ]],
    ['Qualidade e privacidade', [
      ['Consent Mode v2', 'Ative "Verificações de consentimento integradas" nas tags Google. Veja no Preview o estado do consentimento antes e depois do banner.'],
      ['Tags de terceiros com consentimento', 'Exija <code>analytics_storage</code> ou <code>ad_storage</code> em tags não Google (ex.: HTML personalizado).'],
      ['Atribuição', 'Capture UTMs da variável <code>attribution</code> e confira a origem/mídia no GA4.'],
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

  // --- Referência de eventos ----------------------------------------------
  var EVENTS = [
    ['page_data', 'Todas (antes do GTM)', 'page_type, user_logged_in, user_id, consent_*, attribution'],
    ['consent_update', 'Banner de cookies', 'consent_analytics, consent_ads'],
    ['view_promotion / select_promotion', 'Home', 'promotion_id, promotion_name, creative_name, creative_slot'],
    ['view_item_list', 'Home, Produtos, Produto', 'item_list_id, item_list_name, items[]'],
    ['select_item', 'Cards de produto', 'item_list_*, items[]'],
    ['view_item', 'Produto', 'currency, value, items[]'],
    ['add_to_cart / remove_from_cart', 'Cards, Produto, Carrinho', 'currency, value, items[]'],
    ['add_to_wishlist, share, select_variant', 'Produto', 'items[] / item_id, method'],
    ['search / search_no_results', 'Produtos (?q=)', 'search_term'],
    ['filter_category, sort_products', 'Produtos', 'filter_value, sort_by'],
    ['view_cart', 'Carrinho', 'currency, value, items[]'],
    ['coupon_applied', 'Carrinho', 'coupon, coupon_valid'],
    ['begin_checkout', 'Checkout', 'currency, value, coupon, items[]'],
    ['add_shipping_info', 'Checkout', 'shipping_tier, items[]'],
    ['add_payment_info', 'Checkout', 'payment_type, items[]'],
    ['purchase', 'Obrigado', 'transaction_id, value, tax, shipping, coupon, items[], new_customer, user_data'],
    ['generate_lead, form_start', 'Contato', 'value, currency, lead_subject, user_data'],
    ['newsletter_signup', 'Home', 'form_id, user_data'],
    ['sign_up / login / logout', 'Conta', 'method, user_id, user_data'],
    ['reveal_phone', 'Contato', 'location']
  ];
  document.getElementById('events').innerHTML = EVENTS.map(function (r) {
    return '<tr><td><code>' + L.esc(r[0]) + '</code></td><td>' + L.esc(r[1]) + '</td><td class="small">' + L.esc(r[2]) + '</td></tr>';
  }).join('');
})();
