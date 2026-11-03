# GTM Lab Store

Loja fictícia (HTML + CSS + JS puro, sem build) para praticar **Google Tag Manager** com **GA4** e **Google Ads**.
O GTM vem **desligado**: nada é carregado até você informar um ID de container.

## Rodar localmente

```bash
python3 -m http.server 8000   # ou: npx serve .
# abra http://localhost:8000
```

## Ativar o GTM

- Pela página **Exercícios** (campo "Ativar o GTM"), ou
- abrindo qualquer página com `?gtm_id=GTM-XXXXXXX` (`?gtm_id=clear` remove), ou
- fixando em `assets/js/config.js` (`GTM_ID`).

## Hospedagem gratuita

Qualquer host estático serve (a pasta raiz é o site):

- **GitHub Pages**: suba o repositório → Settings → Pages → branch `main`, pasta `/ (root)`.
- **Cloudflare Pages / Netlify / Vercel**: conecte o repositório, sem comando de build, diretório de saída `.`.
- Netlify Drop / Vercel Drop: arraste a pasta.

## Estrutura

```
index.html produtos.html produto.html carrinho.html checkout.html
obrigado.html contato.html conta.html exercicios.html
assets/js/tracking-init.js   dataLayer + Consent Mode v2 + UTMs + snippet do GTM
assets/js/app.js             carrinho, consentimento, painel de debug, helpers GA4
assets/js/products.js        catálogo
assets/js/pages/*.js         lógica de cada página (eventos)
```

O painel **📊 dataLayer** (canto inferior direito) mostra cada push em tempo real, mesmo sem GTM.
Veja a lista de eventos e o checklist de exercícios na página **Exercícios**.

> Tudo é simulado: pedidos, pagamentos e login ficam só no `localStorage` do navegador.
# project-gtm
# project-gtm
# project-gtm
# project-gtm
