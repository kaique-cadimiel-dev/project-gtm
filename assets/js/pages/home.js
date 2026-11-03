(function () {
  var L = window.Lab;

  L.renderProductGrid(document.getElementById('featured'), window.PRODUCTS.slice(0, 4), { id: 'home_destaques', name: 'Home - Destaques' });

  // Promoções: view_promotion ao carregar, select_promotion ao clicar no CTA
  function promo(el) {
    return {
      promotion_id: el.dataset.promotionId,
      promotion_name: el.dataset.promotionName,
      creative_name: el.dataset.creativeName,
      creative_slot: el.dataset.creativeSlot
    };
  }
  var banners = Array.prototype.slice.call(document.querySelectorAll('.promo-banner'));
  L.track('view_promotion', { ecommerce: promo(banners[0]) });

  banners.forEach(function (b) {
    b.querySelector('.promo-cta').addEventListener('click', function (e) {
      e.preventDefault();
      L.trackThenGo('select_promotion', { ecommerce: promo(b) }, this.href);
    });
  });

  document.getElementById('newsletter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = this.email.value;
    L.track('newsletter_signup', { form_id: 'newsletter-form', user_data: L.userData({ email: email }) });
    this.outerHTML = '<p class="alert">✅ Inscrição simulada com sucesso!</p>';
  });
})();
