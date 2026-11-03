/**
 * Núcleo do site: carrinho, usuário, cabeçalho/rodapé, banner de cookies e
 * painel que mostra o window.dataLayer. Exposto em window.Lab.
 *
 * Nada aqui envia dados de rastreamento: isso é com você.
 */
(function () {
  'use strict';
  var CURRENCY = 'BRL';

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

  // --- Usuário ---------------------------------------------------------------
  var User = {
    get: function () { return LS.get('gtmlab_user', null); },
    set: function (u) { LS.set('gtmlab_user', u); },
    logout: function () { LS.del('gtmlab_user'); }
  };

  // --- Carrinho --------------------------------------------------------------
  var Cart = {
    raw: function () { return LS.get('gtmlab_cart', []); },
    save: function (lines) { LS.set('gtmlab_cart', lines); renderCartCount(); },
    find: function (lines, id, variant) { return lines.find(function (l) { return l.id === id && l.variant === variant; }); },
    add: function (id, variant, qty) {
      var lines = this.raw();
      var line = this.find(lines, id, variant);
      if (line) line.quantity += qty; else lines.push({ id: id, variant: variant, quantity: qty });
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
    /** Linhas do carrinho em formato simples, usado para montar o pedido. */
    items: function () {
      return this.lines().map(function (l) {
        return { id: l.product.id, name: l.product.name, brand: l.product.brand, category: l.product.category, variant: l.variant, price: l.product.price, quantity: l.quantity };
      });
    },
    clear: function () { this.save([]); this.setCoupon(''); }
  };

  function addToCart(product, variant, qty) {
    Cart.add(product.id, variant, qty);
    toast('🛒 ' + product.name + ' adicionado ao carrinho');
  }

  // --- Lista de produtos -----------------------------------------------------
  function productCard(p, i) {
    return '<article class="card product-card" data-item-id="' + p.id + '" data-item-name="' + esc(p.name) + '" data-item-brand="' + esc(p.brand) +
      '" data-item-category="' + esc(p.category) + '" data-price="' + p.price + '" data-index="' + i + '">' +
      '<a class="card-link" href="produto.html?id=' + p.id + '">' +
      '<div class="product-thumb">' + p.emoji + '</div>' +
      '<div class="product-info"><span class="muted small">' + esc(p.category) + '</span>' +
      '<h3>' + esc(p.name) + '</h3><strong class="price">' + brl(p.price) + '</strong></div></a>' +
      '<button class="btn btn-sm btn-outline btn-quick-add" data-gtm="quick-add" data-item-id="' + p.id + '">Adicionar</button>' +
      '</article>';
  }

  function renderProductGrid(el, products) {
    el.innerHTML = products.length ? products.map(productCard).join('') : '<p class="muted">Nenhum produto encontrado.</p>';
    el.onclick = function (e) {
      var btn = e.target.closest('.btn-quick-add');
      if (!btn) return;
      var p = getProduct(btn.dataset.itemId);
      addToCart(p, p.variants[0], 1);
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
    el.innerHTML = '<footer class="site-footer"><div class="container footer-inner">' +
      '<div><strong>GTM Lab Store</strong><p class="muted small">Loja fictícia para praticar Google Tag Manager, GA4 e Google Ads.</p></div>' +
      '<div><strong>Links</strong><ul class="plain">' +
      '<li><a href="exercicios.html">Exercícios e plano de medição</a></li>' +
      '<li><a href="https://support.google.com/tagmanager" target="_blank" rel="noopener" data-gtm="outbound-footer">Ajuda do GTM ↗</a></li>' +
      '<li><a href="#" id="open-consent">Preferências de cookies</a></li></ul></div>' +
      '<div><strong>Atendimento</strong><ul class="plain">' +
      '<li><a href="tel:+5511999999999" data-gtm="tel-footer">(11) 99999-9999</a></li>' +
      '<li><a href="mailto:contato@gtmlab.example" data-gtm="mailto-footer">contato@gtmlab.example</a></li></ul></div>' +
      '</div></footer>';
    document.getElementById('open-consent').onclick = function (e) { e.preventDefault(); openConsent(true); };
  }

  // --- Banner de cookies (só interface: guarda a escolha no localStorage) ---
  function saveConsent(c) {
    LS.set('gtmlab_consent', { analytics: !!c.analytics, ads: !!c.ads, updated_at: new Date().toISOString() });
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
      '<p class="small">Usamos cookies de análise e de publicidade. Escolha o que deseja permitir.</p>' +
      '<div class="consent-details"' + (details ? '' : ' hidden') + '>' +
      '<label><input type="checkbox" checked disabled> Necessários</label>' +
      '<label><input type="checkbox" id="c-analytics"' + (c.analytics ? ' checked' : '') + '> Análise</label>' +
      '<label><input type="checkbox" id="c-ads"' + (c.ads ? ' checked' : '') + '> Publicidade</label></div></div>' +
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

  // --- Painel que mostra o window.dataLayer (somente leitura) ----------------
  function safeJson(v) {
    var seen = new WeakSet();
    return JSON.stringify(v, function (k, val) {
      if (typeof val === 'function') return '[função]';
      if (typeof Element !== 'undefined' && val instanceof Element) return '<' + val.tagName.toLowerCase() + (val.id ? '#' + val.id : '') + '>';
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
    var open = LS.get('gtmlab_debug_open', false);
    var wrap = document.createElement('div');
    wrap.className = 'dl-debug hide-gtm' + (open ? ' open' : '');
    wrap.innerHTML = '<button class="dl-toggle" type="button" title="Mostrar o conteúdo do dataLayer">📊 dataLayer <span class="dl-count">0</span></button>' +
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
    var seen = 0;
    function poll() {
      var dl = window.dataLayer || [];
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
    LS: LS, SS: SS, CURRENCY: CURRENCY, brl: brl, round: round, param: param, esc: esc,
    getProduct: getProduct, Cart: Cart, addToCart: addToCart, renderProductGrid: renderProductGrid,
    User: User, toast: toast, openConsent: openConsent
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
