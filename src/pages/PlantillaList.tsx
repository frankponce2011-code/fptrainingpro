import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Dumbbell, Trash2, Calendar, Shield, User, Copy, Pencil, X } from 'lucide-react';
import { supabase, PlantillaRutina, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  onBack: () => void;
  onCreate: () => void;
  onEdit: (plantilla: PlantillaRutina) => void;
};

type PlantillaWithMeta = PlantillaRutina & {
  dias_count: number;
  ejercicios_count: number;
  creador?: Pick<Profile, 'id' | 'nombre' | 'apellido' | 'rol'> | null;
};

export default function PlantillaList({ onBack, onCreate, onEdit }: Props) {
  const { profile } = useAuth();
  const [plantillas, setPlantillas] = useState<PlantillaWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PlantillaRutina | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Estados para controlar el modal flotante de edición profesional
  const [editTarget, setEditTarget] = useState<PlantillaRutina | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [updating, setUpdating] = useState(false);

  const isAdmin = profile?.rol === 'entrenador_administrador';

  async function load() {
    setLoading(true);
    let query = supabase
      .from('plantillas_rutina')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin && profile?.id) {
      query = query.eq('creado_por', profile.id);
    }

    const { data: plantillasData } = await query;
    if (!plantillasData) { setPlantillas([]); setLoading(false); return; }

    const creadorIds = [...new Set(plantillasData.map(p => p.creado_por).filter(Boolean))] as string[];
    let creadoresMap: Record<string, Pick<Profile, 'id' | 'nombre' | 'apellido' | 'rol'>> = {};
    if (creadorIds.length > 0) {
      const { data: creadores } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, rol')
        .in('id', creadorIds);
      if (creadores) {
        creadores.forEach(c => { creadoresMap[c.id] = c as Pick<Profile, 'id' | 'nombre' | 'apellido' | 'rol'>; });
      }
    }

    const { data: diasData } = await supabase
      .from('plantilla_dias')
      .select('plantilla_id')
      .in('plantilla_id', plantillasData.map(p => p.id));

    const diasCountMap: Record<string, number> = {};
    diasData?.forEach(d => {
      diasCountMap[d.plantilla_id] = (diasCountMap[d.plantilla_id] || 0) + 1;
    });

    const { data: allDias } = await supabase
      .from('plantilla_dias')
      .select('id, plantilla_id')
      .in('plantilla_id', plantillasData.map(p => p.id));

    const diaIdToPlantilla: Record<string, string> = {};
    allDias?.forEach(d => { diaIdToPlantilla[d.id] = d.plantilla_id; });
    const allDiaIds = allDias?.map(d => d.id) || [];

    let ejCountMap: Record<string, number> = {};
    if (allDiaIds.length > 0) {
      const { data: ejData } = await supabase
        .from('plantilla_ejercicios')
        .select('dia_id')
        .in('dia_id', allDiaIds);
      if (ejData) {
        ejData.forEach(e => {
          const plantillaId = diaIdToPlantilla[e.dia_id];
          if (plantillaId) ejCountMap[plantillaId] = (ejCountMap[plantillaId] || 0) + 1;
        });
      }
    }

    const result: PlantillaWithMeta[] = plantillasData.map(p => ({
      ...p,
      dias_count: diasCountMap[p.id] || 0,
      ejercicios_count: ejCountMap[p.id] || 0,
      creador: p.creado_por ? creadoresMap[p.creado_por] || null : null,
    }));

    setPlantillas(result);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(p: PlantillaRutina) {
    setDeleting(true);
    await supabase.from('plantillas_rutina').delete().eq('id', p.id);
    setDeleteTarget(null);
    setDeleting(false);
    load();
  }

  // Abre la ventana flotante rellenando los campos con datos actuales
  function openEditModal(p: PlantillaRutina) {
    setEditTarget(p);
    setEditNombre(p.nombre);
    setEditDescripcion(p.descripcion || '');
  }

  // Guarda los cambios asegurando el envío directo a la base de datos de Supabase
  async function handleUpdateTemplateDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;

    const nombreLimpio = editNombre.trim();
    const descripcionLimpia = editDescripcion.trim() || null;

    if (!nombreLimpio) {
      alert("El nombre no puede estar vacío");
      return;
    }

    setUpdating(true);
    try {
      // 1. Forzar la actualización en la tabla principal de plantillas
      const { error: templateError } = await supabase
        .from('plantillas_rutina')
        .update({
          nombre: nombreLimpio,
          descripcion: descripcionLimpia
        })
        .eq('id', editTarget.id);

      if (templateError) throw templateError;

      // 2. Sincronizar en cascada con las rutinas clonadas/activas de alumnos vinculados
      await supabase
        .from('rutinas')
        .update({ 
          nombre: nombreLimpio 
        })
        .eq('plantilla_id', editTarget.id);

      // Cierra el modal y recarga los datos desde la BD
      setEditTarget(null);
      await load(); 
      
    } catch (err) {
      console.error("Error en Supabase:", err);
      alert("No se pudo guardar el nombre en la base de datos.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDuplicate(p: PlantillaRutina) {
    if (duplicatingId) return;
    setDuplicatingId(p.id);

    const { data: newPlantilla, error } = await supabase
      .from('plantillas_rutina')
      .insert({
        nombre: `${p.nombre} (Copia)`,
        descripcion: p.descripcion,
        creado_por: profile?.id,
      })
      .select()
      .single();

    if (error || !newPlantilla) { setDuplicatingId(null); return; }

    const { data: sourceDias } = await supabase
      .from('plantilla_dias')
      .select('*, plantilla_ejercicios(*)')
      .eq('plantilla_id', p.id)
      .order('numero_dia', { ascending: true });

    if (sourceDias) {
      for (const dia of sourceDias) {
        const { data: newDia } = await supabase
          .from('plantilla_dias')
          .insert({ plantilla_id: newPlantilla.id, numero_dia: dia.numero_dia, nombre_dia: dia.nombre_dia })
          .select()
          .single();

        if (newDia && dia.plantilla_ejercicios?.length > 0) {
          await supabase.from('plantilla_ejercicios').insert(
            dia.plantilla_ejercicios.map((ej: any) => ({
              dia_id: newDia.id,
              ejercicio_id: ej.ejercicio_id,
              orden: ej.orden,
              series: ej.series,
              repeticiones: ej.repeticiones,
              descanso_segundos: ej.descanso_segundos,
              tipo: ej.tipo,
              grupo_serie: ej.grupo_serie,
              notas: ej.notas,
              ejercicio_alternativo_id: ej.ejercicio_alternativo_id,
            }))
          );
        }
      }
    }

    setDuplicatingId(null);
    load();
  }

  if (deleteTarget) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center max-w-lg mx-auto px-6">
        <Trash2 size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Eliminar plantilla</h2>
        <p className="text-sm text-gray-400 text-center mb-1">{deleteTarget.nombre}</p>
        <p className="text-xs text-red-400 mb-6">Se eliminaran todos los dias y ejercicios. Esta accion no se puede deshacer.</p>
        <div className="flex gap-3 w-full">
          <button onClick={() => setDeleteTarget(null)}
            className="flex-1 py-3 bg-gray-800 rounded-xl text-gray-300 text-sm font-semibold">Cancelar</button>
          <button onClick={() => handleDelete(deleteTarget)} disabled={deleting}
            className="flex-1 py-3 bg-red-600 rounded-xl text-white text-sm font-semibold disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto relative">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Rutinas</p>
              <h2 className="text-sm font-bold text-white">Plantillas</h2>
            </div>
          </div>
          <button onClick={onCreate}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
            <Plus size={14} /> Nueva
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12"><span className="w-8 h-8 spinner mx-auto" /></div>
        ) : plantillas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Dumbbell size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold mb-1">Sin plantillas</p>
            <p className="text-xs text-gray-500 mb-5">Crea tu primera plantilla de rutina</p>
            <button onClick={onCreate}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              Crear plantilla
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plantillas.map(p => {
              const isOwner = p.creado_por === profile?.id;
              const creadorRol = p.creador?.rol;
              const isDuplicating = duplicatingId === p.id;
              return (
                <div
                  key={p.id}
                  className="w-full bg-gray-800 rounded-2xl border border-transparent hover:border-yellow-400/20 transition-colors overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4">
                    <button
                      onClick={() => onEdit(p)}
                      className="flex items-start gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Dumbbell size={20} className="text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-bold text-white">{p.nombre}</p>
                          {creadorRol === 'entrenador_administrador' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-0.5 shrink-0">
                              <Shield size={8} /> Admin
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-0.5 shrink-0">
                              <User size={8} /> Entrenador
                            </span>
                          )}
                        </div>
                        {p.descripcion && (
                          <p className="text-xs text-gray-400 truncate mb-1">{p.descripcion}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/60 inline-block" />
                            {p.dias_count} {p.dias_count === 1 ? 'dia' : 'dias'}
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 inline-block" />
                            {p.ejercicios_count} ejercicios
                          </span>
                          {p.creador && (
                            <span className="text-[10px] text-gray-500">
                              {p.creador.nombre} {p.creador.apellido}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-600 flex items-center gap-1">
                            <Calendar size={9} />
                            {new Date(p.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botón de Editar con Lápiz */}
                      {(isAdmin || isOwner) && (
                        <button
                          onClick={e => { e.stopPropagation(); openEditModal(p); }}
                          className="p-2 text-gray-500 hover:text-yellow-400 hover:bg-gray-700/50 rounded-lg transition-colors"
                          title="Editar nombre y descripción"
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      <button
                        onClick={e => { e.stopPropagation(); handleDuplicate(p); }}
                        disabled={!!duplicatingId}
                        className="p-2 rounded-lg transition-all disabled:opacity-40"
                        style={{
                          background: isDuplicating ? 'rgba(250,204,21,0.15)' : 'transparent',
                          color: isDuplicating ? '#facc15' : '#6b7280',
                        }}
                        title="Duplicar plantilla"
                      >
                        {isDuplicating ? (
                          <span className="w-[15px] h-[15px] border-2 border-yellow-400 border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <Copy size={15} className="hover:text-yellow-400 transition-colors" />
                        )}
                      </button>

                      {(isAdmin || isOwner) && (
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget(p); }}
                          className="p-2 text-gray-600 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* VENTANA FLOTANTE (MODAL) PREMIUM ESTILO OSCURO/AMARILLO */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil size={16} className="text-yellow-400" /> Editar Plantilla
              </h3>
              <button 
                onClick={() => setEditTarget(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTemplateDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre de la plantilla</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="Ej. Rutina de Volumen"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descripción (Opcional)</label>
                <textarea
                  value={editDescripcion}
                  onChange={e => setEditDescripcion(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition-colors resize-none"
                  placeholder="Agrega detalles o notas sobre este entrenamiento..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}