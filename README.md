# GTM Lab Store — cenário limpo

Loja fictícia (HTML + CSS + JS puro, sem build) **sem nenhum rastreamento**: não há GTM, `dataLayer.push`, Consent Mode nem tags.
A ideia é você implementar tudo e praticar Google Tag Manager com GA4 e Google Ads.

A versão completa (com tudo implementado) está em `../referencia-completa/`, para consulta.

## Rodar localmente

```bash
python3 -m http.server 8000   # ou: npx serve .
# abra http://localhost:8000
```

## O que fazer

1. Cole o snippet do GTM nos comentários `<!-- GTM: ... -->` do `<head>` e do `<body>` das 9 páginas.
2. Implemente os `dataLayer.push()` em `assets/js/pages/*.js` (e, se quiser, em `assets/js/app.js`).
3. Siga o checklist e o plano de medição na página **Exercícios**.

O painel **📊 dataLayer** (canto inferior direito) mostra tudo que passar pelo `window.dataLayer`.

## Estrutura

```
index.html produtos.html produto.html carrinho.html checkout.html
obrigado.html contato.html conta.html exercicios.html
assets/js/app.js         carrinho, usuário, cabeçalho/rodapé, banner de cookies (só UI), painel dataLayer
assets/js/products.js    catálogo
assets/js/pages/*.js     lógica de cada página
```

Os elementos têm `id`, `class` e `data-*` (ex.: `data-item-id`, `data-price`, `data-gtm`) para praticar seletores e variáveis de DOM.

## Hospedagem gratuita

GitHub Pages: Settings → Pages → branch `main`, pasta `/ (root)`. Também funciona em Cloudflare Pages, Netlify e Vercel (sem build).

> Tudo é simulado: pedidos, pagamentos e login ficam só no `localStorage` do navegador.
