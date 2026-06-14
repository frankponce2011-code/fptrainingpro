import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, Filter, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  onBack: () => void;
};

type RegistroIngreso = {
  id: string;
  usuario_id: string | null;
  nombre_completo: string | null;
  correo: string | null;
  rol: string | null;
  fecha_ingreso: string;
};

const rolBadge: Record<string, string> = {
  'alumno': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'entrenador': 'bg-green-500/20 text-green-300 border-green-500/30',
  'entrenador_administrador': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

const rolLabel: Record<string, string> = {
  'alumno': 'Alumno',
  'entrenador': 'Entrenador',
  'entrenador_administrador': 'Admin',
};

type DateFilter = 'all' | 'today' | 'week' | 'month';
type RolFilter = 'all' | 'alumno' | 'entrenador';

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' — '
    + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function IngresosPage({ onBack }: Props) {
  const [registros, setRegistros] = useState<RegistroIngreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState<RolFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<RegistroIngreso | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('registro_ingresos')
      .select('*')
      .order('fecha_ingreso', { ascending: false });
    setRegistros(data || []);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('registro_ingresos').delete().eq('id', deleteTarget.id);
    setRegistros(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm(
      '¿Estas seguro de que deseas eliminar todo el historial de ingresos? Esta accion no se puede deshacer.'
    );
    if (!confirmed) return;
    await supabase.from('registro_ingresos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setRegistros([]);
  }

  function isInDateRange(iso: string, filter: DateFilter): boolean {
    if (filter === 'all') return true;
    const d = new Date(iso);
    const now = new Date();
    if (filter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (filter === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    if (filter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  }

  const filtered = registros.filter(r => {
    const searchMatch = search === '' ||
      (r.nombre_completo || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.correo || '').toLowerCase().includes(search.toLowerCase());
    const rolMatch = rolFilter === 'all' ||
      (rolFilter === 'alumno' && r.rol === 'alumno') ||
      (rolFilter === 'entrenador' && (r.rol === 'entrenador' || r.rol === 'entrenador_administrador'));
    const dateMatch = isInDateRange(r.fecha_ingreso, dateFilter);
    return searchMatch && rolMatch && dateMatch;
  });

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white">Eliminar registro</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-400 mb-1">{deleteTarget.nombre_completo || '—'}</p>
            <p className="text-xs text-gray-500 mb-1">{deleteTarget.correo || '—'}</p>
            <p className="text-xs text-gray-600 mb-4">{formatFecha(deleteTarget.fecha_ingreso)}</p>
            <p className="text-xs text-red-400 mb-4">Esta accion no se puede deshacer</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-gray-800 rounded-xl text-gray-300 text-sm font-semibold">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Administrador</p>
            <h2 className="text-sm font-bold text-white">Registro de Ingresos</h2>
          </div>
          {registros.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-lg text-xs font-semibold text-red-400 transition-colors shrink-0"
            >
              <Trash2 size={12} /> Borrar todo
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto pb-8">
        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {(['all', 'alumno', 'entrenador'] as RolFilter[]).map(r => (
            <button key={r} onClick={() => setRolFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${rolFilter === r ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {r === 'all' ? 'Todos' : r === 'alumno' ? 'Alumnos' : 'Entrenadores'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'today', 'week', 'month'] as DateFilter[]).map(d => (
            <button key={d} onClick={() => setDateFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${dateFilter === d ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {d === 'all' ? 'Todo' : d === 'today' ? 'Hoy' : d === 'week' ? 'Esta semana' : 'Este mes'}
            </button>
          ))}
        </div>

        {/* Counter */}
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-gray-500" />
          <span className="text-xs text-gray-500">Total ingresos: <span className="text-white font-semibold">{filtered.length}</span></span>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12"><span className="w-8 h-8 spinner mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Filter size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin registros</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => (
              <div key={r.id} className="bg-gray-800 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0 text-xs font-bold text-gray-400">
                  {(r.nombre_completo || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.nombre_completo || '—'}</p>
                  <p className="text-[10px] text-gray-500 truncate">{r.correo || '—'}</p>
                  <p className="text-[10px] text-gray-600">{formatFecha(r.fecha_ingreso)}</p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${rolBadge[r.rol || ''] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                  {rolLabel[r.rol || ''] || r.rol || '—'}
                </span>
                <button onClick={() => setDeleteTarget(r)}
                  className="text-gray-600 hover:text-red-400 p-1.5 rounded hover:bg-gray-700 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
