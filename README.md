# 🛍️ TiendaSPA — Proyecto completo

## 🚀 Cómo correr el proyecto

### 1. Instala json-server (solo una vez)
```bash
npm install -g json-server
```

### 2. Inicia el servidor de datos
Desde esta carpeta:
```bash
json-server --watch db.json
```
API disponible en: **http://localhost:3000**

### 3. Abre index.html en el navegador

---

## 👤 Credenciales de prueba

| Rol    | Email                  | Contraseña  |
|--------|------------------------|-------------|
| Admin  | admin@tienda.com       | admin123    |
| Usuario| carlos@tienda.com      | carlos123   |

---

## 📁 Estructura del proyecto

```
spa-completa/
├── index.html      ← Login (página pública)
├── dashboard.html  ← SPA principal (ruta protegida)
├── style.css       ← Todos los estilos
├── auth.js         ← Sesión, rutas protegidas, roles
├── login.js        ← Lógica del formulario de login
├── app.js          ← CRUD, DOM, navegación SPA
├── db.json         ← Base de datos json-server
└── README.md
```

---

## ✅ Criterios de la rúbrica cubiertos

### 1. SPA y CRUDs (20 pts)
- GET    → cargarProductos()
- POST   → guardarProducto() cuando editandoId === null
- PUT    → guardarProducto() cuando editandoId tiene valor
- DELETE → eliminarProducto(id)
- Navegación SPA sin recargar página

### 2. Persistencia de sesión (20 pts)
- localStorage guarda la sesión al hacer login
- Al recargar, la sesión se mantiene
- Sesion.guardar() / Sesion.obtener() / Sesion.borrar()

### 3. Interacción con el DOM (20 pts)
- Tarjetas creadas dinámicamente con createElement
- Delegación de eventos en el grid
- Modal con animación
- Toast de notificación
- Filtrado reactivo sin fetch extra

### 4. Autenticación y Rutas protegidas (20 pts)
- Login verifica credenciales contra la API
- dashboard.html redirige al login si no hay sesión
- index.html redirige al dashboard si ya hay sesión
- Elementos .admin-only solo visibles para admins
