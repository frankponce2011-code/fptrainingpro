import { useState } from 'react';
import { ArrowLeft, Zap, TrendingUp } from 'lucide-react';

type Props = {
  onClose: () => void;
};

const PERCENTAGES = [
  { pct: 95, label: 'Fuerza Maxima+', zone: 'Potencia absoluta', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { pct: 90, label: 'Fuerza Maxima', zone: '1–3 reps', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { pct: 85, label: 'Fuerza Pesada', zone: '4–6 reps', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  { pct: 80, label: 'Hipertrofia Pesada', zone: '6–8 reps', color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  { pct: 75, label: 'Hipertrofia Media', zone: '8–10 reps', color: '#a3e635', bg: 'rgba(163,230,53,0.1)' },
  { pct: 70, label: 'Hipertrofia/Resistencia', zone: '10–12 reps', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  { pct: 65, label: 'Resistencia Muscular', zone: '12–15 reps', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  { pct: 60, label: 'Potencia/Calentamiento', zone: '15–20 reps', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
];

export default function OneRMCalculator({ onClose }: Props) {
  const [peso, setPeso] = useState('');
  const [reps, setReps] = useState('');

  const pesoNum = parseFloat(peso);
  const repsNum = parseInt(reps, 10);
  const valid = !isNaN(pesoNum) && pesoNum > 0 && !isNaN(repsNum) && repsNum >= 1 && repsNum <= 12;
  const oneRM = valid ? pesoNum * (1 + repsNum / 30) : null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] text-yellow-400 uppercase tracking-wider">Herramientas de Fuerza</p>
            <h2 className="text-sm font-bold text-white">Calculadora 1RM</h2>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Intro card */}
        <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(234,179,8,0.04) 100%)', border: '1px solid rgba(250,204,21,0.15)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(250,204,21,0.15)' }}>
              <Zap size={18} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Formula de Epley</h3>
              <p className="text-[11px] text-gray-500">1RM = Peso × (1 + Reps / 30)</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Ingresa el peso que lograste levantar y el numero de repeticiones (max. 12) para calcular tu maximo estimado de una repeticion.
          </p>
        </div>

        {/* Input form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Peso levantado</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min="1"
                max="500"
                placeholder="0"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-lg font-bold placeholder-gray-600 focus:outline-none transition-colors pr-16"
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' } as React.CSSProperties}
                onFocus={e => (e.target.style.borderColor = '#facc15')}
                onBlur={e => (e.target.style.borderColor = '')}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">kg</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Repeticiones logradas</label>
            {/* Rep selector buttons */}
            <div className="grid grid-cols-6 gap-2">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button
                  key={n}
                  onClick={() => setReps(String(n))}
                  className="py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: reps === String(n) ? '#facc15' : 'rgba(255,255,255,0.05)',
                    color: reps === String(n) ? '#111827' : '#9ca3af',
                    border: `1px solid ${reps === String(n) ? '#facc15' : 'rgba(255,255,255,0.07)'}`,
                    transform: reps === String(n) ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        {oneRM !== null && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(250,204,21,0.12) 0%, rgba(234,179,8,0.06) 100%)',
              border: '1px solid rgba(250,204,21,0.3)',
              boxShadow: '0 0 32px rgba(250,204,21,0.08)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp size={14} className="text-yellow-500" />
              <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Tu 1RM Estimado</p>
            </div>
            <p
              className="font-black tabular-nums"
              style={{ fontSize: 64, lineHeight: 1, color: '#facc15', letterSpacing: '-2px' }}
            >
              {oneRM.toFixed(1)}
            </p>
            <p className="text-sm font-bold text-gray-400 mt-1">kilogramos</p>
            <p className="text-[11px] text-gray-600 mt-3">
              Basado en {pesoNum} kg × {repsNum} rep{repsNum !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Percentage table */}
        {oneRM !== null && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tabla de Porcentajes</p>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
            {PERCENTAGES.map(({ pct, label, zone, color, bg }) => {
              const kg = (oneRM * pct) / 100;
              const barWidth = pct;
              return (
                <div
                  key={pct}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: bg, border: `1px solid ${color}20` }}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black tabular-nums shrink-0" style={{ color, minWidth: 32 }}>{pct}%</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{label}</p>
                          <p className="text-[10px] text-gray-500">{zone}</p>
                        </div>
                      </div>
                      <span
                        className="text-sm font-black tabular-nums shrink-0 ml-2"
                        style={{ color }}
                      >
                        {kg.toFixed(1)} kg
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="h-1 rounded-full bg-gray-800/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barWidth}%`, backgroundColor: color, opacity: 0.6 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state hint */}
        {!valid && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'rgba(250,204,21,0.08)' }}>
              <Zap size={28} className="text-yellow-400 opacity-40" />
            </div>
            <p className="text-sm font-semibold text-gray-500">Ingresa el peso y repeticiones</p>
            <p className="text-xs text-gray-600 mt-1">para ver tu 1RM y tabla de porcentajes</p>
          </div>
        )}

        <div className="h-4" />
      </main>
    </div>
  );
}
