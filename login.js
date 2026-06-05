// ================================================================
//  login.js — Lógica de la página de inicio de sesión
//
//  Depende de: auth.js (debe cargarse antes en el HTML)
// ================================================================


// ----------------------------------------------------------------
// Esperamos a que el DOM esté listo antes de agregar eventos
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

  const btnLogin    = document.getElementById('btn-login');
  const inputEmail  = document.getElementById('login-email');
  const inputPass   = document.getElementById('login-password');
  const errorBox    = document.getElementById('login-error');

  // ── EVENTO: clic en botón "Iniciar sesión" ──────────────────
  btnLogin.addEventListener('click', async () => {

    // Ocultamos error previo
    errorBox.style.display = 'none';

    const email    = inputEmail.value.trim();
    const password = inputPass.value;

    // Validación básica de campos vacíos
    if (!email || !password) {
      errorBox.textContent = 'Por favor completa todos los campos.';
      errorBox.style.display = 'block';
      return;
    }

    // Deshabilitamos el botón para evitar doble clic
    btnLogin.disabled    = true;
    btnLogin.textContent = 'Verificando...';

    // Llamamos a la función login() de auth.js
    // Si retorna false, mostramos el error
    const exito = await login(email, password);

    if (!exito) {
      errorBox.style.display = 'block';
      btnLogin.disabled    = false;
      btnLogin.textContent = 'Iniciar sesión';
    }
    // Si retorna true, auth.js ya redirige automáticamente al dashboard
  });

  // ── Permitir hacer login con la tecla Enter ──────────────────
  inputPass.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnLogin.click();
  });

});
