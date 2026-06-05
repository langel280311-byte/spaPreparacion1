// ================================================================
//  auth.js — Autenticación, Persistencia de Sesión y Rutas Protegidas
//
//  CRITERIOS QUE CUBRE:
//  ✅ Persistencia de sesión  (localStorage)
//  ✅ Autenticación y rutas protegidas
//  ✅ Gestión de roles (admin / usuario)
//
//  Este archivo se carga PRIMERO en todas las páginas.
// ================================================================


// ----------------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------------

const API_URL    = 'http://localhost:3000';  // Base de la API json-server
const SESSION_KEY = 'spa_sesion';            // Clave en localStorage para guardar la sesión


// ================================================================
//  MÓDULO DE SESIÓN
//  Encapsula todo lo relacionado con guardar/leer/borrar sesión.
//
//  ¿Por qué localStorage?
//  → Persiste aunque el usuario cierre la pestaña o recargue.
//  → Sin localStorage, al recargar la página se perdería la sesión.
// ================================================================

const Sesion = {

  // ── GUARDAR SESIÓN ──────────────────────────────────────────
  // Recibe el objeto usuario y lo serializa a JSON en localStorage.
  // JSON.stringify convierte el objeto → string para poder guardarlo.
  guardar(usuario) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
  },

  // ── OBTENER SESIÓN ──────────────────────────────────────────
  // Lee el string guardado y lo convierte de vuelta a objeto.
  // Si no existe ninguna sesión, devuelve null.
  obtener() {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
    //            ↑ JSON.parse convierte string → objeto
  },

  // ── BORRAR SESIÓN ───────────────────────────────────────────
  // Elimina la clave de localStorage → el usuario queda "deslogueado".
  borrar() {
    localStorage.removeItem(SESSION_KEY);
  },

  // ── ¿HAY SESIÓN ACTIVA? ─────────────────────────────────────
  // Retorna true si existe una sesión guardada, false si no.
  existe() {
    return this.obtener() !== null;
  }

};


// ================================================================
//  PROTECCIÓN DE RUTAS
//
//  CRITERIO: Autenticación y Rutas protegidas
//
//  Lógica:
//  → Si estamos en dashboard.html y NO hay sesión → redirige a login.
//  → Si estamos en index.html (login) y SÍ hay sesión → redirige al dashboard.
//
//  Esto evita que alguien entre a dashboard.html sin haber iniciado sesión,
//  y evita que alguien vea el login si ya está autenticado.
// ================================================================

(function protegerRutas() {

  // Obtenemos el nombre del archivo actual de la URL
  // Ej: "http://localhost/dashboard.html" → "dashboard.html"
  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

  const esDashboard = paginaActual === 'dashboard.html';
  const esLogin     = paginaActual === 'index.html' || paginaActual === '';

  if (esDashboard && !Sesion.existe()) {
    // El usuario intenta acceder al dashboard sin sesión → lo mandamos al login
    window.location.href = 'index.html';
    return;
  }

  if (esLogin && Sesion.existe()) {
    // El usuario ya tiene sesión y abre el login → lo mandamos al dashboard
    window.location.href = 'dashboard.html';
    return;
  }

})();
// La función se llama INMEDIATAMENTE (IIFE) para que la
// verificación ocurra antes de que el resto del JS se ejecute.


// ================================================================
//  FUNCIÓN DE LOGIN
//
//  CRITERIO: Autenticación funcional
//
//  Proceso:
//  1. Busca en la API el usuario con ese email
//  2. Verifica la contraseña
//  3. Si coincide, guarda la sesión y redirige al dashboard
//  4. Si no, muestra error
// ================================================================

async function login(email, password) {

  // Buscamos en la API los usuarios con ese email
  // json-server permite filtrar con ?campo=valor en la URL
  const res  = await fetch(`${API_URL}/usuarios?email=${email}`);
  const lista = await res.json();
  // lista es un array; con [0] tomamos el primer resultado

  const usuario = lista[0];

  // Verificamos que el usuario exista Y que la contraseña coincida
  if (!usuario || usuario.password !== password) {
    // Credenciales incorrectas → retornamos false para que login.js muestre el error
    return false;
  }

  // ✅ Credenciales correctas
  // Guardamos el usuario en localStorage (sin la contraseña por seguridad)
  Sesion.guardar({
    id:     usuario.id,
    nombre: usuario.nombre,
    email:  usuario.email,
    rol:    usuario.rol
    // ⚠️ NO guardamos la password en la sesión
  });

  // Redirigimos al dashboard
  window.location.href = 'dashboard.html';
  return true;
}


// ================================================================
//  FUNCIÓN DE LOGOUT
//
//  Borra la sesión de localStorage y redirige al login.
// ================================================================

function logout() {
  Sesion.borrar();
  window.location.href = 'index.html';
}


// ================================================================
//  VERIFICACIÓN DE ROL
//
//  CRITERIO: Gestión de roles en rutas protegidas
//
//  Retorna true si el usuario autenticado tiene rol "admin".
//  Se usa en app.js para mostrar/ocultar funciones exclusivas.
// ================================================================

function esAdmin() {
  const sesion = Sesion.obtener();
  return sesion !== null && sesion.rol === 'admin';
}
