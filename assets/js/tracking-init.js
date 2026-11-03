/**
 * Carregado de forma síncrona no <head> de todas as páginas, ANTES do GTM.
 * Ordem: dataLayer -> Consent Mode (default/update) -> page_data -> snippet do GTM.
 */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};

  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // --- Consent Mode v2 -------------------------------------------------------
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', true);

  window.consentToGtag = function (c) {
    var a = c.analytics ? 'granted' : 'denied';
    var ads = c.ads ? 'granted' : 'denied';
    return { analytics_storage: a, ad_storage: ads, ad_user_data: ads, ad_personalization: ads };
  };
  var consent = lsGet('gtmlab_consent');
  if (consent) window.gtag('consent', 'update', window.consentToGtag(consent));

  // --- Atribuição (UTMs e IDs de clique) ------------------------------------
  var params = new URLSearchParams(location.search);
  var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid'];
  var found = {};
  keys.forEach(function (k) { if (params.get(k)) found[k] = params.get(k); });
  if (Object.keys(found).length) {
    found.landing_page = location.pathname;
    found.captured_at = new Date().toISOString();
    lsSet('gtmlab_attribution', found);
  }

  // --- Dados da página -------------------------------------------------------
  var user = lsGet('gtmlab_user');
  var pageData = {
    event: 'page_data',
    page_type: window.PAGE_TYPE || 'other',
    user_logged_in: !!user,
    consent_analytics: consent ? !!consent.analytics : null,
    consent_ads: consent ? !!consent.ads : null
  };
  if (user) pageData.user_id = user.id;
  var attribution = lsGet('gtmlab_attribution');
  if (attribution) pageData.attribution = attribution;
  window.dataLayer.push(pageData);

  // --- GTM -------------------------------------------------------------------
  var override = params.get('gtm_id');
  if (override === 'clear') lsDel('gtmlab_gtm_id');
  else if (override) lsSet('gtmlab_gtm_id', override.trim().toUpperCase());

  var id = lsGet('gtmlab_gtm_id') || cfg.GTM_ID || '';
  window.GTM_ACTIVE_ID = /^GTM-[A-Z0-9]+$/i.test(id) ? id : null;

  if (window.GTM_ACTIVE_ID) {
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', window.GTM_ACTIVE_ID);
  }
})();
