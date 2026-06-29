import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twsmiqxywmsskxbejykb.supabase.co';
const supabaseKey = 'sb_publishable__lGVX5hXcpEXMwMU34LtKA_n-I2jIls';

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseKey;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'fptrainingpro-auth-v2',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  nombre: string;
  apellido: string;
  edad: number | null;
  estatura: number | null;
  sexo: string;
  foto_url: string;
  rol: 'alumno' | 'entrenador' | 'entrenador_administrador' | 'administrador';
  entrenador_id: string | null;
  created_at: string;
  xp_points: number;
  level: number;
  last_workout_date: string | null;
  xp_tour_completed: boolean;
};

export type Evaluacion = {
  id: string;
  alumno_id: string;
  fecha: string;
  peso: number | null;
  hombros: number | null;
  pecho: number | null;
  intercostal: number | null;
  cintura: number | null;
  cadera_alta: number | null;
  gluteos: number | null;
  muslo_derecho: number | null;
  muslo_izquierdo: number | null;
  pantorrilla_derecha: number | null;
  pantorrilla_izquierda: number | null;
  biceps_derecho_relajado: number | null;
  biceps_derecho_contraido: number | null;
  biceps_izquierdo: number | null;
  pliegue_triceps: number | null;
  pliegue_biceps: number | null;
  pliegue_subescapular: number | null;
  pliegue_cresta_iliaca: number | null;
  pliegue_supraespinal: number | null;
  pliegue_abdominal: number | null;
  pliegue_muslo: number | null;
  pliegue_pantorrilla: number | null;
  porcentaje_grasa: number | null;
  grasa_corporal: number | null;
  foto_url: string | null;
  notas: string;
  cargado_por: string | null;
  created_at: string;
};

export type Dieta = {
  id: string;
  alumno_id: string;
  nombre: string | null;
  descripcion: string | null;
  archivo_url: string | null;
  fecha_fin: string | null;
  created_at: string;
};

export type Rutina = {
  id: string;
  alumno_id: string;
  nombre: string;
  descripcion: string;
  created_at: string;
};

export type Ejercicio = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  descripcion: string;
  como_ejecutar: string | null;
  tipo_ejercicio: string | null;
  musculos_secundarios: string | null;
  consejos: string | null;
  imagen_url: string | null;
  youtube_url: string | null;
  created_at: string;
};

export type PlantillaRutina = {
  id: string;
  nombre: string;
  descripcion: string | null;
  creado_por: string | null;
  created_at: string;
};

export type PlantillaDia = {
  id: string;
  plantilla_id: string;
  numero_dia: number;
  nombre_dia: string;
  created_at: string;
};

export type TipoSerie = 'serie' | 'superserie' | 'dropset' | 'triserie' | 'circuito';

export type PlantillaEjercicio = {
  id: string;
  dia_id: string;
  ejercicio_id: string;
  orden: number;
  series: number | null;
  repeticiones: string | null;
  descanso_segundos: number | null;
  tipo: TipoSerie;
  grupo_serie: string | null;
  notas: string | null;
  ejercicio_alternativo_id: string | null;
  created_at: string;
  ejercicio?: Ejercicio;
  ejercicio_alternativo?: Ejercicio | null;
};

export type RegistroEjercicio = {
  id: string;
  plantilla_ejercicio_id: string;
  alumno_id: string;
  fecha: string;
  peso_kg: number | null;
  descanso_segundos: number | null;
  created_at: string;
};

export type RutinaAlumno = {
  id: string;
  alumno_id: string;
  plantilla_id: string | null;
  nombre: string;
  descripcion: string | null;
  asignado_por: string | null;
  created_at: string;
};

export type RutinaAlumnoDia = {
  id: string;
  rutina_id: string;
  numero_dia: number;
  nombre_dia: string;
  created_at: string;
};

export type RutinaAlumnoEjercicio = {
  id: string;
  dia_id: string;
  ejercicio_id: string;
  orden: number;
  series: number | null;
  repeticiones: string | null;
  descanso_segundos: number | null;
  tipo: TipoSerie;
  grupo_serie: string | null;
  notas: string | null;
  ejercicio_alternativo: string | null;
  created_at: string;
  ejercicio?: Ejercicio;
};
