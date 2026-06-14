import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Calendar, Trash2, Plus, Download, AlertTriangle } from 'lucide-react';
import { supabase, Profile, Dieta } from '../lib/supabase';
import DietaForm from './DietaForm';

type Props = {
  alumno: Profile;
  onBack: () => void;
};

export default function DietaDetail({ alumno, onBack }: Props) {
  const [dieta, setDieta] = useState<Dieta | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadDieta() {
    setLoading(true);
    const { data } = await supabase
      .from('dietas')
      .select('*')
      .eq('alumno_id', alumno.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setDieta(data);
    setLoading(false);
  }

  useEffect(() => {
    loadDieta();
  }, [alumno.id]);

  async function handleDelete() {
    if (!dieta) return;
    setDeleting(true);
    await supabase.from('dietas').delete().eq('id', dieta.id);
    setDieta(null);
    setConfirmDelete(false);
    setDeleting(false);
  }

  if (showForm) {
    return (
      <DietaForm
        alumno={alumno}
        onBack={() => { setShowForm(false); loadDieta(); }}
        onSaved={() => { setShowForm(false); loadDieta(); }}
      />
    );
  }

  const alumnoName = `${alumno.nombre} ${alumno.apellido}`;
  const alumnoInitials = `${alumno.nombre?.[0] || ''}${alumno.apellido?.[0] || ''}`.toUpperCase();

  const fileName = dieta?.archivo_url
    ? decodeURIComponent(dieta.archivo_url.split('/').pop() || 'archivo')
    : null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-green-500/20 border border-green-500 shrink-0 flex items-center justify-center">
              {alumno.foto_url ? (
                <img src={alumno.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-green-400">{alumnoInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Dieta</p>
              <h2 className="text-sm font-bold text-white truncate">{alumnoName}</h2>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus size={14} />
            Nueva Dieta
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12">
            <span className="w-8 h-8 spinner mx-auto" />
          </div>
        ) : !dieta ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold mb-1">Sin dieta asignada</p>
            <p className="text-xs text-gray-500 mb-5">Este alumno no tiene dieta activa</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Enviar primera dieta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Archivo */}
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Archivo de Dieta</p>
              {dieta.archivo_url ? (
                <a
                  href={dieta.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 rounded-xl p-3 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{fileName}</p>
                    <p className="text-xs text-gray-400">Abrir archivo</p>
                  </div>
                  <Download size={16} className="text-gray-400 group-hover:text-green-400 transition-colors shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-gray-500">Sin archivo adjunto</p>
              )}
            </div>

            {/* Info */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              {dieta.descripcion && (
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripcion</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{dieta.descripcion}</p>
                </div>
              )}
              {dieta.fecha_fin && (
                <div className="px-4 py-3 flex items-center gap-2">
                  <Calendar size={14} className="text-green-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Fecha de vencimiento</p>
                    <p className="text-sm font-semibold text-white">
                      {new Date(dieta.fecha_fin + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
              {dieta.created_at && (
                <div className="px-4 py-3 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    Enviada el {new Date(dieta.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* Delete */}
            {confirmDelete ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <p className="text-sm font-semibold text-red-300">Eliminar esta dieta</p>
                </div>
                <p className="text-xs text-gray-400 mb-4">Esta accion no se puede deshacer</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 bg-gray-700 rounded-lg text-sm font-semibold text-gray-300 hover:bg-gray-600 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 py-2.5 bg-red-600 rounded-lg text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                    {deleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/30 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
                Eliminar dieta actual
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
