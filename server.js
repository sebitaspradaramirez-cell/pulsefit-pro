/**
 * ============================================================================
 * PULSEFIT PRO - SERVIDOR BACKEND & API REST (NODE.JS NATIVO)
 * Cero dependencias externas | Persistencia en JSON | Autenticación Segura
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// 1. BASE DE DATOS INICIAL
const DEFAULT_DATABASE = {
  users: [
    {
      id: 'usr_admin_1',
      username: 'admin1',
      password: 'admin1', // Credencial solicitada: usuario admin1, contraseña admin1
      name: 'Alex Rivera',
      role: 'Atleta Master / Admin',
      streak: 5,
      activeSeconds: 1240,
      completedSessions: 3
    }
  ],
  routines: [
    {
      id: 'fuerza-superior',
      title: 'Fuerza Máxima: Torso Titán',
      category: 'fuerza',
      categoryLabel: 'Fuerza',
      difficulty: 'Intermedio • Avanzado',
      duration: '45 min',
      estCalories: 380,
      description: 'Enfoque en desarrollo de fuerza pura, press pesado y tensión mecánica controlada.',
      isExpanded: true,
      exercises: [
        { id: 'f1', name: 'Press de Banca con Barra', sets: 4, reps: '6 reps', rest: 90, completed: false },
        { id: 'f2', name: 'Remo con Barra Pendlay', sets: 4, reps: '6-8 reps', rest: 90, completed: false },
        { id: 'f3', name: 'Press Militar Over-Head', sets: 3, reps: '8 reps', rest: 75, completed: false },
        { id: 'f4', name: 'Dominadas Lastradas / Estrictas', sets: 3, reps: 'Al fallo (6-10)', rest: 90, completed: false }
      ]
    },
    {
      id: 'pierna-hipertrofia',
      title: 'Hipertrofia Explosiva: Tren Inferior',
      category: 'hipertrofia',
      categoryLabel: 'Hipertrofia',
      difficulty: 'Avanzado',
      duration: '50 min',
      estCalories: 450,
      description: 'Volumen alto, bombeo metabólico y estímulo para cuádriceps, glúteos e isquios.',
      isExpanded: false,
      exercises: [
        { id: 'h1', name: 'Sentadilla Trasera Profunda', sets: 4, reps: '10-12 reps', rest: 90, completed: false },
        { id: 'h2', name: 'Prensa Inclinada 45°', sets: 4, reps: '12-15 reps', rest: 60, completed: false },
        { id: 'h3', name: 'Peso Muerto Rumano con Mancuernas', sets: 3, reps: '12 reps', rest: 75, completed: false },
        { id: 'h4', name: 'Elevación de Talones en Máquina', sets: 4, reps: '20 reps', rest: 45, completed: false }
      ]
    },
    {
      id: 'cardio-hiit-burn',
      title: 'Cardio HIIT: Quema Grasa Extrema',
      category: 'cardio',
      categoryLabel: 'Cardio & HIIT',
      difficulty: 'Todos los niveles',
      duration: '25 min',
      estCalories: 320,
      description: 'Intervalos de alta intensidad para máxima capacidad aeróbica y quema calórica.',
      isExpanded: false,
      exercises: [
        { id: 'c1', name: 'Burpees Explosivos con Salto', sets: 5, reps: '45 seg activo', rest: 30, completed: false },
        { id: 'c2', name: 'Mountain Climbers Rápidos', sets: 4, reps: '40 seg activo', rest: 30, completed: false },
        { id: 'c3', name: 'Saltos Dobles a la Cuerda', sets: 4, reps: '50 seg activo', rest: 30, completed: false },
        { id: 'c4', name: 'Sprints en el Sitio / High Knees', sets: 4, reps: '30 seg sprint', rest: 30, completed: false }
      ]
    },
    {
      id: 'movilidad-core',
      title: 'Movilidad Articular & Core Shield',
      category: 'movilidad',
      categoryLabel: 'Movilidad',
      difficulty: 'Salud & Recuperación',
      duration: '20 min',
      estCalories: 150,
      description: 'Prevención de lesiones, descompresión espinal y estabilidad del core profundo.',
      isExpanded: false,
      exercises: [
        { id: 'm1', name: 'Plancha Isométrica con Toque de Hombros', sets: 3, reps: '45 seg', rest: 45, completed: false },
        { id: 'm2', name: 'Deadbug Controlado con Respiración', sets: 3, reps: '12 por lado', rest: 45, completed: false },
        { id: 'm3', name: 'Gato-Camello & Rotaciones Torácicas', sets: 2, reps: '10 ciclos', rest: 30, completed: false },
        { id: 'm4', name: 'Estiramiento del Psoas y Flexores de Cadera', sets: 2, reps: '45s x pierna', rest: 30, completed: false }
      ]
    }
  ],
  historyLog: [
    {
      id: 'hist-1',
      exerciseName: 'Press Militar Over-Head',
      routineTitle: 'Fuerza Máxima: Torso Titán',
      timeString: 'Ayer, 18:30',
      calories: 30,
      sets: 3
    },
    {
      id: 'hist-2',
      exerciseName: 'Sentadilla Trasera Profunda',
      routineTitle: 'Hipertrofia Explosiva: Tren Inferior',
      timeString: 'Ayer, 18:15',
      calories: 35,
      sets: 4
    }
  ],
  sessions: {} // Almacena tokens activos: { token: { userId, expiresAt } }
};

// 2. GESTIÓN DE PERSISTENCIA EN ARCHIVO
function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATABASE, null, 2), 'utf8');
  }
}

function readDatabase() {
  try {
    initDatabase();
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo la base de datos:', err);
    return DEFAULT_DATABASE;
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando en la base de datos:', err);
  }
}

// 3. UTILIDADES DE RESPUESTA HTTP Y CORS
function sendJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(body);
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB límite
        req.connection.destroy();
        reject(new Error('Payload demasiado grande'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function getAuthenticatedUser(req, db) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const session = db.sessions[token];
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    delete db.sessions[token];
    writeDatabase(db);
    return null;
  }

  return db.users.find(u => u.id === session.userId) || null;
}

// 4. SERVIDOR DE ARCHIVOS ESTÁTICOS (FRONTEND)
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStaticFile(req, res, pathname) {
  let safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(__dirname, safePath);

  // Evitar directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Acceso denegado');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Archivo no encontrado');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// 5. CONTROLADOR PRINCIPAL DEL SERVIDOR HTTP
const server = http.createServer(async (req, res) => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // RUTAS DE LA API REST
  if (pathname.startsWith('/api/')) {
    const db = readDatabase();

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      try {
        const body = await parseRequestBody(req);
        const { username, password } = body;

        const user = db.users.find(u => u.username === username && u.password === password);
        if (!user) {
          return sendJSON(res, 401, {
            success: false,
            message: 'Usuario o contraseña incorrectos. Verifica que sean admin1 / admin1.'
          });
        }

        // Generar token de sesión seguro
        const token = 'token_' + crypto.randomBytes(24).toString('hex');
        db.sessions[token] = {
          userId: user.id,
          createdAt: Date.now(),
          expiresAt: Date.now() + (1000 * 60 * 60 * 24 * 7) // 7 días
        };
        writeDatabase(db);

        // Retornar perfil seguro (sin exponer password)
        const safeProfile = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          streak: user.streak,
          completedSessions: user.completedSessions
        };

        return sendJSON(res, 200, {
          success: true,
          message: 'Autenticación exitosa',
          token,
          user: safeProfile
        });
      } catch (err) {
        return sendJSON(res, 400, { success: false, message: 'Petición inválida' });
      }
    }

    // GET /api/auth/me (Verificar sesión actual)
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const user = getAuthenticatedUser(req, db);
      if (!user) {
        return sendJSON(res, 401, { success: false, message: 'No autenticado o sesión expirada' });
      }
      return sendJSON(res, 200, {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          streak: user.streak,
          completedSessions: user.completedSessions
        }
      });
    }

    // POST /api/auth/logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        delete db.sessions[token];
        writeDatabase(db);
      }
      return sendJSON(res, 200, { success: true, message: 'Sesión cerrada correctamente' });
    }

    // GET /api/routines
    if (pathname === '/api/routines' && req.method === 'GET') {
      return sendJSON(res, 200, {
        success: true,
        routines: db.routines
      });
    }

    // POST /api/routines/toggle
    if (pathname === '/api/routines/toggle' && req.method === 'POST') {
      try {
        const body = await parseRequestBody(req);
        const { routineId, exerciseId } = body;

        const routine = db.routines.find(r => r.id === routineId);
        if (!routine) return sendJSON(res, 404, { success: false, message: 'Rutina no encontrada' });

        const exercise = routine.exercises.find(e => e.id === exerciseId);
        if (!exercise) return sendJSON(res, 404, { success: false, message: 'Ejercicio no encontrado' });

        exercise.completed = !exercise.completed;

        // Registrar en historial si se completó
        if (exercise.completed) {
          const now = new Date();
          const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          db.historyLog.unshift({
            id: `log-${Date.now()}`,
            exerciseName: exercise.name,
            routineTitle: routine.title,
            timeString: `Hoy, ${timeFormatted}`,
            calories: 30,
            sets: exercise.sets
          });
        }

        writeDatabase(db);

        return sendJSON(res, 200, {
          success: true,
          exercise,
          routines: db.routines,
          historyLog: db.historyLog
        });
      } catch (err) {
        return sendJSON(res, 400, { success: false, message: 'Error procesando la solicitud' });
      }
    }

    // POST /api/routines/reset
    if (pathname === '/api/routines/reset' && req.method === 'POST') {
      db.routines.forEach(r => {
        r.exercises.forEach(e => (e.completed = false));
      });
      writeDatabase(db);
      return sendJSON(res, 200, {
        success: true,
        message: 'Progreso diario reiniciado con éxito',
        routines: db.routines
      });
    }

    // GET /api/history
    if (pathname === '/api/history' && req.method === 'GET') {
      return sendJSON(res, 200, {
        success: true,
        historyLog: db.historyLog
      });
    }

    // POST /api/history/clear
    if (pathname === '/api/history/clear' && req.method === 'POST') {
      db.historyLog = [];
      writeDatabase(db);
      return sendJSON(res, 200, {
        success: true,
        message: 'Historial de actividad vaciado',
        historyLog: []
      });
    }

    // Si la ruta /api no coincide
    return sendJSON(res, 404, { success: false, message: 'Endpoint no encontrado' });
  }

  // SI NO ES UNA RUTA API, SERVIR EL FRONTEND ESTÁTICO
  serveStaticFile(req, res, pathname);
});

// Iniciar servidor
initDatabase();
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 PULSEFIT PRO - SERVIDOR BACKEND ACTIVO`);
  console.log(`  🌐 Frontend & API: http://localhost:${PORT}`);
  console.log(`  👤 Credenciales de Acceso:`);
  console.log(`     Usuario:    admin1`);
  console.log(`     Contraseña: admin1`);
  console.log(`======================================================\n`);
});
