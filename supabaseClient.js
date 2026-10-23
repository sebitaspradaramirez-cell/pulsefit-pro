/**
 * ============================================================================
 * PULSEFIT PRO - CLIENTE OFICIAL DE SUPABASE
 * Conexión en tiempo real a PostgreSQL & Supabase Auth
 * ============================================================================
 */

// ============================================================================
// 1. CONFIGURACIÓN DE TU PROYECTO SUPABASE
// Reemplaza estas dos constantes con los datos de tu Dashboard de Supabase:
// (Settings -> API -> Project URL & Project API Keys 'anon' 'public')
// ============================================================================
const SUPABASE_CONFIG = {
  url: 'https://TU-PROYECTO.supabase.co', // <-- Reemplaza por tu URL de Supabase
  anonKey: 'TU-SUPABASE-ANON-KEY'          // <-- Reemplaza por tu anon public key
};

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.init();
  }

  init() {
    // Verificar si las credenciales fueron configuradas por el usuario
    const hasValidUrl = SUPABASE_CONFIG.url && !SUPABASE_CONFIG.url.includes('TU-PROYECTO');
    const hasValidKey = SUPABASE_CONFIG.anonKey && !SUPABASE_CONFIG.anonKey.includes('TU-SUPABASE-ANON-KEY');

    if (hasValidUrl && hasValidKey && typeof window !== 'undefined' && window.supabase) {
      try {
        this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.isConfigured = true;
        console.log('✅ Supabase conectado con éxito a:', SUPABASE_CONFIG.url);
      } catch (err) {
        console.warn('⚠️ Error al inicializar Supabase Client:', err);
      }
    } else {
      console.log('ℹ️ Supabase listo para configurar. (Modo Local / Servidor activo mientras se añaden las claves)');
    }
  }

  // Comprobar si Supabase está activo
  isActive() {
    return this.isConfigured && this.client !== null;
  }

  // 1. AUTENTICACIÓN
  async login(username, password) {
    if (!this.isActive()) return null;

    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        return { success: false, message: 'Usuario o contraseña incorrectos en Supabase.' };
      }

      return {
        success: true,
        user: {
          id: data.id,
          username: data.username,
          name: data.full_name,
          role: data.role,
          streak: data.streak,
          completedSessions: data.completed_sessions
        }
      };
    } catch (err) {
      console.error('Error en Supabase login:', err);
      return { success: false, message: 'Fallo de conexión con Supabase.' };
    }
  }

  // 2. OBTENER RUTINAS Y EJERCICIOS
  async getRoutines() {
    if (!this.isActive()) return null;

    try {
      const { data: routinesData, error: errRoutines } = await this.client
        .from('routines')
        .select('*')
        .order('order_index', { ascending: true });

      if (errRoutines || !routinesData) return null;

      const { data: exercisesData, error: errExercises } = await this.client
        .from('exercises')
        .select('*')
        .order('order_index', { ascending: true });

      if (errExercises || !exercisesData) return null;

      // Anidar ejercicios dentro de sus rutinas correspondientes
      const routines = routinesData.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        categoryLabel: r.category_label,
        difficulty: r.difficulty,
        duration: r.duration,
        estCalories: r.est_calories,
        description: r.description,
        isExpanded: r.is_expanded,
        exercises: exercisesData
          .filter(e => e.routine_id === r.id)
          .map(e => ({
            id: e.id,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest_seconds,
            completed: e.completed
          }))
      }));

      return routines;
    } catch (err) {
      console.error('Error obteniendo rutinas de Supabase:', err);
      return null;
    }
  }

  // 3. MARCAR O DESMARCAR EJERCICIO
  async toggleExercise(exerciseId, isCompleted) {
    if (!this.isActive()) return false;

    try {
      const { error } = await this.client
        .from('exercises')
        .update({ completed: isCompleted })
        .eq('id', exerciseId);

      return !error;
    } catch (err) {
      console.error('Error al actualizar ejercicio en Supabase:', err);
      return false;
    }
  }

  // 4. REGISTRAR EN HISTORIAL
  async logActivity(entry) {
    if (!this.isActive()) return false;

    try {
      const { error } = await this.client
        .from('activity_logs')
        .insert([{
          id: entry.id,
          username: 'admin1',
          exercise_name: entry.exerciseName,
          routine_title: entry.routineTitle,
          sets: entry.sets || 3,
          calories: entry.calories || 30,
          time_string: entry.timeString
        }]);

      return !error;
    } catch (err) {
      console.error('Error guardando log en Supabase:', err);
      return false;
    }
  }

  // 5. OBTENER HISTORIAL
  async getHistory() {
    if (!this.isActive()) return null;

    try {
      const { data, error } = await this.client
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map(item => ({
        id: item.id,
        exerciseName: item.exercise_name,
        routineTitle: item.routine_title,
        timeString: item.time_string,
        calories: item.calories,
        sets: item.sets
      }));
    } catch (err) {
      console.error('Error obteniendo historial de Supabase:', err);
      return null;
    }
  }

  // 6. LIMPIAR HISTORIAL
  async clearHistory() {
    if (!this.isActive()) return false;

    try {
      const { error } = await this.client
        .from('activity_logs')
        .delete()
        .neq('id', '');

      return !error;
    } catch (err) {
      console.error('Error limpiando historial en Supabase:', err);
      return false;
    }
  }

  // 7. REINICIAR DÍA
  async resetDaily() {
    if (!this.isActive()) return false;

    try {
      const { error } = await this.client
        .from('exercises')
        .update({ completed: false })
        .neq('id', '');

      return !error;
    } catch (err) {
      console.error('Error reiniciando ejercicios en Supabase:', err);
      return false;
    }
  }
}

// Exportar instancia global
window.pulsefitSupabase = new SupabaseService();
