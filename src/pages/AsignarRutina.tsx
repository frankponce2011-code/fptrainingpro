import { useState, useEffect } from 'react';
import {
  ArrowLeft, Search, Dumbbell, CheckCircle2, ChevronRight, User, Calendar,
  Trash2, Eye, Edit3, Plus,
} from 'lucide-react';
import { supabase, Profile, PlantillaRutina, RutinaAlumno } from '../lib/supabase';

type RutinaConFechaFin = RutinaAlumno & { fecha_fin: string | null; activa: boolean };
import { useAuth } from '../contexts/AuthContext';
import PlantillaBuilder from './PlantillaBuilder';

type Props = {
  onBack: () => void;
};

type Step = 'list' | 'alumno-detail' | 'select-plantilla' | 'confirming';

type AlumnoWithRutina = Profile & {
  rutina: RutinaConFechaFin | null;
};

export default function AsignarRutina({ onBack }: Props) {
  const { profile } = useAuth();
  const isAdmin = profile?.rol === 'entrenador_administrador';

  const [step, setStep] = useState<Step>('list');
  const [alumnos, setAlumnos] = useState<AlumnoWithRutina[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaRutina[]>([]);
  const [selectedAlumno, setSelectedAlumno] = useState<AlumnoWithRutina | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaRutina | null>(null);
  const [loadingAlumnos, setLoadingAlumnos] = useState(true);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [viewKanban, setViewKanban] = useState<PlantillaRutina | null>(null);
  const [success, setSuccess] = useState(false);
  const [editFechaFin, setEditFechaFin] = useState('');
  const [savingFechaFin, setSavingFechaFin] = useState(false);
  const [fechaFinSuccess, setFechaFinSuccess] = useState(false);

  useEffect(() => {
    loadAlumnos();
  }, []);

  useEffect(() => {
    if (selectedAlumno?.rutina) {
      setEditFechaFin(selectedAlumno.rutina.fecha_fin || '');
    }
  }, [selectedAlumno?.rutina?.id]);

  async function loadAlumnos() {
    setLoadingAlumnos(true);
    let query = supabase.from('perfiles').select('*').eq('rol', 'alumno').order('created_at', { ascending: false });
    if (!isAdmin && profile?.id) {
      query = query.eq('entrenador_id', profile.id);
    }
    const { data: alumnosData } = await query;
    if (!alumnosData) { setAlumnos([]); setLoadingAlumnos(false); return; }

    // Load each alumno's active rutina
    const { data: rutinasData } = await supabase
      .from('rutinas_alumno')
      .select('*')
      .in('alumno_id', alumnosData.map(a => a.id))
      .eq('activa', true)
      .order('created_at', { ascending: false });

    const rutinaByAlumno: Record<string, RutinaConFechaFin> = {};
    rutinasData?.forEach(r => {
      if (!rutinaByAlumno[r.alumno_id]) rutinaByAlumno[r.alumno_id] = r as RutinaConFechaFin;
    });

    setAlumnos(alumnosData.map(a => ({ ...a, rutina: rutinaByAlumno[a.id] || null })));
    setLoadingAlumnos(false);
  }

  async function selectAlumno(alumno: AlumnoWithRutina) {
    setSelectedAlumno(alumno);
    setLoadingPlantillas(true);
    setStep('alumno-detail');
    const { data } = await supabase
      .from('plantillas_rutina')
      .select('*')
      .order('created_at', { ascending: false });
    setPlantillas(data || []);
    setLoadingPlantillas(false);
  }

  async function handleAssign() {
    if (!selectedAlumno || !selectedPlantilla || !profile) return;
    setSaving(true);

    // Hard-delete any existing rutina for this alumno (cascade removes dias + ejercicios)
    if (selectedAlumno.rutina) {
      await supabase.from('rutinas_alumno').delete().eq('id', selectedAlumno.rutina.id);
    }

    // Insert new rutinas_alumno record
    const { data: rutinaData, error: rutinaError } = await supabase
      .from('rutinas_alumno')
      .insert({
        alumno_id: selectedAlumno.id,
        plantilla_id: selectedPlantilla.id,
        nombre: selectedPlantilla.nombre,
        descripcion: selectedPlantilla.descripcion,
        asignado_por: profile.id,
        activa: true,
      })
      .select()
      .single();

    if (rutinaError || !rutinaData) { setSaving(false); return; }

    // Copy dias + exercises
    const { data: diasData } = await supabase
      .from('plantilla_dias')
      .select('*, plantilla_ejercicios(*)')
      .eq('plantilla_id', selectedPlantilla.id)
      .order('numero_dia', { ascending: true });

    if (diasData) {
      for (const dia of diasData) {
        const { data: newDia } = await supabase
          .from('rutina_alumno_dias')
          .insert({ rutina_id: rutinaData.id, numero_dia: dia.numero_dia, nombre_dia: dia.nombre_dia })
          .select()
          .single();
        if (newDia && dia.plantilla_ejercicios?.length > 0) {
          await supabase.from('rutina_alumno_ejercicios').insert(
            dia.plantilla_ejercicios.map((ej: {
              ejercicio_id: string; orden: number; series: number | null;
              repeticiones: string | null; descanso_segundos: number | null;
              tipo: string; grupo_serie: string | null; notas: string | null;
              ejercicio_alternativo_id: string | null;
            }) => ({
              dia_id: newDia.id,
              ejercicio_id: ej.ejercicio_id,
              orden: ej.orden,
              series: ej.series,
              repeticiones: ej.repeticiones,
              descanso_segundos: ej.descanso_segundos,
              tipo: ej.tipo,
              grupo_serie: ej.grupo_serie,
              notas: ej.notas,
              ejercicio_alternativo: ej.ejercicio_alternativo_id,
            }))
          );
        }
      }
    }

    setSaving(false);
    setSuccess(true);

    // Notify alumno
    await supabase.from('notifications').insert({
      user_id: selectedAlumno.id,
      title: 'Nueva rutina asignada',
      message: 'Tu entrenador ha actualizado tu rutina de entrenamiento.',
      read: false,
    });

    setSelectedAlumno(prev => prev ? { ...prev, rutina: rutinaData } : prev);
    setStep('alumno-detail');
    setSelectedPlantilla(null);
    loadAlumnos();
  }

  async function handleDeleteRutina() {
    if (!selectedAlumno?.rutina) return;
    setDeleting(true);
    await supabase.from('rutinas_alumno').delete().eq('id', selectedAlumno.rutina.id);
    setDeleting(false);
    setDeleteConfirm(false);
    setSelectedAlumno(prev => prev ? { ...prev, rutina: null } : prev);
    loadAlumnos();
  }

  async function handleSaveFechaFin() {
    if (!selectedAlumno?.rutina) return;
    setSavingFechaFin(true);
    await supabase.from('rutinas_alumno')
      .update({ fecha_fin: editFechaFin || null })
      .eq('id', selectedAlumno.rutina.id);
    setSavingFechaFin(false);
    setFechaFinSuccess(true);
    setSelectedAlumno(prev => prev ? {
      ...prev,
      rutina: prev.rutina ? { ...prev.rutina, fecha_fin: editFechaFin || null } : null,
    } : prev);
    loadAlumnos();
    setTimeout(() => setFechaFinSuccess(false), 2000);
  }

  const filteredAlumnos = alumnos.filter(a =>
    `${a.nombre} ${a.apellido}`.toLowerCase().includes(search.toLowerCase())
  );

  // Kanban view for alumno's current rutina (reuse PlantillaBuilder read-only)
  if (viewKanban) {
    return (
      <PlantillaBuilder
        plantilla={viewKanban}
        onBack={() => setViewKanban(null)}
        onSaved={() => {}}
      />
    );
  }

  // Delete confirmation overlay
  if (deleteConfirm && selectedAlumno) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center max-w-lg mx-auto px-6">
        <Trash2 size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Eliminar rutina</h2>
        <p className="text-sm text-gray-400 text-center mb-1">
          ¿Eliminar rutina de <span className="text-white font-semibold">{selectedAlumno.nombre} {selectedAlumno.apellido}</span>?
        </p>
        <p className="text-xs text-red-400 text-center mb-6">Se eliminara permanentemente de la base de datos.</p>
        <div className="flex gap-3 w-full">
          <button onClick={() => setDeleteConfirm(false)}
            className="flex-1 py-3 bg-gray-800 rounded-xl text-gray-300 text-sm font-semibold">Cancelar</button>
          <button onClick={handleDeleteRutina} disabled={deleting}
            className="flex-1 py-3 bg-red-600 rounded-xl text-white text-sm font-semibold disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={step === 'list' ? onBack : step === 'select-plantilla' ? () => setStep('alumno-detail') : () => { setStep('list'); setSelectedAlumno(null); setSelectedPlantilla(null); setSuccess(false); }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Rutinas</p>
            <h2 className="text-sm font-bold text-white">
              {step === 'list' ? 'Asignar Rutina' : step === 'select-plantilla' ? 'Seleccionar Plantilla' : `${selectedAlumno?.nombre} ${selectedAlumno?.apellido}`}
            </h2>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto pb-8">

        {/* Step: alumno list */}
        {step === 'list' && (
          <div>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar alumno..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
              />
            </div>
            {loadingAlumnos ? (
              <div className="text-center py-12"><span className="w-8 h-8 spinner mx-auto" /></div>
            ) : filteredAlumnos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <User size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">Sin alumnos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAlumnos.map(a => (
                  <button
                    key={a.id}
                    onClick={() => selectAlumno(a)}
                    className="w-full bg-gray-800 hover:bg-gray-750 rounded-2xl p-3 flex items-center gap-3 transition-colors text-left border border-transparent hover:border-yellow-400/20"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0">
                      {a.foto_url
                        ? <img src={a.foto_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[10px] font-bold text-yellow-400">{a.nombre?.[0]}{a.apellido?.[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{a.nombre} {a.apellido}</p>
                      {a.rutina ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 mt-0.5">
                          <CheckCircle2 size={9} /> {a.rutina.nombre}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-500 mt-0.5">
                          Sin rutina
                        </span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: alumno detail */}
        {step === 'alumno-detail' && selectedAlumno && (
          <div>
            {/* Alumno header */}
            <div className="flex items-center gap-4 mb-5 bg-gray-800 rounded-2xl p-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-400/10 border-2 border-yellow-400/40 flex items-center justify-center shrink-0">
                {selectedAlumno.foto_url
                  ? <img src={selectedAlumno.foto_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-lg font-bold text-yellow-400">{selectedAlumno.nombre?.[0]}{selectedAlumno.apellido?.[0]}</span>}
              </div>
              <div>
                <p className="text-base font-bold text-white">{selectedAlumno.nombre} {selectedAlumno.apellido}</p>
                <p className="text-xs text-gray-400">{selectedAlumno.edad ? `${selectedAlumno.edad} anos` : ''}</p>
              </div>
            </div>

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-xl p-3 mb-4 flex items-center gap-2">
                <CheckCircle2 size={14} /> Rutina asignada correctamente
              </div>
            )}

            {/* Current rutina */}
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Rutina activa</p>
            {selectedAlumno.rutina ? (
              <div className="bg-gray-800 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0">
                    <Dumbbell size={18} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{selectedAlumno.rutina.nombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar size={10} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500">
                        {new Date(selectedAlumno.rutina.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAlumno.rutina.plantilla_id && (
                    <button
                      onClick={() => {
                        const p = plantillas.find(pl => pl.id === selectedAlumno.rutina?.plantilla_id);
                        if (p) setViewKanban(p);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-semibold text-gray-300 transition-colors"
                    >
                      <Eye size={13} /> Ver Kanban
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-semibold text-red-400 transition-colors"
                  >
                    <Trash2 size={13} /> Eliminar rutina
                  </button>
                </div>

                {/* Fecha de vencimiento editable */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Calendar size={10} /> Valida hasta (opcional)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editFechaFin}
                      onChange={e => setEditFechaFin(e.target.value)}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-yellow-400"
                    />
                    <button
                      onClick={handleSaveFechaFin}
                      disabled={savingFechaFin}
                      className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      {savingFechaFin ? '...' : 'Guardar'}
                    </button>
                  </div>
                  {fechaFinSuccess && (
                    <p className="text-[10px] text-green-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Fecha actualizada correctamente
                    </p>
                  )}
                  {editFechaFin && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      La rutina del alumno se vera bloqueada despues de esta fecha.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl p-4 text-center mb-4">
                <p className="text-sm text-gray-500">Tu entrenador aun no te ha asignado una rutina</p>
              </div>
            )}

            {/* Assign rutina button */}
            <button
              onClick={() => setStep('select-plantilla')}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-2xl transition-colors"
            >
              <Plus size={18} />
              {selectedAlumno.rutina ? 'Cambiar rutina' : 'Asignar rutina'}
            </button>
          </div>
        )}

        {/* Step: select plantilla */}
        {step === 'select-plantilla' && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Seleccionar plantilla</p>
            {loadingPlantillas ? (
              <div className="text-center py-8"><span className="w-8 h-8 spinner mx-auto" /></div>
            ) : plantillas.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Dumbbell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin plantillas creadas</p>
              </div>
            ) : (
              <div className="space-y-2 pb-28">
                {plantillas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlantilla(p)}
                    className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-colors text-left ${
                      selectedPlantilla?.id === p.id
                        ? 'bg-yellow-400/10 border border-yellow-400/40'
                        : 'bg-gray-800 hover:bg-gray-750 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedPlantilla?.id === p.id ? 'bg-yellow-400/20' : 'bg-gray-700'}`}>
                      <Dumbbell size={18} className={selectedPlantilla?.id === p.id ? 'text-yellow-400' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${selectedPlantilla?.id === p.id ? 'text-yellow-400' : 'text-white'}`}>{p.nombre}</p>
                      {p.descripcion && <p className="text-xs text-gray-400 truncate mt-0.5">{p.descripcion}</p>}
                    </div>
                    {selectedPlantilla?.id === p.id && (
                      <CheckCircle2 size={18} className="text-yellow-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirm assign button */}
      {step === 'select-plantilla' && selectedPlantilla && (
        <div className="sticky bottom-0 px-4 py-4 bg-gradient-to-t from-gray-950 to-transparent">
          <button
            onClick={handleAssign}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-base bg-yellow-400 hover:bg-yellow-500 text-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
          >
            {saving ? (
              <span className="w-5 h-5 spinner" style={{ borderTopColor: '#111827' }} />
            ) : (
              <>
                <CheckCircle2 size={20} />
                Asignar rutina
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
