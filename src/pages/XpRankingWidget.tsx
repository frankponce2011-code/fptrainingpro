import { useState, useEffect } from 'react';
import { Trophy, User } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';

type RankDef = { label: string; xpRequired: number; color: string };

const RANKS: RankDef[] = [
  { label: 'LEYENDA FP', xpRequired: 10000, color: '#facc15' },
  { label: 'ÉLITE', xpRequired: 7500, color: '#e2e8f0' },
  { label: 'DIAMANTE', xpRequired: 5000, color: '#67e8f9' },
  { label: 'COMPETIDORA', xpRequired: 3000, color: '#34d399' },
  { label: 'AVANZADA', xpRequired: 1500, color: '#f59e0b' },
  { label: 'CONSTANTE', xpRequired: 500, color: '#9ca3af' },
  { label: 'INICIADA', xpRequired: 100, color: '#cd7f32' },
  { label: 'NOVATA', xpRequired: 0, color: '#6b7280' },
];

function getRank(xp: number): RankDef {
  for (const r of RANKS) if (xp >= r.xpRequired) return r;
  return RANKS[RANKS.length - 1];
}

const podiumColors = ['#facc15', '#9ca3af', '#cd7f32'];
const posLabels = ['1°', '2°', '3°'];

export default function XpRankingWidget() {
  const [alumnos, setAlumnos] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'alumno')
      .order('xp_points', { ascending: false })
      .limit(25)
      .then(({ data }) => {
        setAlumnos((data as Profile[]) || []);
        setLoading(false);
      });
  }, []);

  const visibleCount = expanded ? alumnos.length : 5;
  const visible = alumnos.slice(0, visibleCount);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{ border: '1px solid rgba(250,204,21,0.25)', background: 'linear-gradient(160deg,rgba(17,24,39,0.95),rgba(9,9,11,0.97))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-yellow-400/10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(250,204,21,0.14)', border: '1.5px solid rgba(250,204,21,0.35)', boxShadow: '0 0 14px rgba(250,204,21,0.2)' }}
        >
          <Trophy size={16} className="text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white tracking-wide">Ranking de Disciplina</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Top XP · Alumnos activos</p>
        </div>
        {!loading && alumnos.length > 0 && (
          <span className="text-[10px] text-yellow-400 font-bold shrink-0">{alumnos.length} alumnos</span>
        )}
      </div>

      {/* Table header */}
      {!loading && visible.length > 0 && (
        <div className="grid gap-0" style={{ gridTemplateColumns: '36px 1fr auto' }}>
          <div className="px-3 py-2 col-span-3 grid gap-0" style={{ gridTemplateColumns: '36px 1fr 90px' }}>
            <span className="text-[9px] text-gray-700 uppercase font-bold text-center">#</span>
            <span className="text-[9px] text-gray-700 uppercase font-bold">Alumna</span>
            <span className="text-[9px] text-gray-700 uppercase font-bold text-right">XP · Último entreno</span>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="divide-y divide-gray-800/60">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-xs text-gray-600 py-6">Sin alumnos aun</p>
        ) : (
          visible.map((p, idx) => {
            const rank = getRank(p.xp_points ?? 0);
            const isPodium = idx < 3;
            const posColor = isPodium ? podiumColors[idx] : '#4b5563';
            const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Alumna';
            const initials = `${p.nombre?.[0] || ''}${p.apellido?.[0] || ''}`.toUpperCase();
            const lastDate = p.last_workout_date
              ? new Date(p.last_workout_date + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
              : '—';
            const today = new Date().toISOString().split('T')[0];
            const trainedToday = p.last_workout_date === today;

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{ background: isPodium ? `${posColor}07` : 'transparent' }}
              >
                {/* Position */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs"
                  style={{
                    background: isPodium ? `${posColor}22` : 'rgba(31,41,55,0.6)',
                    color: posColor,
                    border: `1px solid ${isPodium ? posColor + '40' : 'rgba(55,65,81,0.4)'}`,
                  }}
                >
                  {isPodium ? posLabels[idx] : idx + 1}
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full overflow-hidden shrink-0"
                  style={{ border: `2px solid ${isPodium ? posColor + '55' : 'rgba(55,65,81,0.5)'}` }}
                >
                  {p.foto_url ? (
                    <img src={p.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      {initials ? (
                        <span className="text-[9px] font-bold text-gray-400">{initials}</span>
                      ) : (
                        <User size={12} className="text-gray-600" />
                      )}
                    </div>
                  )}
                </div>

                {/* Name + rank */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{name}</p>
                  <p className="text-[10px] font-semibold truncate" style={{ color: rank.color }}>{rank.label}</p>
                </div>

                {/* XP + last workout */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-black" style={{ color: isPodium ? posColor : '#facc15' }}>
                    {(p.xp_points ?? 0).toLocaleString()}
                    <span className="text-[9px] font-normal text-gray-600 ml-0.5">XP</span>
                  </p>
                  <p className="text-[9px] font-semibold" style={{ color: trainedToday ? '#4ade80' : '#6b7280' }}>
                    {trainedToday ? 'Hoy' : lastDate}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expand / collapse */}
      {!loading && alumnos.length > 5 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
          style={{ color: '#6b7280', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          {expanded ? `Mostrar menos` : `Ver los ${alumnos.length} alumnos`}
        </button>
      )}
    </div>
  );
}
