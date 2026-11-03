(function () {
  var L = window.Lab;
  var el = document.getElementById('account');

  function userId(email) {
    var h = 0;
    for (var i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
    return 'U' + h.toString(36).toUpperCase();
  }

  function renderGuest() {
    el.innerHTML =
      '<div class="grid grid-2">' +
      '<form class="card form" id="login-form"><h2 style="margin:0">Entrar</h2>' +
      '<label>E-mail<input name="email" type="email" required autocomplete="email"></label>' +
      '<label>Senha<input name="password" type="password" required autocomplete="current-password"></label>' +
      '<button class="btn" data-gtm="login">Entrar</button>' +
      '<p class="small muted">Simulado: qualquer e-mail e senha funcionam.</p></form>' +
      '<form class="card form" id="signup-form"><h2 style="margin:0">Criar conta</h2>' +
      '<label>Nome completo<input name="name" required autocomplete="name"></label>' +
      '<label>E-mail<input name="email" type="email" required autocomplete="email"></label>' +
      '<label>Telefone<input name="phone" type="tel" autocomplete="tel"></label>' +
      '<label>Senha<input name="password" type="password" required autocomplete="new-password"></label>' +
      '<button class="btn btn-accent" data-gtm="sign-up">Cadastrar</button></form></div>';

    document.getElementById('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = this.email.value.trim().toLowerCase();
      var name = email.split('@')[0].replace(/[._-]+/g, ' ');
      name = name.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      var u = { id: userId(email), name: name, email: email, phone: '' };
      L.User.set(u);
      L.track('login', { method: 'email', user_id: u.id, user_data: L.userData(u) });
      location.reload();
    });

    document.getElementById('signup-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = { name: this.name.value.trim(), email: this.email.value.trim().toLowerCase(), phone: this.phone.value.trim() };
      u.id = userId(u.email);
      L.User.set(u);
      L.track('sign_up', { method: 'email', user_id: u.id, user_data: L.userData(u) });
      location.reload();
    });
  }

  function renderUser(u) {
    var orders = L.LS.get('gtmlab_orders', []);
    el.innerHTML =
      '<div class="card"><h2 style="margin-top:0">Olá, ' + L.esc(u.name) + '!</h2>' +
      '<p class="muted">' + L.esc(u.email) + ' · ID: <code>' + L.esc(u.id) + '</code></p>' +
      '<p>Pedidos feitos neste navegador: <strong>' + orders.length + '</strong></p>' +
      '<p class="small muted">Com o login, <code>user_logged_in</code> e <code>user_id</code> passam a ser enviados em <code>page_data</code>.</p>' +
      '<button class="btn btn-outline" id="logout" data-gtm="logout">Sair</button></div>';
    document.getElementById('logout').onclick = function () {
      L.track('logout', { user_id: u.id });
      L.User.logout();
      location.reload();
    };
  }

  var user = L.User.get();
  if (user) renderUser(user); else renderGuest();
})();
