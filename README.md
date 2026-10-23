# PULSEFIT PRO | Plataforma Full-Stack de Entrenamiento

Plataforma deportiva de alto rendimiento con **Frontend interactivo moderno** (HTML5 semántico, CSS3 Glassmorphism y Dark Theme deportivo, JavaScript ES6+) y **Backend REST API** en **Node.js** con persistencia en base de datos JSON y autenticación segura por tokens.

---

## 🔐 Credenciales de Acceso

- **Usuario:** `admin1`
- **Contraseña:** `admin1`

---

## 🚀 Inicio Rápido del Backend y Frontend

El servidor está desarrollado con módulos nativos de Node.js (`http`, `fs`, `crypto`, `path`), por lo que **no requiere instalar paquetes pesados ni dependencias externas**.

### 1. Iniciar el Servidor:
Abre una terminal en este directorio y ejecuta:

```bash
node server.js
```
*(O alternativamente: `npm start`)*

### 2. Abrir la Aplicación:
Accede desde cualquier navegador web en tu computadora o móvil conectado a la red:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ Integración con Supabase (Base de Datos en la Nube & PostgreSQL)

La aplicación cuenta con soporte nativo para **Supabase**: Base de datos relacional PostgreSQL en la nube, autenticación y persistencia en tiempo real sin necesidad de servidores intermediarios.

### 5 Pasos para subir tu proyecto a Supabase:

1. **Crear cuenta y proyecto:**
   - Entra en [supabase.com](https://supabase.com) y crea un nuevo proyecto gratuito.
2. **Ejecutar el Script SQL:**
   - En tu panel de Supabase, ve a la sección **SQL Editor** (icono `>_`).
   - Abre el archivo local [`supabase_schema.sql`](file:///c:/Users/Admin/Documents/DPM/supabase_schema.sql), copia todo su contenido, pégalo en el editor y haz clic en **Run**.
   - Esto creará automáticamente las tablas (`profiles`, `routines`, `exercises`, `activity_logs`), las políticas de seguridad (RLS) y los datos iniciales con el usuario `admin1` / `admin1`.
3. **Obtener las Claves API:**
   - En tu proyecto de Supabase, ve a **Project Settings** (icono de engranaje) ➔ **API**.
   - Copia la **Project URL** (`https://xyzcompany.supabase.co`).
   - Copia la **Project API Key** anon / public (`eyJh...`).
4. **Vincular en la App:**
   - Abre el archivo [`supabaseClient.js`](file:///c:/Users/Admin/Documents/DPM/supabaseClient.js) y reemplaza los valores de `SUPABASE_CONFIG`:
     ```javascript
     const SUPABASE_CONFIG = {
       url: 'https://TU-PROYECTO.supabase.co',
       anonKey: 'TU-SUPABASE-ANON-KEY'
     };
     ```
5. **¡Listo!:**
   - Abre [`index.html`](file:///c:/Users/Admin/Documents/DPM/index.html) o arranca el servidor (`npm start`). Verás el badge verde indicando conexión a Supabase y podrás iniciar sesión directamente con `admin1` / `admin1`. Todos los ejercicios marcados y actividades se guardarán instantáneamente en tu PostgreSQL de Supabase.

---

## 🛠️ Estructura del Proyecto

```
DPM/
├── supabase_schema.sql  # Script SQL listo para ejecutar en Supabase SQL Editor
├── supabaseClient.js    # Cliente oficial y lógica CRUD con Supabase JS SDK
├── server.js            # Servidor Backend HTTP & API REST de respaldo (Node.js nativo)
├── package.json         # Manifiesto del proyecto y scripts
├── index.html           # Frontend: Pantalla de Login, Dashboard y Vistas Móviles
├── styles.css           # Estilos: Glassmorphism, Tema Deportivo Neón y Responsive
├── app.js               # Lógica cliente: Autenticación, Temporizador, Historial y Audio
└── data/
    └── db.json          # Base de datos JSON local (modo offline/fallback)
```

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Inicia sesión con `admin1` / `admin1` y retorna token de sesión. |
| `GET` | `/api/auth/me` | Verifica la sesión activa y retorna el perfil del usuario autenticado. |
| `POST` | `/api/auth/logout` | Cierra la sesión activa invalidando el token en el servidor. |
| `GET` | `/api/routines` | Retorna el catálogo completo de rutinas y ejercicios. |
| `POST` | `/api/routines/toggle` | Marca/desmarca un ejercicio y genera registro en el historial. |
| `POST` | `/api/routines/reset` | Reinicia las marcas de la sesión del día en la base de datos. |
| `GET` | `/api/history` | Retorna el historial cronológico y métricas acumuladas. |
| `POST` | `/api/history/clear` | Vacía el historial de actividades en el servidor. |

---

## 💡 Modo de Contingencia Offline
Si abres directamente el archivo `index.html` con doble clic (`file:///`), el sistema cuenta con un motor de fallback que permite autenticar con `admin1` / `admin1` de forma local manteniendo toda la funcionalidad activa.
