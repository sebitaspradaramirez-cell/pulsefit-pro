/**
 * ============================================================================
 * PULSEFIT PRO - MOTOR DE ENTRENAMIENTO & ADAPTACIÓN DUAL (PC + CELULAR)
 * Autenticación de Usuario (admin1 / admin1) | API REST | Device Adapter
 * ============================================================================
 */

/* ============================================================================
   1. CLIENTE DE API Y SERVICIO DE AUTENTICACIÓN
   ============================================================================ */
class ApiClient {
  constructor() {
    this.baseUrl = window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:3000';
    this.tokenKey = 'PULSEFIT_AUTH_TOKEN';
    this.userKey = 'PULSEFIT_AUTH_USER';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getUser() {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      return { ok: false, status: 0, error: err, isNetworkError: true };
    }
  }

  async login(username, password) {
    // 1. Probar autenticación directa en Supabase si está configurado
    if (window.pulsefitSupabase && window.pulsefitSupabase.isActive()) {
      const supaRes = await window.pulsefitSupabase.login(username, password);
      if (supaRes && supaRes.success) {
        this.setSession('supabase_token_' + supaRes.user.id, supaRes.user);
        return { success: true, user: supaRes.user, provider: 'supabase' };
      } else if (supaRes && !supaRes.success) {
        return supaRes;
      }
    }

    // 2. Servidor Backend local Node.js
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (res.ok && res.data.success) {
      this.setSession(res.data.token, res.data.user);
      return { success: true, user: res.data.user };
    }

    // Fallback de contingencia si no hay backend activo (ej. ejecución offline file:///)
    if (res.isNetworkError && username === 'admin1' && password === 'admin1') {
      const fallbackUser = {
        id: 'usr_admin_1',
        username: 'admin1',
        name: 'Alex Rivera',
        role: 'Atleta Master / Admin'
      };
      this.setSession('offline_token_admin1', fallbackUser);
      return { success: true, user: fallbackUser, isOffline: true };
    }

    return {
      success: false,
      message: res.data?.message || 'Error de conexión con el servidor backend'
    };
  }

  async checkAuth() {
    const token = this.getToken();
    if (!token) return null;

    if (token === 'offline_token_admin1' || (typeof token === 'string' && token.startsWith('supabase_token_'))) {
      return this.getUser();
    }

    const res = await this.request('/api/auth/me');
    if (res.ok && res.data.success) {
      this.setSession(token, res.data.user);
      return res.data.user;
    }

    this.clearSession();
    return null;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.clearSession();
  }
}

/* ============================================================================
   2. ADAPTADOR INTELIGENTE DE DISPOSITIVO (PC vs MÓVIL vs TABLET)
   ============================================================================ */
class DeviceAdapter {
  constructor() {
    this.currentDevice = 'desktop';
    this.init();
  }

  init() {
    this.detect();
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.detect(), 80);
    });
  }

  detect() {
    const width = window.innerWidth;
    let device = 'desktop';

    if (width < 768) {
      device = 'mobile';
    } else if (width < 1024) {
      device = 'tablet';
    } else {
      device = 'desktop';
    }

    this.currentDevice = device;
    document.body.classList.remove('device-desktop', 'device-tablet', 'device-mobile', 'adaptive-loading');
    document.body.classList.add(`device-${device}`);

    const badgeText = document.getElementById('deviceBadgeText');
    const badgeIcon = document.getElementById('deviceBadgeIcon');
    if (badgeText && badgeIcon) {
      if (device === 'desktop') {
        badgeText.textContent = 'PC Desktop';
        badgeIcon.className = 'ph-bold ph-desktop';
      } else if (device === 'tablet') {
        badgeText.textContent = 'Tablet';
        badgeIcon.className = 'ph-bold ph-device-tablet';
      } else {
        badgeText.textContent = 'Móvil';
        badgeIcon.className = 'ph-bold ph-device-mobile';
      }
    }
  }

  isDesktop() {
    return this.currentDevice === 'desktop';
  }

  isMobile() {
    return this.currentDevice === 'mobile';
  }
}

/* ============================================================================
   3. MODELO DE DATOS Y RUTINAS PREDEFINIDAS
   ============================================================================ */
const INITIAL_ROUTINES = [
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
];

/* ============================================================================
   4. GESTOR DE ESTADO REACTIVO E HISTORIAL (AppState)
   ============================================================================ */
class AppState {
  constructor(apiClient) {
    this.api = apiClient;
    this.storageKey = 'PULSEFIT_APP_STATE_V3';
    this.activeCategory = 'all';
    this.currentView = 'routines';
    this.currentUser = null;
    this.loadLocalFallback();
  }

  loadLocalFallback() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.routines = parsed.routines || INITIAL_ROUTINES;
        this.streak = parsed.streak || 5;
        this.activeSeconds = parsed.activeSeconds || 0;
        this.audioEnabled = parsed.audioEnabled !== undefined ? parsed.audioEnabled : true;
        this.isDarkTheme = parsed.isDarkTheme !== undefined ? parsed.isDarkTheme : true;
        this.historyLog = parsed.historyLog || [];
        this.completedSessions = parsed.completedSessions || 0;
      } catch (e) {
        this.resetDefaults();
      }
    } else {
      this.resetDefaults();
    }
  }

  resetDefaults() {
    this.routines = JSON.parse(JSON.stringify(INITIAL_ROUTINES));
    this.streak = 5;
    this.activeSeconds = 0;
    this.audioEnabled = true;
    this.isDarkTheme = true;
    this.historyLog = [
      {
        id: 'hist-demo-1',
        exerciseName: 'Press Militar Over-Head',
        routineTitle: 'Fuerza Máxima: Torso Titán',
        timeString: 'Ayer, 18:30',
        calories: 30,
        sets: 3
      },
      {
        id: 'hist-demo-2',
        exerciseName: 'Sentadilla Trasera Profunda',
        routineTitle: 'Hipertrofia Explosiva: Tren Inferior',
        timeString: 'Ayer, 18:15',
        calories: 35,
        sets: 4
      }
    ];
    this.completedSessions = 1;
    this.saveLocal();
  }

  saveLocal() {
    const dataToSave = {
      routines: this.routines,
      streak: this.streak,
      activeSeconds: this.activeSeconds,
      audioEnabled: this.audioEnabled,
      isDarkTheme: this.isDarkTheme,
      historyLog: this.historyLog,
      completedSessions: this.completedSessions
    };
    localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
  }

  async syncWithBackend() {
    if (window.pulsefitSupabase && window.pulsefitSupabase.isActive()) {
      const supaRoutines = await window.pulsefitSupabase.getRoutines();
      if (supaRoutines && supaRoutines.length > 0) {
        this.routines = supaRoutines;
      }
      const supaHistory = await window.pulsefitSupabase.getHistory();
      if (supaHistory) {
        this.historyLog = supaHistory;
      }
      this.saveLocal();
      return;
    }

    const resRoutines = await this.api.request('/api/routines');
    if (resRoutines.ok && resRoutines.data.routines) {
      this.routines = resRoutines.data.routines;
    }

    const resHistory = await this.api.request('/api/history');
    if (resHistory.ok && resHistory.data.historyLog) {
      this.historyLog = resHistory.data.historyLog;
    }

    this.saveLocal();
  }

  async toggleExercise(routineId, exerciseId) {
    if (window.pulsefitSupabase && window.pulsefitSupabase.isActive()) {
      const routine = this.routines.find(r => r.id === routineId);
      if (routine) {
        const ex = routine.exercises.find(e => e.id === exerciseId);
        if (ex) {
          const nextState = !ex.completed;
          await window.pulsefitSupabase.toggleExercise(exerciseId, nextState);
          ex.completed = nextState;
          if (nextState) {
            const now = new Date();
            const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const logEntry = {
              id: `log-${Date.now()}`,
              exerciseName: ex.name,
              routineTitle: routine.title,
              timeString: `Hoy, ${timeFormatted}`,
              calories: 30,
              sets: ex.sets
            };
            await window.pulsefitSupabase.logActivity(logEntry);
            this.historyLog.unshift(logEntry);
          } else {
            const idx = this.historyLog.findIndex(item => item.exerciseName === ex.name);
            if (idx !== -1) this.historyLog.splice(idx, 1);
          }
          this.saveLocal();
          return ex;
        }
      }
    }

    const res = await this.api.request('/api/routines/toggle', {
      method: 'POST',
      body: JSON.stringify({ routineId, exerciseId })
    });

    if (res.ok && res.data.success) {
      this.routines = res.data.routines;
      this.historyLog = res.data.historyLog;
      this.saveLocal();
      return res.data.exercise;
    }

    // Fallback local
    const routine = this.routines.find(r => r.id === routineId);
    if (!routine) return null;
    const ex = routine.exercises.find(e => e.id === exerciseId);
    if (!ex) return null;

    ex.completed = !ex.completed;
    if (ex.completed) {
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.historyLog.unshift({
        id: `log-${Date.now()}`,
        exerciseName: ex.name,
        routineTitle: routine.title,
        timeString: `Hoy, ${timeFormatted}`,
        calories: 30,
        sets: ex.sets
      });
    } else {
      const idx = this.historyLog.findIndex(item => item.exerciseName === ex.name);
      if (idx !== -1) this.historyLog.splice(idx, 1);
    }

    this.saveLocal();
    return ex;
  }

  toggleRoutineExpand(routineId) {
    const routine = this.routines.find(r => r.id === routineId);
    if (routine) {
      routine.isExpanded = !routine.isExpanded;
    }
  }

  async resetDailyProgress() {
    if (window.pulsefitSupabase && window.pulsefitSupabase.isActive()) {
      await window.pulsefitSupabase.resetDaily();
      this.routines.forEach(r => {
        r.exercises.forEach(e => (e.completed = false));
      });
      this.saveLocal();
      return;
    }
    await this.api.request('/api/routines/reset', { method: 'POST' });
    this.routines.forEach(r => {
      r.exercises.forEach(e => (e.completed = false));
    });
    this.saveLocal();
  }

  async clearHistoryLog() {
    if (window.pulsefitSupabase && window.pulsefitSupabase.isActive()) {
      await window.pulsefitSupabase.clearHistory();
      this.historyLog = [];
      this.saveLocal();
      return;
    }
    await this.api.request('/api/history/clear', { method: 'POST' });
    this.historyLog = [];
    this.saveLocal();
  }

  recordSessionFinished() {
    this.completedSessions++;
    this.streak++;
    this.saveLocal();
  }

  getOverallProgress() {
    let total = 0;
    let completed = 0;
    this.routines.forEach(r => {
      r.exercises.forEach(e => {
        total++;
        if (e.completed) completed++;
      });
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const estKcal = completed * 30;
    return { total, completed, percentage, estKcal };
  }

  getHistoryTotals() {
    const totalSeries = this.historyLog.reduce((acc, cur) => acc + (cur.sets || 1), 0);
    const totalCalories = this.historyLog.reduce((acc, cur) => acc + (cur.calories || 30), 0);
    const totalMinutes = Math.floor(this.activeSeconds / 60);
    const formattedTime = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

    return {
      totalSeries,
      totalCalories: `${totalCalories} kcal`,
      formattedTime: this.activeSeconds > 0 ? formattedTime : '0m',
      completedSessions: this.completedSessions
    };
  }
}

/* ============================================================================
   5. SINTETIZADOR DE AUDIO NATIVO (Web Audio API)
   ============================================================================ */
class SoundFxEngine {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq = 600, duration = 0.12, type = 'sine') {
    try {
      this.init();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio silencioso si no es compatible
    }
  }

  playCountdownWarning() {
    this.playTone(440, 0.15, 'triangle');
  }

  playFinishFanfare() {
    try {
      this.init();
      const chord = [523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 0.22, 'sine'), idx * 110);
      });
    } catch (e) {}
  }
}

/* ============================================================================
   6. TEMPORIZADOR Y CRONÓMETRO DUAL (WorkoutTimer)
   ============================================================================ */
class WorkoutTimer {
  constructor(soundFx, onTick, onComplete) {
    this.soundFx = soundFx;
    this.onTick = onTick;
    this.onComplete = onComplete;

    this.mode = 'countdown';
    this.duration = 60;
    this.remaining = 60;
    this.stopwatchElapsed = 0;
    this.isRunning = false;
    this.timerInterval = null;
    this.circleCircumference = 660; // 2 * PI * 105
  }

  setMode(newMode) {
    this.pause();
    this.mode = newMode;
    if (this.mode === 'stopwatch') {
      this.stopwatchElapsed = 0;
    } else {
      this.remaining = this.duration;
    }
    this.notifyTick();
  }

  setDuration(seconds) {
    this.duration = Math.max(5, seconds);
    if (!this.isRunning) {
      this.remaining = this.duration;
      this.notifyTick();
    }
  }

  adjustTime(deltaSeconds) {
    if (this.mode === 'countdown') {
      this.remaining = Math.max(5, this.remaining + deltaSeconds);
      if (!this.isRunning) {
        this.duration = this.remaining;
      }
      this.notifyTick();
    }
  }

  togglePlay() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.soundFx.init();

    this.timerInterval = setInterval(() => {
      if (this.mode === 'countdown') {
        this.remaining--;

        if (state.audioEnabled && this.remaining > 0 && this.remaining <= 3) {
          this.soundFx.playCountdownWarning();
          if (navigator.vibrate) navigator.vibrate(80);
        }

        if (this.remaining <= 0) {
          this.complete();
        }
      } else {
        this.stopwatchElapsed++;
      }
      this.notifyTick();
    }, 1000);

    this.notifyTick();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.notifyTick();
  }

  reset() {
    this.pause();
    if (this.mode === 'countdown') {
      this.remaining = this.duration;
    } else {
      this.stopwatchElapsed = 0;
    }
    this.notifyTick();
  }

  complete() {
    this.pause();
    this.remaining = 0;
    if (state.audioEnabled) {
      this.soundFx.playFinishFanfare();
    }
    if (navigator.vibrate) {
      navigator.vibrate([150, 80, 150, 80, 300]);
    }
    if (this.onComplete) {
      this.onComplete();
    }
  }

  notifyTick() {
    let displayTime = '';
    let progressRatio = 0;

    if (this.mode === 'countdown') {
      displayTime = this.formatTime(this.remaining);
      progressRatio = this.duration > 0 ? this.remaining / this.duration : 0;
    } else {
      displayTime = this.formatTime(this.stopwatchElapsed);
      progressRatio = (this.stopwatchElapsed % 60) / 60;
    }

    const strokeDashoffset = this.circleCircumference * (1 - progressRatio);

    if (this.onTick) {
      this.onTick({
        displayTime,
        strokeDashoffset,
        isRunning: this.isRunning,
        mode: this.mode,
        remaining: this.remaining
      });
    }
  }

  formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

/* ============================================================================
   7. MOTOR DE PARTÍCULAS CANVAS (ConfettiEngine)
   ============================================================================ */
class ConfettiEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationId = null;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  trigger(count = 90) {
    if (!this.canvas || !this.ctx) return;
    this.resizeCanvas();
    this.particles = [];
    const colors = ['#00FF87', '#60EFFF', '#FF6B4A', '#8A2BE2', '#FFFFFF', '#FFB703'];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: this.canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 1.2) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.42,
        opacity: 1
      });
    }

    if (!this.animationId) {
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.009;

      if (p.opacity <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.loop());
    } else {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

/* ============================================================================
   8. SISTEMA DE TOAST NOTIFICATIONS
   ============================================================================ */
function showToast(title, message, isEnergy = false) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${isEnergy ? 'toast-energy' : ''}`;
  toast.innerHTML = `
    <i class="${isEnergy ? 'ph-bold ph-lightning' : 'ph-bold ph-check-circle'}"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ============================================================================
   9. INSTANCIACIÓN DE SERVICIOS GLOBALES
   ============================================================================ */
const apiClient = new ApiClient();
const deviceAdapter = new DeviceAdapter();
const state = new AppState(apiClient);
const soundEngine = new SoundFxEngine();
const confetti = new ConfettiEngine('confettiCanvas');

// Inicializar Temporizador
const timer = new WorkoutTimer(
  soundEngine,
  // Callback en cada segundo
  (data) => {
    const display = document.getElementById('timerDisplay');
    const circle = document.getElementById('timerCircleProgress');
    const playBtnText = document.getElementById('playBtnText');
    const playIcon = document.getElementById('playIcon');
    const subStatus = document.getElementById('timerSubStatus');

    if (display) display.textContent = data.displayTime;
    if (circle) circle.style.strokeDashoffset = data.strokeDashoffset;

    if (playBtnText && playIcon) {
      if (data.isRunning) {
        playBtnText.textContent = 'Pausar';
        playIcon.className = 'ph-fill ph-pause';
        if (subStatus) subStatus.textContent = data.mode === 'countdown' ? 'En Marcha' : 'Cronometrando';
      } else {
        playBtnText.textContent = 'Iniciar';
        playIcon.className = 'ph-fill ph-play';
        if (subStatus) subStatus.textContent = data.remaining === 0 ? 'Completado' : 'Listo';
      }
    }
  },
  // Callback al terminar cuenta regresiva
  () => {
    showToast('¡Tiempo Cumplido!', 'Intervalo de descanso finalizado. ¡A por la siguiente serie!', true);
  }
);

// Ticker de Tiempo Activo
setInterval(() => {
  if (state.currentUser) {
    state.activeSeconds++;
    const m = Math.floor(state.activeSeconds / 60).toString().padStart(2, '0');
    const s = (state.activeSeconds % 60).toString().padStart(2, '0');
    const el = document.getElementById('activeTimeCounter');
    if (el) el.textContent = `${m}:${s}`;
    if (state.activeSeconds % 30 === 0) {
      state.saveLocal();
    }
  }
}, 1000);

/* ============================================================================
   10. CONTROLADORES DE RENDERIZADO
   ============================================================================ */
function renderDashboard() {
  renderSummary();
  renderRoutines();
  renderHistoryView();
  renderUserProfile();
}

function renderUserProfile() {
  if (!state.currentUser) return;
  const usernameEl = document.getElementById('headerUsername');
  const userRoleEl = document.getElementById('headerUserRole');

  if (usernameEl) usernameEl.textContent = state.currentUser.username || 'admin1';
  if (userRoleEl) userRoleEl.textContent = state.currentUser.role ? 'Admin' : 'Atleta';
}

function renderSummary() {
  const { total, completed, percentage, estKcal } = state.getOverallProgress();

  const percentageEl = document.getElementById('globalPercentageText');
  const progressBar = document.getElementById('globalProgressBar');
  const completedCount = document.getElementById('completedCount');
  const totalCount = document.getElementById('totalCount');
  const caloriesEl = document.getElementById('caloriesBurnedEst');
  const streakCount = document.getElementById('streakCount');

  if (percentageEl) percentageEl.textContent = `${percentage}%`;
  if (progressBar) progressBar.style.width = `${percentage}%`;
  if (completedCount) completedCount.textContent = completed;
  if (totalCount) totalCount.textContent = total;
  if (caloriesEl) caloriesEl.innerHTML = `<i class="ph-bold ph-flame"></i> ~${estKcal} kcal`;
  if (streakCount) streakCount.textContent = state.streak;
}

function renderRoutines() {
  const container = document.getElementById('routinesList');
  if (!container) return;

  const filtered = state.routines.filter(r => {
    if (state.activeCategory === 'all') return true;
    return r.category === state.activeCategory;
  });

  const badgeCount = document.getElementById('routinesCountBadge');
  if (badgeCount) badgeCount.textContent = filtered.length;

  container.innerHTML = '';

  filtered.forEach(routine => {
    const routineCard = document.createElement('article');
    routineCard.className = `routine-card glass-card ${routine.isExpanded ? 'expanded' : ''}`;
    routineCard.dataset.routineId = routine.id;

    const exCount = routine.exercises.length;
    const exDone = routine.exercises.filter(e => e.completed).length;
    const cardProgress = exCount > 0 ? Math.round((exDone / exCount) * 100) : 0;

    let exercisesHtml = '';
    routine.exercises.forEach(ex => {
      exercisesHtml += `
        <div class="exercise-item ${ex.completed ? 'completed' : ''}" data-exercise-id="${ex.id}">
          <div class="exercise-left">
            <button class="custom-checkbox ${ex.completed ? 'checked' : ''}" 
                    aria-label="Marcar ${ex.name}" 
                    data-action="toggle-ex" 
                    data-routine="${routine.id}" 
                    data-ex="${ex.id}">
              <i class="ph-bold ph-check"></i>
            </button>
            <div class="exercise-meta">
              <span class="exercise-name">${ex.name}</span>
              <span class="exercise-details">
                <span><strong>${ex.sets}</strong> series</span> • 
                <span>${ex.reps}</span> • 
                <span><i class="ph-bold ph-clock"></i> ${ex.rest}s descanso</span>
              </span>
            </div>
          </div>
          <div class="exercise-actions">
            <button class="quick-timer-btn" 
                    data-action="load-timer" 
                    data-rest="${ex.rest}" 
                    data-name="${ex.name}">
              <i class="ph-bold ph-hourglass-simple-medium"></i> ${ex.rest}s
            </button>
          </div>
        </div>
      `;
    });

    routineCard.innerHTML = `
      <div class="routine-header" data-action="toggle-accordion" data-routine="${routine.id}">
        <div class="routine-top-meta">
          <div class="routine-tags">
            <span class="tag ${routine.category}">${routine.categoryLabel}</span>
            <span class="diff-badge">${routine.difficulty}</span>
          </div>
          <span class="diff-badge"><i class="ph-bold ph-timer"></i> ${routine.duration}</span>
        </div>

        <div class="routine-main-info">
          <div>
            <h4>${routine.title}</h4>
            <p>${routine.description}</p>
          </div>
          <div class="chevron-indicator">
            <i class="ph-bold ph-caret-down"></i>
          </div>
        </div>
      </div>

      <div class="routine-card-progress">
        <div class="card-progress-track">
          <div class="card-progress-fill" style="width: ${cardProgress}%;"></div>
        </div>
        <div class="card-progress-text">
          <span>${exDone} de ${exCount} completados</span>
          <span>${cardProgress}%</span>
        </div>
      </div>

      <div class="exercises-container">
        ${exercisesHtml}
      </div>
    `;

    container.appendChild(routineCard);
  });
}

function renderHistoryView() {
  const totals = state.getHistoryTotals();

  const histTotalCompleted = document.getElementById('histTotalCompleted');
  const histTotalCalories = document.getElementById('histTotalCalories');
  const histTotalTime = document.getElementById('histTotalTime');
  const histCompletedSessions = document.getElementById('histCompletedSessions');
  const historyCountBadge = document.getElementById('historyCountBadge');
  const desktopHistoryBadge = document.getElementById('desktopHistoryBadge');
  const timelineCountNote = document.getElementById('timelineCountNote');

  if (histTotalCompleted) histTotalCompleted.textContent = totals.totalSeries;
  if (histTotalCalories) histTotalCalories.textContent = totals.totalCalories;
  if (histTotalTime) histTotalTime.textContent = totals.formattedTime;
  if (histCompletedSessions) histCompletedSessions.textContent = totals.completedSessions;
  if (historyCountBadge) historyCountBadge.textContent = state.historyLog.length;
  if (desktopHistoryBadge) desktopHistoryBadge.textContent = state.historyLog.length;
  if (timelineCountNote) timelineCountNote.textContent = `${state.historyLog.length} registros`;

  // Renderizar Constancia Semanal (Lunes a Domingo)
  const weeklyRow = document.getElementById('weeklyDaysRow');
  if (weeklyRow) {
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const todayIndex = (new Date().getDay() + 6) % 7;

    weeklyRow.innerHTML = days.map((day, idx) => {
      const isToday = idx === todayIndex;
      const hasTrained = idx <= todayIndex;
      return `
        <div class="day-pill ${hasTrained ? 'active' : ''} ${isToday ? 'today' : ''}">
          <span class="day-name">${day}</span>
          <span class="day-status-dot"></span>
        </div>
      `;
    }).join('');
  }

  // Renderizar Timeline Cronológico
  const timelineList = document.getElementById('activityTimelineList');
  if (timelineList) {
    if (state.historyLog.length === 0) {
      timelineList.innerHTML = `
        <div class="timeline-empty">
          <i class="ph-bold ph-calendar-blank"></i>
          <p>No tienes registros de actividad aún.<br>Marca un ejercicio completado para empezar a registrar tu progreso.</p>
        </div>
      `;
    } else {
      timelineList.innerHTML = state.historyLog.map(item => `
        <div class="timeline-item">
          <div class="timeline-left">
            <div class="timeline-bullet">
              <i class="ph-bold ph-check"></i>
            </div>
            <div>
              <div class="timeline-ex-name">${item.exerciseName}</div>
              <div class="timeline-routine-tag">${item.routineTitle} • ${item.sets || 3} series</div>
            </div>
          </div>
          <div class="timeline-right">
            <span class="timeline-time">${item.timeString}</span>
            <span class="timeline-kcal-badge">+${item.calories || 30} kcal</span>
          </div>
        </div>
      `).join('');
    }
  }
}

function switchView(viewName) {
  state.currentView = viewName;

  const routinesContainer = document.getElementById('routinesViewContainer');
  const historyContainer = document.getElementById('historyViewContainer');

  // Botones Mobile View Switcher
  const btnRoutines = document.getElementById('viewRoutinesBtn');
  const btnHistory = document.getElementById('viewHistoryBtn');

  // Botones Desktop Header Nav
  const desktopNavRoutines = document.getElementById('desktopNavRoutines');
  const desktopNavHistory = document.getElementById('desktopNavHistory');

  // Botones Mobile Bottom Dock
  const mobileNavRoutines = document.getElementById('mobileNavRoutines');
  const mobileNavHistory = document.getElementById('mobileNavHistory');

  if (viewName === 'routines') {
    if (routinesContainer) routinesContainer.classList.add('active');
    if (historyContainer) historyContainer.classList.remove('active');

    btnRoutines?.classList.add('active');
    btnHistory?.classList.remove('active');

    desktopNavRoutines?.classList.add('active');
    desktopNavHistory?.classList.remove('active');

    mobileNavRoutines?.classList.add('active');
    mobileNavHistory?.classList.remove('active');
  } else {
    if (historyContainer) historyContainer.classList.add('active');
    if (routinesContainer) routinesContainer.classList.remove('active');

    btnHistory?.classList.add('active');
    btnRoutines?.classList.remove('active');

    desktopNavHistory?.classList.add('active');
    desktopNavRoutines?.classList.remove('active');

    mobileNavHistory?.classList.add('active');
    mobileNavRoutines?.classList.remove('active');

    renderHistoryView();
  }
}

function selectPreset(seconds) {
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    if (parseInt(btn.dataset.time, 10) === seconds) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  timer.setDuration(seconds);
  timer.reset();
  showToast('Preset Seleccionado', `${seconds} segundos fijados en el temporizador.`);
}

/* ============================================================================
   11. GESTIÓN DE VISTAS DE AUTENTICACIÓN
   ============================================================================ */
function showApp(user) {
  state.currentUser = user;
  const authOverlay = document.getElementById('authOverlay');
  const mainApp = document.getElementById('mainAppContent');

  if (authOverlay) authOverlay.classList.remove('active');
  if (mainApp) mainApp.style.display = 'block';

  renderDashboard();
  timer.notifyTick();
}

function showAuthModal() {
  state.currentUser = null;
  const authOverlay = document.getElementById('authOverlay');
  const mainApp = document.getElementById('mainAppContent');

  if (mainApp) mainApp.style.display = 'none';
  if (authOverlay) authOverlay.classList.add('active');

  const errorEl = document.getElementById('loginErrorMessage');
  if (errorEl) errorEl.style.display = 'none';
}

/* ============================================================================
   12. EVENT LISTENERS & INICIALIZACIÓN
   ============================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // Configurar tema inicial
  if (!state.isDarkTheme) {
    document.body.classList.add('light-theme');
  }

  // Detectar y adaptar dispositivo
  deviceAdapter.detect();

  // Comprobar sesión existente
  const existingUser = await apiClient.checkAuth();
  if (existingUser) {
    await state.syncWithBackend();
    showApp(existingUser);
    showToast('Bienvenido de nuevo', `Sesión activa como ${existingUser.username}`);
  } else {
    showAuthModal();
  }

  // 1. Manejo del Formulario de Login
  const loginForm = document.getElementById('loginForm');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginErrorMsg = document.getElementById('loginErrorMessage');
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (loginErrorMsg) loginErrorMsg.style.display = 'none';
      if (loginBtnText) loginBtnText.textContent = 'Verificando...';
      if (loginSubmitBtn) loginSubmitBtn.disabled = true;

      const result = await apiClient.login(username, password);

      if (result.success) {
        await state.syncWithBackend();
        showApp(result.user);
        showToast('Acceso Concedido', `Bienvenido ${result.user.username} a PULSEFIT Pro`);
        loginForm.reset();
      } else {
        if (loginErrorMsg) {
          loginErrorMsg.textContent = result.message || 'Credenciales inválidas. Usa admin1 / admin1.';
          loginErrorMsg.style.display = 'block';
        }
      }

      if (loginBtnText) loginBtnText.textContent = 'Ingresar a la Plataforma';
      if (loginSubmitBtn) loginSubmitBtn.disabled = false;
    });
  }

  // 2. Botón de Autocompletado Rápido de Credenciales (admin1 / admin1)
  const autoFillBtn = document.getElementById('autoFillCredentialsBtn');
  if (autoFillBtn) {
    autoFillBtn.addEventListener('click', () => {
      if (usernameInput) usernameInput.value = 'admin1';
      if (passwordInput) passwordInput.value = 'admin1';
      showToast('Autocompletado', 'Credenciales admin1 / admin1 cargadas.');
    });
  }

  // 3. Toggle Visibilidad Contraseña
  const togglePassBtn = document.getElementById('togglePasswordVisibilityBtn');
  const passEyeIcon = document.getElementById('passwordEyeIcon');
  if (togglePassBtn && passwordInput && passEyeIcon) {
    togglePassBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      passEyeIcon.className = isPassword ? 'ph-bold ph-eye-slash' : 'ph-bold ph-eye';
    });
  }

  // 4. Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('¿Deseas cerrar tu sesión?')) {
        await apiClient.logout();
        showAuthModal();
        showToast('Sesión Cerrada', 'Has salido del sistema de forma segura.');
      }
    });
  }

  // 5. Navegación Desktop Header
  const desktopNavRoutines = document.getElementById('desktopNavRoutines');
  const desktopNavHistory = document.getElementById('desktopNavHistory');
  const desktopNavTimerTrigger = document.getElementById('desktopNavTimerTrigger');

  desktopNavRoutines?.addEventListener('click', () => switchView('routines'));
  desktopNavHistory?.addEventListener('click', () => switchView('history'));
  desktopNavTimerTrigger?.addEventListener('click', () => {
    const timerCard = document.querySelector('.timer-card');
    timerCard?.scrollIntoView({ behavior: 'smooth' });
    timerCard?.classList.add('pulse-glow');
    setTimeout(() => timerCard?.classList.remove('pulse-glow'), 1200);
  });

  // 6. Navegación Switcher Móvil
  const viewRoutinesBtn = document.getElementById('viewRoutinesBtn');
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  viewRoutinesBtn?.addEventListener('click', () => switchView('routines'));
  viewHistoryBtn?.addEventListener('click', () => switchView('history'));

  // 7. Navegación Dock Inferior Móvil
  const mobileNavRoutines = document.getElementById('mobileNavRoutines');
  const mobileNavHistory = document.getElementById('mobileNavHistory');
  const mobileNavTimer = document.getElementById('mobileNavTimer');
  const quickLogBtn = document.getElementById('quickLogBtn');

  mobileNavRoutines?.addEventListener('click', () => {
    switchView('routines');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  mobileNavHistory?.addEventListener('click', () => {
    switchView('history');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  mobileNavTimer?.addEventListener('click', () => {
    document.querySelector('.timer-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  quickLogBtn?.addEventListener('click', async () => {
    let marked = false;
    for (const routine of state.routines) {
      const pending = routine.exercises.find(e => !e.completed);
      if (pending) {
        await state.toggleExercise(routine.id, pending.id);
        renderDashboard();
        showToast('Registro Rápido', `${pending.name} completado.`);
        marked = true;
        break;
      }
    }
    if (!marked) {
      showToast('¡Sesión al 100%!', 'Ya has completado todos los ejercicios de la sesión.', true);
    }
  });

  // 8. Atajos de Teclado en PC
  window.addEventListener('keydown', (e) => {
    // Si el usuario escribe en un campo de texto, no interceptar
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      timer.togglePlay();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      timer.reset();
    } else if (e.code === 'Digit1') {
      selectPreset(30);
    } else if (e.code === 'Digit2') {
      selectPreset(60);
    } else if (e.code === 'Digit3') {
      selectPreset(90);
    } else if (e.code === 'Digit4') {
      selectPreset(120);
    } else if (e.code === 'Escape') {
      document.getElementById('congratsModal')?.classList.remove('active');
    }
  });

  // 9. Audio Toggle
  const audioToggle = document.getElementById('audioToggle');
  if (audioToggle) {
    audioToggle.checked = state.audioEnabled;
    audioToggle.addEventListener('change', (e) => {
      state.audioEnabled = e.target.checked;
      state.saveLocal();
      showToast('Sonido', state.audioEnabled ? 'Sonidos activados' : 'Sonidos silenciados');
    });
  }

  // 10. Modo Oscuro / Claro
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      state.isDarkTheme = !document.body.classList.contains('light-theme');
      state.saveLocal();
    });
  }

  // 11. Filtros musculares
  const catPills = document.querySelectorAll('.cat-pill');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeCategory = pill.dataset.category;
      renderRoutines();
    });
  });

  // 12. Delegación de eventos en rutinas
  const routinesList = document.getElementById('routinesList');
  if (routinesList) {
    routinesList.addEventListener('click', async (e) => {
      const toggleExBtn = e.target.closest('[data-action="toggle-ex"]');
      const accordionHeader = e.target.closest('[data-action="toggle-accordion"]');
      const loadTimerBtn = e.target.closest('[data-action="load-timer"]');

      if (toggleExBtn) {
        e.stopPropagation();
        const routineId = toggleExBtn.dataset.routine;
        const exId = toggleExBtn.dataset.ex;
        const updatedEx = await state.toggleExercise(routineId, exId);

        renderDashboard();

        if (updatedEx && updatedEx.completed) {
          showToast('¡Serie Registrada!', `${updatedEx.name} sincronizado en el servidor.`);
          soundEngine.playTone(784, 0.1, 'sine');

          const stats = state.getOverallProgress();
          if (stats.percentage === 100) {
            triggerGoalCelebration();
          }
        }
        return;
      }

      if (loadTimerBtn) {
        e.stopPropagation();
        const restSecs = parseInt(loadTimerBtn.dataset.rest, 10);
        const exName = loadTimerBtn.dataset.name;

        timer.setMode('countdown');
        document.querySelectorAll('.timer-tab').forEach(t => t.classList.remove('active'));
        const tabCount = document.getElementById('tabCountdown');
        if (tabCount) tabCount.classList.add('active');

        timer.setDuration(restSecs);
        timer.reset();

        const currentExTitle = document.getElementById('timerCurrentExercise');
        const currentExMeta = document.getElementById('timerCurrentMeta');
        if (currentExTitle) currentExTitle.textContent = exName;
        if (currentExMeta) currentExMeta.textContent = `Descanso activo recomendado: ${restSecs}s`;

        timer.start();
        showToast('Descanso Iniciado', `Temporizador fijado en ${restSecs}s para ${exName}`);

        if (window.innerWidth < 1024) {
          document.querySelector('.timer-section')?.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      if (accordionHeader) {
        const routineId = accordionHeader.dataset.routine;
        state.toggleRoutineExpand(routineId);
        renderRoutines();
      }
    });
  }

  // 13. Controles de Temporizador
  const playBtn = document.getElementById('timerPlayPauseBtn');
  const resetBtn = document.getElementById('timerResetBtn');
  const minusBtn = document.getElementById('timerAdjustMinus');
  const plusBtn = document.getElementById('timerAdjustPlus');

  playBtn?.addEventListener('click', () => timer.togglePlay());
  resetBtn?.addEventListener('click', () => timer.reset());
  minusBtn?.addEventListener('click', () => timer.adjustTime(-15));
  plusBtn?.addEventListener('click', () => timer.adjustTime(15));

  // 14. Pestañas Modo Temporizador (Countdown vs Stopwatch)
  const tabCountdown = document.getElementById('tabCountdown');
  const tabStopwatch = document.getElementById('tabStopwatch');
  const presetsContainer = document.getElementById('timerPresets');

  if (tabCountdown && tabStopwatch) {
    tabCountdown.addEventListener('click', () => {
      tabCountdown.classList.add('active');
      tabStopwatch.classList.remove('active');
      if (presetsContainer) presetsContainer.style.display = 'flex';
      document.getElementById('timerBadgeTag').textContent = 'INTERVALO';
      timer.setMode('countdown');
    });

    tabStopwatch.addEventListener('click', () => {
      tabStopwatch.classList.add('active');
      tabCountdown.classList.remove('active');
      if (presetsContainer) presetsContainer.style.display = 'none';
      document.getElementById('timerBadgeTag').textContent = 'CRONÓMETRO LIBRE';
      document.getElementById('timerCurrentExercise').textContent = 'Serie en Curso';
      document.getElementById('timerCurrentMeta').textContent = 'Mide la duración de tu esfuerzo';
      timer.setMode('stopwatch');
    });
  }

  // 15. Presets Rápidos
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const seconds = parseInt(btn.dataset.time, 10);
      selectPreset(seconds);
    });
  });

  // 16. Botón Reiniciar Día
  const resetProgressBtn = document.getElementById('resetProgressBtn');
  resetProgressBtn?.addEventListener('click', async () => {
    if (confirm('¿Deseas reiniciar las marcas de la sesión de hoy?')) {
      await state.resetDailyProgress();
      renderDashboard();
      showToast('Sesión Reiniciada', 'Las series del día están listas para una nueva ronda.');
    }
  });

  // 17. Botón Limpiar Historial
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  clearHistoryBtn?.addEventListener('click', async () => {
    if (confirm('¿Estás seguro de que deseas vaciar el historial cronológico de actividades?')) {
      await state.clearHistoryLog();
      renderHistoryView();
      showToast('Historial Vaciado', 'Se han borrado los registros del servidor.');
    }
  });

  // 18. Modal de Celebración
  const congratsModal = document.getElementById('congratsModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  closeModalBtn?.addEventListener('click', () => {
    congratsModal?.classList.remove('active');
    switchView('history');
  });
});

// Disparador de Meta Cumplida
function triggerGoalCelebration() {
  state.recordSessionFinished();
  confetti.trigger(120);
  soundEngine.playFinishFanfare();

  const modal = document.getElementById('congratsModal');
  const stats = state.getOverallProgress();
  const timeEl = document.getElementById('activeTimeCounter');

  const modalTime = document.getElementById('modalFinalTime');
  const modalCal = document.getElementById('modalFinalCal');
  const modalDone = document.getElementById('modalFinalDone');

  if (modalTime && timeEl) modalTime.textContent = timeEl.textContent;
  if (modalCal) modalCal.textContent = `${stats.estKcal} kcal`;
  if (modalDone) modalDone.textContent = `${stats.percentage}%`;

  if (modal) {
    modal.classList.add('active');
  }
}
