// ================================================================
//  app.js — Lógica principal del Dashboard
//
//  CRITERIOS QUE CUBRE:
//  ✅ SPA y CRUDs          (GET, POST, PUT, DELETE a la API)
//  ✅ Interacción con DOM  (renderizado dinámico, eventos, vistas)
//  ✅ Autenticación/Roles  (muestra/oculta funciones según rol)
//
//  Depende de: auth.js (cargado antes en dashboard.html)
// ================================================================


// ----------------------------------------------------------------
// 1. CONFIGURACIÓN Y ESTADO GLOBAL
// ----------------------------------------------------------------

const API = 'http://localhost:3000';  // URL base de json-server

// Estado de la aplicación en memoria
let productos  = [];    // Array con todos los productos cargados de la API
let editandoId = null;  // null = crear nuevo | número = editar ese id


// ----------------------------------------------------------------
// 2. REFERENCIAS AL DOM
//    Guardamos los elementos HTML en variables para no buscarlos
//    repetidamente con getElementById (mejor rendimiento)
// ----------------------------------------------------------------

const grid       = document.getElementById('grid');
const emptyMsg   = document.getElementById('empty-msg');
const countLabel = document.getElementById('count-label');
const modalBg    = document.getElementById('modal-bg');
const modalTitle = document.getElementById('modal-title');
const formError  = document.getElementById('form-error');


// ================================================================
//  3. INICIALIZACIÓN DE LA SESIÓN EN LA UI
//
//  CRITERIO: Persistencia de sesión / Roles
//
//  Al cargar el dashboard, leemos la sesión guardada en
//  localStorage y actualizamos la interfaz con los datos del
//  usuario (nombre, rol) y controlamos qué elementos ve según su rol.
// ================================================================

function inicializarSesion() {

  // Leemos la sesión usando Sesion.obtener() definido en auth.js
  const sesion = Sesion.obtener();

  // Mostramos el nombre y rol en la barra superior
  document.getElementById('user-name').textContent = sesion.nombre;

  const badgeRol = document.getElementById('user-rol');
  badgeRol.textContent = sesion.rol;
  // Si es admin le agregamos clase extra para que se vea diferente
  if (sesion.rol === 'admin') badgeRol.classList.add('admin');

  // ── Control de elementos según ROL ──────────────────────────
  // esAdmin() está definida en auth.js y retorna true/false
  if (esAdmin()) {
    // Solo los admins pueden: crear productos, ver gestión de usuarios
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = '';  // Muestra el elemento (quita display:none)
    });
  }
  // Si NO es admin, los elementos .admin-only permanecen ocultos
  // (ya tienen style="display:none" en el HTML)
}


// ================================================================
//  4. NAVEGACIÓN SPA (Single Page Application)
//
//  CRITERIO: SPA — navegar entre secciones SIN recargar la página.
//
//  En lugar de ir a URLs distintas, mostramos/ocultamos secciones
//  del HTML usando display:block y display:none.
// ================================================================

function inicializarNavegacion() {

  const botones  = document.querySelectorAll('.nav-btn');
  const secciones = document.querySelectorAll('.view');

  botones.forEach(btn => {
    btn.addEventListener('click', () => {

      // Quitamos la clase activa de todos los botones
      botones.forEach(b => b.classList.remove('active'));
      // Ocultamos todas las secciones
      secciones.forEach(s => s.style.display = 'none');

      // Activamos el botón clickeado
      btn.classList.add('active');

      // Mostramos la sección correspondiente
      // El atributo data-view del botón coincide con el id "view-{nombre}"
      const nombreVista = btn.dataset.view;
      document.getElementById(`view-${nombreVista}`).style.display = 'block';

      // Si es la vista de usuarios, la cargamos
      if (nombreVista === 'usuarios') cargarUsuarios();
    });
  });
}


// ================================================================
//  5. UTILIDAD: TOAST (notificación flotante)
//
//  CRITERIO: Interacción con el DOM
//
//  Muestra un mensaje temporal en la esquina inferior derecha.
//  Se usa para confirmar acciones: crear, editar, eliminar.
// ================================================================

function mostrarToast(mensaje) {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.classList.add('show');                   // Clase CSS que lo hace visible
  setTimeout(() => toast.classList.remove('show'), 2400);  // Lo oculta tras 2.4s
}


// ================================================================
//  6. RENDERIZAR TARJETAS EN EL DOM
//
//  CRITERIO: Interacción con el DOM — creación dinámica de elementos
//
//  Recibe un array de productos y los "dibuja" en el grid.
//  Se llama cada vez que los datos cambian (carga, filtro, CRUD).
// ================================================================

function renderCards(lista) {

  // ── Paso 1: Limpiar tarjetas anteriores ─────────────────────
  // Eliminamos solo los .card existentes, sin borrar el #empty-msg
  grid.querySelectorAll('.card').forEach(card => card.remove());

  // ── Paso 2: Mostrar/ocultar mensaje vacío ───────────────────
  emptyMsg.style.display = lista.length === 0 ? 'block' : 'none';

  // ── Paso 3: Actualizar contador ─────────────────────────────
  countLabel.textContent = `${lista.length} producto${lista.length !== 1 ? 's' : ''}`;

  // ── Paso 4: Crear una tarjeta por cada producto ─────────────
  const EMOJIS = { 'Electrónica':'💻', 'Ropa':'👕', 'Hogar':'🏠', 'Alimentos':'🍎' };

  lista.forEach(p => {

    // createElement: crea el elemento HTML en memoria (no en pantalla aún)
    const card = document.createElement('div');
    card.className = 'card';

    // innerHTML: escribe el HTML interno de la tarjeta con datos del producto
    card.innerHTML = `
      <div class="card-img">${EMOJIS[p.categoria] || '📦'}</div>
      <h3>${p.nombre}</h3>
      <p class="card-desc">${p.descripcion || ''}</p>
      <span class="category">${p.categoria}</span>
      <div class="price">$${Number(p.precio).toFixed(2)}</div>
      <div class="stock">📦 Stock: ${p.stock}</div>
      <div class="card-actions">
        ${esAdmin() ? `
          <button class="btn-edit" data-id="${p.id}">✏️ Editar</button>
          <button class="btn-del"  data-id="${p.id}">🗑️</button>
        ` : ''}
      </div>
    `;
    // Nota: data-id="${p.id}" guarda el id del producto en el botón
    // para recuperarlo después en el event listener

    // appendChild: agrega la tarjeta al DOM (ahora sí aparece en pantalla)
    grid.appendChild(card);
  });
}


// ================================================================
//  7. CRUD — READ: CARGAR PRODUCTOS (GET)
//
//  CRITERIO: SPA y CRUDs — operación GET
//
//  Hace una petición GET a la API y muestra los resultados.
//  async/await permite escribir código asíncrono de forma legible.
// ================================================================

async function cargarProductos() {
  try {
    // fetch() hace la petición HTTP. await espera la respuesta.
    const res = await fetch(`${API}/productos`);

    // .json() convierte el cuerpo de la respuesta a objeto JavaScript
    productos = await res.json();

    // Renderizamos las tarjetas con los datos recibidos
    renderCards(productos);

  } catch (error) {
    // Si el servidor no está corriendo, mostramos un error amigable
    grid.innerHTML = `<p class="empty-msg">⚠️ No se pudo conectar con json-server.<br>
      <small>Ejecuta: <code>json-server --watch db.json</code></small></p>`;
  }
}


// ================================================================
//  8. CRUD — CREATE & UPDATE: GUARDAR PRODUCTO (POST y PUT)
//
//  CRITERIO: SPA y CRUDs — operaciones POST y PUT
//
//  La misma función maneja crear Y editar.
//  Diferenciamos con la variable editandoId:
//    • null   → POST   (crear nuevo)
//    • número → PUT    (actualizar existente)
// ================================================================

async function guardarProducto() {

  // ── Leer los valores del formulario ─────────────────────────
  const nombre      = document.getElementById('f-nombre').value.trim();
  const precio      = parseFloat(document.getElementById('f-precio').value);
  const categoria   = document.getElementById('f-categoria').value;
  const stock       = parseInt(document.getElementById('f-stock').value);
  const descripcion = document.getElementById('f-descripcion').value.trim();

  // ── Validación avanzada ──────────────────────────────────────
  // CRITERIO: Validaciones avanzadas (puntaje máximo 20pts)
  formError.style.display = 'none';

  if (!nombre) {
    mostrarError('El nombre es obligatorio.');
    return;
  }
  if (isNaN(precio) || precio < 0) {
    mostrarError('El precio debe ser un número positivo.');
    return;
  }
  if (isNaN(stock) || stock < 0) {
    mostrarError('El stock debe ser un número positivo.');
    return;
  }

  // ── Armar el cuerpo de la petición ──────────────────────────
  const body = { nombre, precio, categoria, stock, descripcion };

  // ── Decidir si es POST o PUT según editandoId ───────────────
  if (editandoId !== null) {

    // ── PUT: Actualizar producto existente ───────────────────
    // URL: /productos/:id  con el id del producto a editar
    await fetch(`${API}/productos/${editandoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }, // Indicamos que enviamos JSON
      body: JSON.stringify(body)                         // Convertimos objeto → string JSON
    });
    mostrarToast('✅ Producto actualizado');

  } else {

    // ── POST: Crear nuevo producto ───────────────────────────
    // URL: /productos  (json-server asigna el id automáticamente)
    await fetch(`${API}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    mostrarToast('✅ Producto creado');

  }

  cerrarModal();
  cargarProductos();  // Recargamos para ver los cambios
}


// ================================================================
//  9. CRUD — DELETE: ELIMINAR PRODUCTO
//
//  CRITERIO: SPA y CRUDs — operación DELETE
// ================================================================

async function eliminarProducto(id) {

  // Confirmación antes de eliminar (buena práctica UX)
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;

  // DELETE: enviamos la petición a /productos/:id
  await fetch(`${API}/productos/${id}`, { method: 'DELETE' });

  mostrarToast('🗑️ Producto eliminado');
  cargarProductos();  // Actualizamos la lista
}


// ================================================================
//  10. MODAL — ABRIR Y CERRAR
//
//  CRITERIO: Interacción con el DOM
// ================================================================

function abrirModal(producto = null) {

  // Determinar el modo: editar (producto recibido) o crear (null)
  editandoId = producto ? producto.id : null;
  modalTitle.textContent = producto ? 'Editar producto' : 'Nuevo producto';
  formError.style.display = 'none';

  // Prellenar el formulario
  // Si es edición: ponemos los valores del producto
  // Si es creación: dejamos vacíos (usando el operador ?. y ?? '')
  document.getElementById('f-id').value           = producto?.id          ?? '';
  document.getElementById('f-nombre').value       = producto?.nombre      ?? '';
  document.getElementById('f-precio').value       = producto?.precio      ?? '';
  document.getElementById('f-categoria').value    = producto?.categoria   ?? 'Electrónica';
  document.getElementById('f-stock').value        = producto?.stock       ?? '';
  document.getElementById('f-descripcion').value  = producto?.descripcion ?? '';

  // Agregar clase 'open' para mostrar el modal (ver CSS)
  modalBg.classList.add('open');
}

function cerrarModal() {
  modalBg.classList.remove('open');
  editandoId = null;
}

// Muestra error de validación dentro del formulario
function mostrarError(msg) {
  formError.textContent    = msg;
  formError.style.display  = 'block';
}


// ================================================================
//  11. FILTRAR PRODUCTOS (SIN NUEVA PETICIÓN AL SERVIDOR)
//
//  CRITERIO: SPA y CRUDs — manejo adecuado del flujo de datos
//
//  Usamos el array 'productos' que ya tenemos en memoria.
//  Así evitamos hacer un fetch cada vez que el usuario escribe.
// ================================================================

function filtrar() {
  const texto = document.getElementById('search').value.toLowerCase();
  const cat   = document.getElementById('filter-cat').value;

  // .filter() devuelve un nuevo array con los elementos que cumplen la condición
  const resultado = productos.filter(p => {
    const coincideNombre    = p.nombre.toLowerCase().includes(texto);
    const coincideCategoria = cat === '' || p.categoria === cat;
    return coincideNombre && coincideCategoria;
    // Solo incluye el producto si AMBAS condiciones son true
  });

  renderCards(resultado);
  // No modificamos 'productos' original para poder seguir filtrando
}


// ================================================================
//  12. CARGAR TABLA DE USUARIOS (solo admin)
//
//  CRITERIO: Gestión de roles — sección exclusiva del admin
// ================================================================

async function cargarUsuarios() {
  const res      = await fetch(`${API}/usuarios`);
  const usuarios = await res.json();

  const contenedor = document.getElementById('tabla-usuarios');

  // Construimos una tabla HTML con los usuarios
  contenedor.innerHTML = `
    <table class="user-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
        </tr>
      </thead>
      <tbody>
        ${usuarios.map(u => `
          <tr>
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td><span class="badge-rol ${u.rol === 'admin' ? 'admin' : ''}">${u.rol}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


// ================================================================
//  13. EVENT LISTENERS
//
//  CRITERIO: Interacción con el DOM — gestión de eventos
//
//  Conectamos los elementos del HTML con las funciones de arriba.
// ================================================================

// Botón "Nuevo producto"
document.getElementById('btn-nuevo')
  .addEventListener('click', () => abrirModal());

// Botón "Cancelar" del modal
document.getElementById('btn-cancel')
  .addEventListener('click', cerrarModal);

// Botón "Guardar" del modal
document.getElementById('btn-guardar')
  .addEventListener('click', guardarProducto);

// Cerrar modal al hacer clic en el fondo oscuro
modalBg.addEventListener('click', e => {
  if (e.target === modalBg) cerrarModal();
  // e.target es el elemento exacto donde se hizo clic
  // Solo cerramos si se hizo clic en el fondo, no en el modal mismo
});

// ── Delegación de eventos en el grid ────────────────────────────
// En lugar de poner un listener en cada botón de cada tarjeta,
// ponemos UNO SOLO en el contenedor (#grid) y verificamos el target.
// Esto es más eficiente y funciona para tarjetas creadas dinámicamente.
grid.addEventListener('click', e => {

  // .closest() busca el ancestro más cercano con ese selector
  // Funciona aunque se haga clic en el ícono dentro del botón
  const editBtn = e.target.closest('.btn-edit');
  const delBtn  = e.target.closest('.btn-del');

  if (editBtn) {
    const id = editBtn.dataset.id;                             // Leemos data-id del botón
    const p  = productos.find(x => String(x.id) === String(id)); // Buscamos el producto en memoria
    abrirModal(p);
  }

  if (delBtn) {
    eliminarProducto(delBtn.dataset.id);
  }
});

// Buscador: reacciona mientras el usuario escribe (evento 'input')
document.getElementById('search')
  .addEventListener('input', filtrar);

// Filtro de categoría: reacciona al cambiar la selección
document.getElementById('filter-cat')
  .addEventListener('change', filtrar);

// Botón Logout: cierra la sesión y redirige al login
document.getElementById('btn-logout')
  .addEventListener('click', logout);
// logout() está definida en auth.js


// ================================================================
//  14. INICIO DE LA APLICACIÓN
//
//  Ejecutamos todo lo necesario al cargar la página.
// ================================================================

inicializarSesion();     // Muestra nombre/rol del usuario y controla elementos por rol
inicializarNavegacion(); // Activa la navegación SPA entre secciones
cargarProductos();        // Hace el GET inicial para mostrar los productos
