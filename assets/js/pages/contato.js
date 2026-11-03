(function () {
  var form = document.getElementById('lead-form');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.querySelectorAll('input, select, textarea, button').forEach(function (i) { i.disabled = true; });
    document.getElementById('lead-success').hidden = false;
  });

  document.getElementById('reveal-phone').onclick = function () {
    document.getElementById('phone-hidden').hidden = false;
    this.hidden = true;
  };
})();
