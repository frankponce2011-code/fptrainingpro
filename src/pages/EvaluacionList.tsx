import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, Weight, ChevronRight } from 'lucide-react';
import { supabase, Profile, Evaluacion } from '../lib/supabase';
import EvaluacionForm from './EvaluacionForm';

type Props = {
  alumno: Profile;
  onBack: () => void;
  readOnly?: boolean;
};

const allFields = [
  { section: 'Medidas Corporales', fields: [
    { key: 'peso', label: 'Peso', unit: 'kg' },
    { key: 'hombros', label: 'Hombros', unit: 'cm' },
    { key: 'pecho', label: 'Pecho', unit: 'cm' },
    { key: 'intercostal', label: 'Intercostal', unit: 'cm' },
    { key: 'cintura', label: 'Cintura', unit: 'cm' },
    { key: 'cadera_alta', label: 'Cadera Alta', unit: 'cm' },
    { key: 'gluteos', label: 'Gluteos', unit: 'cm' },
  ]},
  { section: 'Extremidades', fields: [
    { key: 'muslo_derecho', label: 'Muslo Derecho', unit: 'cm' },
    { key: 'muslo_izquierdo', label: 'Muslo Izquierdo', unit: 'cm' },
    { key: 'pantorrilla_derecha', label: 'Pantorrilla Derecha', unit: 'cm' },
    { key: 'pantorrilla_izquierda', label: 'Pantorrilla Izquierda', unit: 'cm' },
    { key: 'biceps_derecho_relajado', label: 'Biceps Der. Relajado', unit: 'cm' },
    { key: 'biceps_derecho_contraido', label: 'Biceps Der. Contraido', unit: 'cm' },
    { key: 'biceps_izquierdo', label: 'Biceps Izquierdo', unit: 'cm' },
  ]},
  { section: 'Pliegues Cutaneos', fields: [
    { key: 'pliegue_triceps', label: 'Triceps', unit: 'mm' },
    { key: 'pliegue_subescapular', label: 'Subescapular', unit: 'mm' },
    { key: 'pliegue_cresta_iliaca', label: 'Cresta Iliaca', unit: 'mm' },
    { key: 'pliegue_supraespinal', label: 'Supraespinal', unit: 'mm' },
    { key: 'pliegue_abdominal', label: 'Abdominal', unit: 'mm' },
    { key: 'pliegue_muslo', label: 'Muslo', unit: 'mm' },
    { key: 'pliegue_pantorrilla', label: 'Pantorrilla', unit: 'mm' },
  ]},
  { section: 'Composicion Corporal', fields: [
    { key: 'porcentaje_grasa', label: '% Grasa Corporal', unit: '%' },
  ]},
];

export default function EvaluacionList({ alumno, onBack, readOnly = false }: Props) {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEval, setEditEval] = useState<Evaluacion | null>(null);
  const [detailEval, setDetailEval] = useState<Evaluacion | null>(null);

  async function loadEvaluaciones() {
    setLoading(true);
    const { data } = await supabase
      .from('evaluaciones')
      .select('*')
      .eq('alumno_id', alumno.id)
      .order('fecha', { ascending: false });
    setEvaluaciones(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEvaluaciones();
  }, [alumno.id]);

  if (showForm || editEval) {
    return (
      <EvaluacionForm
        alumno={alumno}
        evaluacion={editEval}
        onBack={() => { setShowForm(false); setEditEval(null); loadEvaluaciones(); }}
        onSaved={() => { setShowForm(false); setEditEval(null); loadEvaluaciones(); }}
      />
    );
  }

  if (detailEval) {
    const ev = detailEval;
    const dateStr = ev.fecha
      ? new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Sin fecha';

    return (
      <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={() => setDetailEval(null)} className="text-gray-400 hover:text-white transition-colors shrink-0">
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Detalle de Evaluacion</p>
                <h2 className="text-sm font-bold text-white truncate">{dateStr}</h2>
              </div>
            </div>
            {!readOnly && (
              <button
                onClick={() => { setDetailEval(null); setEditEval(ev); }}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                Editar
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-8 overflow-y-auto">
          {ev.foto_url && (
            <div className="mb-5">
              <img src={ev.foto_url} alt="Foto evaluacion" className="w-full rounded-xl object-cover max-h-56" />
            </div>
          )}

          {allFields.map(group => {
            const visibleFields = group.fields.filter(f => {
              const val = (ev as Record<string, unknown>)[f.key];
              return val != null;
            });
            if (visibleFields.length === 0) return null;
            return (
              <div key={group.section} className="mb-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.section}</h3>
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  {visibleFields.map((f, idx) => {
                    const val = (ev as Record<string, unknown>)[f.key];
                    return (
                      <div key={f.key} className={`flex items-center justify-between px-4 py-3 ${idx < visibleFields.length - 1 ? 'border-b border-gray-700' : ''}`}>
                        <span className="text-sm text-gray-400">{f.label}</span>
                        <span className="text-sm font-semibold text-white">{String(val)} {f.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {ev.notas && (
            <div className="mb-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notas</h3>
              <div className="bg-gray-800 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{ev.notas}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  const alumnoName = `${alumno.nombre} ${alumno.apellido}`;
  const alumnoInitials = `${alumno.nombre?.[0] || ''}${alumno.apellido?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500/20 border border-blue-500 shrink-0 flex items-center justify-center">
              {alumno.foto_url ? (
                <img src={alumno.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-blue-400">{alumnoInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Evaluaciones</p>
              <h2 className="text-sm font-bold text-white truncate">{alumnoName}</h2>
            </div>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus size={14} />
              Nueva
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <span className="w-8 h-8 spinner mx-auto" />
          </div>
        ) : evaluaciones.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Weight size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No hay evaluaciones registradas</p>
            {!readOnly && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-yellow-400 text-sm font-semibold hover:text-orange-300"
              >
                Crear primera evaluacion
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {evaluaciones.map(ev => (
              <button
                key={ev.id}
                onClick={() => setDetailEval(ev)}
                className="w-full bg-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 shrink-0 flex items-center justify-center">
                    {ev.foto_url ? (
                      <img src={ev.foto_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Weight size={16} className="text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-gray-500 shrink-0" />
                      <p className="text-sm font-semibold text-white">
                        {ev.fecha ? new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                      </p>
                    </div>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      {ev.peso != null && <span className="text-xs text-gray-400">{ev.peso} kg</span>}
                      {ev.porcentaje_grasa != null && <span className="text-xs text-gray-400">{ev.porcentaje_grasa}% grasa</span>}
                      {ev.pecho != null && <span className="text-xs text-gray-400">Pecho {ev.pecho}cm</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
