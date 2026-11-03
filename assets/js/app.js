/**
 * Núcleo do site: helpers, carrinho, cabeçalho/rodapé, banner de consentimento,
 * painel de debug do dataLayer. Exposto em window.Lab.
 */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var CURRENCY = cfg.CURRENCY || 'BRL';

  function store(s) {
    return {
      get: function (k, d) { try { var v = s.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
      set: function (k, v) { try { s.setItem(k, JSON.stringify(v)); } catch (e) {} },
      del: function (k) { try { s.removeItem(k); } catch (e) {} }
    };
  }
  var LS = store(window.localStorage);
  var SS = store(window.sessionStorage);

  function brl(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: CURRENCY }); }
  function round(v) { return Math.round(v * 100) / 100; }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getProduct(id) { return window.PRODUCTS.find(function (p) { return p.id === id; }); }

  function clean(o) {
    Object.keys(o).forEach(function (k) { if (o[k] === undefined || o[k] === null || o[k] === '') delete o[k]; });
    return o;
  }

  /** Converte um produto no formato de item do GA4. */
  function toItem(p, o) {
    o = o || {};
    return clean({
      item_id: p.id,
      item_name: p.name,
      item_brand: p.brand,
      item_category: p.category,
      item_category2: p.category2,
      item_variant: o.variant,
      price: p.price,
      quantity: o.quantity || 1,
      index: o.index,
      item_list_id: o.list_id,
      item_list_name: o.list_name,
      coupon: o.coupon,
      discount: o.discount
    });
  }

  /** Push no dataLayer. Limpa o objeto ecommerce antes (boa prática do GA4). */
  function track(event, params) {
    var obj = Object.assign({ event: event }, params || {});
    if (obj.ecommerce) window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push(obj);
    return obj;
  }

  /** Push + navegação, usando eventCallback do GTM (com fallback sem GTM). */
  function trackThenGo(event, params, url) {
    var done = false;
    function go() { if (!done) { done = true; location.href = url; } }
    track(event, Object.assign({}, params, { eventCallback: go, eventTimeout: 2000 }));
    setTimeout(go, window.GTM_ACTIVE_ID ? 2200 : 300);
  }

  function ecommerce(items, extra) {
    var value = round(items.reduce(function (s, i) { return s + i.price * i.quantity - (i.discount || 0) * i.quantity; }, 0));
    return Object.assign({ currency: CURRENCY, value: value }, extra || {}, { items: items });
  }

  // --- Usuário ---------------------------------------------------------------
  var User = {
    get: function () { return LS.get('gtmlab_user', null); },
    set: function (u) { LS.set('gtmlab_user', u); },
    logout: function () { LS.del('gtmlab_user'); }
  };

  function phoneE164(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (!d) return undefined;
    if (d.indexOf('55') !== 0 || d.length <= 11) d = '55' + d;
    return '+' + d;
  }

  /** Objeto user_data para conversões otimizadas (Enhanced Conversions). */
  function userData(d) {
    var parts = String(d.name || '').trim().split(/\s+/);
    var ud = clean({ email: (d.email || '').trim().toLowerCase(), phone_number: phoneE164(d.phone) });
    var addr = clean({
      first_name: parts[0] ? parts[0].toLowerCase() : undefined,
      last_name: parts.length > 1 ? parts.slice(1).join(' ').toLowerCase() : undefined,
      street: d.street, city: d.city, region: d.region,
      postal_code: d.postal_code ? String(d.postal_code).replace(/\D/g, '') : undefined,
      country: d.street || d.city ? 'BR' : undefined
    });
    if (Object.keys(addr).length) ud.address = addr;
    return ud;
  }

  // --- Carrinho --------------------------------------------------------------
  var Cart = {
    raw: function () { return LS.get('gtmlab_cart', []); },
    save: function (lines) { LS.set('gtmlab_cart', lines); renderCartCount(); },
    find: function (lines, id, variant) { return lines.find(function (l) { return l.id === id && l.variant === variant; }); },
    add: function (id, variant, qty, list) {
      var lines = this.raw();
      var line = this.find(lines, id, variant);
      if (line) line.quantity += qty;
      else lines.push(clean({ id: id, variant: variant, quantity: qty, list_id: list && list.id, list_name: list && list.name }));
      this.save(lines);
    },
    setQty: function (id, variant, qty) {
      var lines = this.raw();
      var line = this.find(lines, id, variant);
      if (!line) return;
      if (qty <= 0) lines.splice(lines.indexOf(line), 1); else line.quantity = qty;
      this.save(lines);
    },
    lines: function () {
      return this.raw().map(function (l) { return Object.assign({}, l, { product: getProduct(l.id) }); })
        .filter(function (l) { return l.product; });
    },
    count: function () { return this.raw().reduce(function (s, l) { return s + l.quantity; }, 0); },
    subtotal: function () { return round(this.lines().reduce(function (s, l) { return s + l.product.price * l.quantity; }, 0)); },
    coupon: function () { return LS.get('gtmlab_coupon', ''); },
    setCoupon: function (c) { if (c) LS.set('gtmlab_coupon', c); else LS.del('gtmlab_coupon'); },
    discountRate: function () { return this.coupon() === 'GTM10' ? 0.1 : 0; },
    items: function () {
      var coupon = this.coupon(), rate = this.discountRate();
      return this.lines().map(function (l) {
        return toItem(l.product, {
          variant: l.variant, quantity: l.quantity, list_id: l.list_id, list_name: l.list_name,
          coupon: rate ? coupon : undefined, discount: rate ? round(l.product.price * rate) : undefined
        });
      });
    },
    clear: function () { this.save([]); this.setCoupon(''); }
  };

  function addToCart(product, variant, qty, list) {
    Cart.add(product.id, variant, qty, list);
    track('add_to_cart', {
      ecommerce: ecommerce([toItem(product, { variant: variant, quantity: qty, list_id: list && list.id, list_name: list && list.name })])
    });
    toast('🛒 ' + product.name + ' adicionado ao carrinho');
  }

  // --- Listas de produto -----------------------------------------------------
  function productCard(p, i) {
    return '<article class="card product-card" data-item-id="' + p.id + '" data-index="' + i + '">' +
      '<a class="card-link" href="produto.html?id=' + p.id + '">' +
      '<div class="product-thumb">' + p.emoji + '</div>' +
      '<div class="product-info"><span class="muted small">' + esc(p.category) + '</span>' +
      '<h3>' + esc(p.name) + '</h3><strong class="price">' + brl(p.price) + '</strong></div></a>' +
      '<button class="btn btn-sm btn-outline btn-quick-add" data-gtm="quick-add" data-item-id="' + p.id + '">Adicionar</button>' +
      '</article>';
  }

  /** Renderiza um grid, dispara view_item_list e trata select_item / add_to_cart. */
  function renderProductGrid(el, products, list) {
    el.innerHTML = products.length ? products.map(productCard).join('') : '<p class="muted">Nenhum produto encontrado.</p>';
    if (!products.length) return;
    track('view_item_list', {
      ecommerce: { item_list_id: list.id, item_list_name: list.name, items: products.map(function (p, i) { return toItem(p, { index: i, list_id: list.id, list_name: list.name }); }) }
    });
    el.onclick = function (e) {
      var card = e.target.closest('.product-card');
      if (!card) return;
      var p = getProduct(card.dataset.itemId);
      var index = Number(card.dataset.index);
      if (e.target.closest('.btn-quick-add')) {
        addToCart(p, p.variants[0], 1, list);
        return;
      }
      var link = e.target.closest('.card-link');
      if (link && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        SS.set('gtmlab_selected', { item_id: p.id, list_id: list.id, list_name: list.name, index: index });
        trackThenGo('select_item', {
          ecommerce: { item_list_id: list.id, item_list_name: list.name, items: [toItem(p, { index: index, list_id: list.id, list_name: list.name })] }
        }, link.href);
      }
    };
  }

  // --- UI: toast -------------------------------------------------------------
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  // --- Cabeçalho / rodapé ----------------------------------------------------
  var NAV = [
    ['index.html', 'Início', 'home'],
    ['produtos.html', 'Produtos', 'product_list'],
    ['contato.html', 'Contato', 'contact'],
    ['conta.html', 'Conta', 'account'],
    ['exercicios.html', 'Exercícios', 'exercises']
  ];

  function renderHeader() {
    var el = document.getElementById('site-header');
    if (!el) return;
    var user = User.get();
    el.innerHTML =
      '<div class="topbar">🧪 Ambiente de prática de GTM — compras, pagamentos e formulários são simulados.</div>' +
      '<header class="site-header"><div class="container header-inner">' +
      '<a class="logo" href="index.html" data-gtm="logo">🏷️ GTM Lab <span>Store</span></a>' +
      '<form class="search" action="produtos.html" method="get" role="search" id="search-form">' +
      '<input name="q" type="search" placeholder="Buscar produtos…" aria-label="Buscar" value="' + esc(param('q') || '') + '">' +
      '<button class="btn btn-sm" type="submit">Buscar</button></form>' +
      '<nav class="nav" aria-label="Principal">' +
      NAV.map(function (n) {
        var label = n[2] === 'account' && user ? '👤 ' + esc(user.name.split(' ')[0]) : n[1];
        return '<a href="' + n[0] + '" data-gtm="nav-' + n[2] + '"' + (window.PAGE_TYPE === n[2] ? ' class="active"' : '') + '>' + label + '</a>';
      }).join('') +
      '<a href="carrinho.html" class="cart-link" data-gtm="nav-cart">🛒 <span id="cart-count">0</span></a>' +
      '</nav></div></header>';
    renderCartCount();
  }

  function renderCartCount() {
    var c = document.getElementById('cart-count');
    if (c) c.textContent = Cart.count();
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    var gtm = window.GTM_ACTIVE_ID
      ? '<span class="badge badge-ok">GTM ativo: ' + esc(window.GTM_ACTIVE_ID) + '</span>'
      : '<span class="badge badge-off">GTM não configurado</span>';
    el.innerHTML = '<footer class="site-footer"><div class="container footer-inner">' +
      '<div><strong>GTM Lab Store</strong><p class="muted small">Loja fictícia para praticar Google Tag Manager, GA4 e Google Ads.</p>' + gtm + '</div>' +
      '<div><strong>Links</strong><ul class="plain">' +
      '<li><a href="exercicios.html">Exercícios e referência de eventos</a></li>' +
      '<li><a href="https://support.google.com/tagmanager" target="_blank" rel="noopener" data-gtm="outbound-footer">Ajuda do GTM ↗</a></li>' +
      '<li><a href="#" id="open-consent">Preferências de cookies</a></li></ul></div>' +
      '<div><strong>Atendimento</strong><ul class="plain">' +
      '<li><a href="tel:+5511999999999" data-gtm="tel-footer">(11) 99999-9999</a></li>' +
      '<li><a href="mailto:contato@gtmlab.example" data-gtm="mailto-footer">contato@gtmlab.example</a></li></ul></div>' +
      '</div></footer>';
    document.getElementById('open-consent').onclick = function (e) { e.preventDefault(); openConsent(true); };
  }

  // --- Consentimento ---------------------------------------------------------
  function saveConsent(c) {
    c = { analytics: !!c.analytics, ads: !!c.ads, updated_at: new Date().toISOString() };
    LS.set('gtmlab_consent', c);
    window.gtag('consent', 'update', window.consentToGtag(c));
    track('consent_update', { consent_analytics: c.analytics, consent_ads: c.ads });
    var b = document.getElementById('consent-banner');
    if (b) b.remove();
  }

  function openConsent(details) {
    var old = document.getElementById('consent-banner');
    if (old) old.remove();
    var c = LS.get('gtmlab_consent', { analytics: false, ads: false });
    var b = document.createElement('div');
    b.id = 'consent-banner';
    b.className = 'consent-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Consentimento de cookies');
    b.innerHTML =
      '<div class="consent-inner"><div><strong>🍪 Usamos cookies</strong>' +
      '<p class="small">Usamos cookies de análise (Google Analytics) e de publicidade (Google Ads). ' +
      'Este banner envia comandos do <b>Consent Mode v2</b> para o dataLayer.</p>' +
      '<div class="consent-details"' + (details ? '' : ' hidden') + '>' +
      '<label><input type="checkbox" checked disabled> Necessários</label>' +
      '<label><input type="checkbox" id="c-analytics"' + (c.analytics ? ' checked' : '') + '> Análise (analytics_storage)</label>' +
      '<label><input type="checkbox" id="c-ads"' + (c.ads ? ' checked' : '') + '> Publicidade (ad_storage, ad_user_data, ad_personalization)</label></div></div>' +
      '<div class="consent-actions">' +
      '<button class="btn btn-outline btn-sm" data-c="reject">Rejeitar</button>' +
      '<button class="btn btn-outline btn-sm" data-c="custom">' + (details ? 'Salvar escolhas' : 'Personalizar') + '</button>' +
      '<button class="btn btn-sm" data-c="accept">Aceitar todos</button></div></div>';
    document.body.appendChild(b);
    b.onclick = function (e) {
      var a = e.target.dataset && e.target.dataset.c;
      if (a === 'accept') saveConsent({ analytics: true, ads: true });
      if (a === 'reject') saveConsent({ analytics: false, ads: false });
      if (a === 'custom') {
        var d = b.querySelector('.consent-details');
        if (d.hidden) { d.hidden = false; e.target.textContent = 'Salvar escolhas'; }
        else saveConsent({ analytics: b.querySelector('#c-analytics').checked, ads: b.querySelector('#c-ads').checked });
      }
    };
  }

  // --- Painel de debug do dataLayer -----------------------------------------
  function safeJson(v) {
    var seen = new WeakSet();
    return JSON.stringify(v, function (k, val) {
      if (typeof val === 'function') return '[função]';
      if (typeof Element !== 'undefined' && val instanceof Element) {
        return '<' + val.tagName.toLowerCase() + (val.id ? '#' + val.id : '') + (val.className && typeof val.className === 'string' ? '.' + val.className.trim().split(/\s+/).join('.') : '') + '>';
      }
      if (val && typeof val === 'object') {
        if (seen.has(val)) return '[circular]';
        seen.add(val);
        if (Object.prototype.toString.call(val) === '[object Arguments]') return Array.prototype.slice.call(val);
      }
      return val;
    }, 2);
  }

  function entryLabel(e) {
    if (e && Object.prototype.toString.call(e) === '[object Arguments]') return 'gtag(' + e[0] + (e[1] && typeof e[1] === 'string' ? ", '" + e[1] + "'" : '') + ')';
    if (e && e.event) return e.event;
    if (e && 'ecommerce' in e && e.ecommerce === null) return '(limpa ecommerce)';
    return '(sem event)';
  }

  function debugPanel() {
    if (!cfg.DEBUG_PANEL) return;
    var open = LS.get('gtmlab_debug_open', false);
    var wrap = document.createElement('div');
    wrap.className = 'dl-debug' + (open ? ' open' : '');
    wrap.innerHTML = '<button class="dl-toggle" type="button" title="Mostrar pushes do dataLayer">📊 dataLayer <span class="dl-count">0</span></button>' +
      '<div class="dl-panel"><div class="dl-head"><strong>dataLayer</strong><span class="muted small">mais recente primeiro</span>' +
      '<label class="small"><input type="checkbox" class="dl-hide-gtm" checked> ocultar gtm.*</label></div><ol class="dl-list"></ol></div>';
    document.body.appendChild(wrap);
    var list = wrap.querySelector('.dl-list');
    var count = wrap.querySelector('.dl-count');
    var hideGtm = wrap.querySelector('.dl-hide-gtm');
    wrap.querySelector('.dl-toggle').onclick = function () {
      open = !open; wrap.classList.toggle('open', open); LS.set('gtmlab_debug_open', open);
    };
    hideGtm.onchange = function () { wrap.classList.toggle('hide-gtm', hideGtm.checked); };
    wrap.classList.add('hide-gtm');
    var seen = 0;
    function poll() {
      var dl = window.dataLayer;
      for (; seen < dl.length; seen++) {
        var e = dl[seen];
        var label = entryLabel(e);
        var li = document.createElement('li');
        if (/^gtm\./.test(label)) li.className = 'is-gtm';
        li.innerHTML = '<details><summary><span class="dl-idx">#' + seen + '</span> ' + esc(label) + '</summary><pre></pre></details>';
        li.querySelector('pre').textContent = safeJson(e);
        list.insertBefore(li, list.firstChild);
      }
      count.textContent = dl.length;
    }
    poll();
    setInterval(poll, 300);
  }

  // --- Init ------------------------------------------------------------------
  function init() {
    renderHeader();
    renderFooter();
    if (!LS.get('gtmlab_consent', null)) openConsent(false);
    debugPanel();
  }

  window.Lab = {
    LS: LS, SS: SS, CURRENCY: CURRENCY, brl: brl, round: round, param: param, esc: esc, clean: clean,
    getProduct: getProduct, toItem: toItem, track: track, trackThenGo: trackThenGo, ecommerce: ecommerce,
    Cart: Cart, addToCart: addToCart, renderProductGrid: renderProductGrid, renderHeader: renderHeader,
    User: User, userData: userData, phoneE164: phoneE164, toast: toast, saveConsent: saveConsent, openConsent: openConsent
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
