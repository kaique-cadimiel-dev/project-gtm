(function () {
  var L = window.Lab;

  L.renderProductGrid(document.getElementById('featured'), window.PRODUCTS.slice(0, 4));

  document.getElementById('newsletter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    this.outerHTML = '<p class="alert">✅ Inscrição simulada com sucesso!</p>';
  });
})();
