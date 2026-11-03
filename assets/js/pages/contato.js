(function () {
  var L = window.Lab;
  var form = document.getElementById('lead-form');
  var started = false;

  // form_start: primeira interação com o formulário
  form.addEventListener('focusin', function () {
    if (started) return;
    started = true;
    L.track('form_start', { form_id: 'lead-form', form_name: 'Solicite um orçamento' });
  });

  // O submit nativo continua acontecendo (o acionador "Envio de formulário" do GTM enxerga),
  // mas a navegação é bloqueada e um evento personalizado generate_lead é enviado.
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = { name: form.name.value, email: form.email.value, phone: form.phone.value };
    L.track('generate_lead', {
      currency: L.CURRENCY,
      value: (window.SITE_CONFIG || {}).LEAD_VALUE || 0,
      form_id: 'lead-form',
      lead_subject: form.subject.value,
      lead_optin: form.optin.checked,
      user_data: L.userData(d)
    });
    form.querySelectorAll('input, select, textarea, button').forEach(function (i) { i.disabled = true; });
    document.getElementById('lead-success').hidden = false;
  });

  document.getElementById('reveal-phone').onclick = function () {
    document.getElementById('phone-hidden').hidden = false;
    this.hidden = true;
    L.track('reveal_phone', { location: 'contato' });
  };
})();
