import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Crown, Shield, Zap, Award, TrendingUp, Star, Link, User, Trophy, Share2 } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type RankDef = {
  name: string;
  label: string;
  xpRequired: number;
  top: string;
  color: string;
  glow: string;
  icon: React.ReactNode;
};

const RANKS: RankDef[] = [
  { name: 'LEYENDA', label: 'LEYENDA FP', xpRequired: 10000, top: 'TOP 1%', color: '#facc15', glow: 'rgba(250,204,21,0.6)', icon: <Crown size={22} fill="currentColor" /> },
  { name: 'ELITE', label: 'ÉLITE', xpRequired: 7500, top: 'TOP 5%', color: '#e2e8f0', glow: 'rgba(226,232,240,0.5)', icon: <Shield size={22} /> },
  { name: 'DIAMANTE', label: 'DIAMANTE', xpRequired: 5000, top: 'TOP 11%', color: '#67e8f9', glow: 'rgba(103,232,249,0.5)', icon: <Zap size={22} fill="currentColor" /> },
  { name: 'COMPETIDORA', label: 'COMPETIDORA', xpRequired: 3000, top: 'TOP 20%', color: '#34d399', glow: 'rgba(52,211,153,0.5)', icon: <Award size={22} /> },
  { name: 'AVANZADA', label: 'AVANZADA', xpRequired: 1500, top: 'TOP 44%', color: '#f59e0b', glow: 'rgba(245,158,11,0.45)', icon: <TrendingUp size={22} /> },
  { name: 'CONSTANTE', label: 'CONSTANTE', xpRequired: 500, top: 'TOP 60%', color: '#9ca3af', glow: 'rgba(156,163,175,0.4)', icon: <Star size={22} /> },
  { name: 'INICIADA', label: 'INICIADA', xpRequired: 100, top: 'TOP 79%', color: '#cd7f32', glow: 'rgba(205,127,50,0.4)', icon: <Zap size={22} /> },
  { name: 'NOVATA', label: 'NOVATA', xpRequired: 0, top: '0 XP', color: '#6b7280', glow: 'rgba(107,114,128,0.25)', icon: <Link size={22} /> },
];

function getRank(xp: number): RankDef {
  for (const r of RANKS) if (xp >= r.xpRequired) return r;
  return RANKS[RANKS.length - 1];
}

function getNextRank(xp: number): RankDef | null {
  for (let i = RANKS.length - 1; i >= 0; i--) if (RANKS[i].xpRequired > xp) return RANKS[i];
  return null;
}

type Props = { profile: Profile; onBack: () => void };

async function generateShareCard(opts: {
  name: string;
  rankLabel: string;
  rankColor: string;
  xp: number;
  avatarUrl?: string;
  mode: 'rank' | 'top';
  position?: number;
}): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0a0f');
  bg.addColorStop(0.5, '#111827');
  bg.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Gold border frame
  const bw = 18;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#facc15');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(1, '#facc15');
  ctx.strokeStyle = grad;
  ctx.lineWidth = bw;
  ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

  // Inner faint grid lines (decorative)
  ctx.strokeStyle = 'rgba(250,204,21,0.05)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Logo text
  ctx.font = 'bold 52px sans-serif';
  ctx.fillStyle = 'rgba(250,204,21,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('FPTRAININGPRO', W / 2, 120);

  // Thin gold separator
  ctx.strokeStyle = 'rgba(250,204,21,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 148); ctx.lineTo(W - 200, 148);
  ctx.stroke();

  // Avatar circle
  const cx = W / 2;
  const cy = 400;
  const r = 160;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  if (opts.avatarUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = opts.avatarUrl!;
      });
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } catch {
      ctx.fillStyle = '#374151';
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }
  ctx.restore();

  // Avatar ring
  const ringGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ringGrad.addColorStop(0, '#facc15');
  ringGrad.addColorStop(1, '#f59e0b');
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.stroke();

  // Name
  ctx.font = 'bold 72px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  const displayName = opts.name.length > 18 ? opts.name.slice(0, 17) + '…' : opts.name;
  ctx.fillText(displayName, W / 2, 660);

  if (opts.mode === 'rank') {
    // Achievement label
    ctx.font = '44px sans-serif';
    ctx.fillStyle = 'rgba(156,163,175,0.9)';
    ctx.fillText('RANGO DESBLOQUEADO', W / 2, 760);

    // Rank name
    ctx.font = 'bold 118px sans-serif';
    ctx.fillStyle = opts.rankColor;
    ctx.shadowColor = opts.rankColor;
    ctx.shadowBlur = 60;
    ctx.fillText(opts.rankLabel, W / 2, 920);
    ctx.shadowBlur = 0;

    // Trophy
    ctx.font = '100px sans-serif';
    ctx.fillText('🏆', W / 2, 1070);

    // XP pill
    const pillW = 380;
    const pillH = 100;
    const pillX = (W - pillW) / 2;
    const pillY = 1140;
    const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
    pillGrad.addColorStop(0, 'rgba(250,204,21,0.2)');
    pillGrad.addColorStop(1, 'rgba(245,158,11,0.15)');
    ctx.fillStyle = pillGrad;
    ctx.strokeStyle = 'rgba(250,204,21,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 50);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 58px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${opts.xp.toLocaleString()} XP`, W / 2, pillY + 68);

    // Motivational text
    ctx.font = '46px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('¡La constancia es mi superpoder!', W / 2, 1380);
  } else {
    // TOP mode
    ctx.font = '44px sans-serif';
    ctx.fillStyle = 'rgba(156,163,175,0.9)';
    ctx.fillText('LOGRÉ EL PUESTO', W / 2, 760);

    // Position number
    ctx.font = 'bold 220px sans-serif';
    ctx.fillStyle = opts.position === 1 ? '#facc15' : opts.position === 2 ? '#e2e8f0' : opts.position === 3 ? '#cd7f32' : '#ffffff';
    ctx.shadowColor = opts.rankColor;
    ctx.shadowBlur = 50;
    ctx.fillText(`#${opts.position}`, W / 2, 1020);
    ctx.shadowBlur = 0;

    ctx.font = '48px sans-serif';
    ctx.fillStyle = 'rgba(156,163,175,0.8)';
    ctx.fillText('EN EL TOP DE ALUMNAS 🔥', W / 2, 1100);

    ctx.font = 'bold 58px sans-serif';
    ctx.fillStyle = opts.rankColor;
    ctx.fillText(opts.rankLabel, W / 2, 1200);

    ctx.font = 'bold 52px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${opts.xp.toLocaleString()} XP`, W / 2, 1310);

    ctx.font = '46px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('¡Entrena, escala, domina!', W / 2, 1400);
  }

  // Bottom tag
  ctx.font = '38px sans-serif';
  ctx.fillStyle = 'rgba(250,204,21,0.5)';
  ctx.fillText('#FptrainingPro  #Disciplina  #XPRanks', W / 2, H - 80);

  return new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
}

async function shareCard(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Mi logro en FptrainingPro' });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export default function XpStatusPage({ profile, onBack }: Props) {
  const { user, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'rango' | 'top'>('rango');
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [showTour, setShowTour] = useState(!profile.xp_tour_completed);
  const [dismissingTour, setDismissingTour] = useState(false);

  const xp = profile.xp_points ?? 0;
  const currentRank = getRank(xp);

  async function completeTour() {
    if (dismissingTour) return;
    setDismissingTour(true);
    if (user) {
      await supabase.from('perfiles').update({ xp_tour_completed: true }).eq('id', user.id);
      refreshProfile();
    }
    setShowTour(false);
    setDismissingTour(false);
  }

  useEffect(() => {
    if (tab === 'top') {
      setLoadingTop(true);
      supabase
        .from('perfiles')
        .select('*')
        .eq('rol', 'alumno')
        .order('xp_points', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setLeaderboard((data as Profile[]) || []);
          setLoadingTop(false);
        });
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] text-yellow-400 uppercase tracking-wider">Gamificacion</p>
            <h2 className="text-sm font-bold text-white">Mi Estatus</h2>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-black text-yellow-400">{xp.toLocaleString()} XP</p>
            <p className="text-[9px] text-gray-500 uppercase">{currentRank.label}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 flex shrink-0">
        {(['rango', 'top'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-wider relative transition-colors"
            style={{ color: tab === t ? '#facc15' : '#6b7280' }}
          >
            {t === 'rango' ? 'Mi Rango' : 'Top Alumnas'}
            {tab === t && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-yellow-400 rounded-full" />}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-8">
        {tab === 'rango' ? (
          <RangoTab xp={xp} currentRank={currentRank} nextRank={getNextRank(xp)} profile={profile} />
        ) : (
          <TopTab leaderboard={leaderboard} loading={loadingTop} myId={profile.id} profile={profile} />
        )}
      </main>

      {/* Welcome tour modal */}
      {showTour && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center"
            style={{
              background: 'linear-gradient(160deg,#111827,#0a0a0f)',
              border: '1px solid rgba(250,204,21,0.35)',
              boxShadow: '0 0 70px rgba(250,204,21,0.2)',
            }}
          >
            {/* Crown icon */}
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg,rgba(250,204,21,0.25),rgba(245,158,11,0.12))',
                border: '2px solid rgba(250,204,21,0.5)',
                boxShadow: '0 0 35px rgba(250,204,21,0.35)',
              }}
            >
              <Trophy size={36} className="text-yellow-400" />
            </div>

            <h3 className="text-2xl font-black text-yellow-400 mb-1 tracking-wide">¡Bienvenida!</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-5">Comunidad FptrainingPro</p>

            <p className="text-sm text-gray-200 leading-relaxed mb-6">
              Cada dia que finalices tu rutina sumaras{' '}
              <span className="text-yellow-400 font-bold">+50 XP</span>.
              Escala en la pirámide de rangos y compite sanamente en el{' '}
              <span className="text-yellow-400 font-bold">Top de Alumnas</span>{' '}
              por constancia. ¡Mantén la disciplina!
            </p>

            {/* Rank preview row */}
            <div className="flex items-center justify-center gap-2 mb-7 flex-wrap">
              {[
                { label: 'NOVATA', color: '#6b7280' },
                { label: '›', color: '#4b5563' },
                { label: 'INICIADA', color: '#cd7f32' },
                { label: '›', color: '#4b5563' },
                { label: 'LEYENDA', color: '#facc15' },
              ].map((item, i) => (
                <span key={i} className="text-[10px] font-black" style={{ color: item.color }}>{item.label}</span>
              ))}
            </div>

            <button
              onClick={completeTour}
              disabled={dismissingTour}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg,#facc15,#f59e0b)',
                color: '#111827',
                boxShadow: '0 6px 24px rgba(250,204,21,0.4)',
              }}
            >
              {dismissingTour ? 'Guardando...' : '¡Entendido, a entrenar!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RangoTab({ xp, currentRank, nextRank, profile }: { xp: number; currentRank: RankDef; nextRank: RankDef | null; profile: Profile }) {
  const progressPct = nextRank
    ? Math.min(100, ((xp - currentRank.xpRequired) / (nextRank.xpRequired - currentRank.xpRequired)) * 100)
    : 100;
  const xpToNext = nextRank ? nextRank.xpRequired - xp : 0;
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      const blob = await generateShareCard({
        name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || 'Atleta',
        rankLabel: currentRank.label,
        rankColor: currentRank.color,
        xp,
        avatarUrl: profile.foto_url || undefined,
        mode: 'rank',
      });
      await shareCard(blob, 'mi-rango-fptrainingpro.png');
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="px-4 pt-5 space-y-5 pb-4">
      {/* Current rank card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg,rgba(17,24,39,1),rgba(9,9,11,1))',
          border: `1px solid ${currentRank.color}45`,
          boxShadow: `0 0 40px ${currentRank.glow}25`,
        }}
      >
        <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-3">ESTATUS ACTUAL</p>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${currentRank.color}18`, border: `2px solid ${currentRank.color}55`, color: currentRank.color, boxShadow: `0 0 20px ${currentRank.glow}` }}
          >
            {currentRank.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black tracking-wide" style={{ color: currentRank.color }}>{currentRank.label}</p>
            <p className="text-xs text-gray-500">{currentRank.top}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white">{xp.toLocaleString()}</p>
            <p className="text-[9px] text-gray-600 uppercase">XP Total</p>
          </div>
        </div>

        {nextRank && (
          <>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] text-gray-500">Siguiente: <span style={{ color: nextRank.color }}>{nextRank.label}</span></span>
              <span className="text-[10px] text-gray-500">{xpToNext.toLocaleString()} XP restantes</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-800/80 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg,${currentRank.color},${nextRank.color})`,
                  transition: 'width 0.6s ease',
                  boxShadow: `0 0 8px ${currentRank.glow}`,
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 active:scale-95"
        style={{
          background: 'linear-gradient(135deg,rgba(250,204,21,0.15),rgba(245,158,11,0.08))',
          border: '1.5px solid rgba(250,204,21,0.4)',
          color: '#facc15',
          boxShadow: sharing ? 'none' : '0 0 18px rgba(250,204,21,0.12)',
        }}
      >
        <Share2 size={16} />
        {sharing ? 'Generando imagen...' : 'Compartir en Historias'}
      </button>

      {/* How to earn */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest mb-3">Como ganar XP</p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Sesion diaria de rutina</span>
            <span className="text-sm font-black text-yellow-400">+50 XP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Completar toda la rutina semanal</span>
            <span className="text-sm font-black text-yellow-400">+100 XP</span>
          </div>
          <p className="text-[10px] text-gray-600 pt-1 border-t border-gray-800">Una sesion valida por dia. Anti-trampa activado.</p>
        </div>
      </div>

      {/* Rank ladder */}
      <div>
        <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-3">Escalera de Rangos</p>
        <div className="relative">
          {/* Center spine line */}
          <div className="absolute left-[28px] top-6 bottom-6 w-0.5" style={{ background: 'linear-gradient(to bottom,rgba(250,204,21,0.4),rgba(107,114,128,0.06))' }} />

          <div className="space-y-2.5">
            {RANKS.map((rank, idx) => {
              const unlocked = xp >= rank.xpRequired;
              const isCurrent = rank.name === currentRank.name;
              const shrinkFactor = 1 - idx * 0.025;

              return (
                <div
                  key={rank.name}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 relative transition-all duration-300"
                  style={{
                    transform: `scaleX(${shrinkFactor})`,
                    transformOrigin: 'center',
                    background: isCurrent
                      ? `linear-gradient(135deg,${rank.color}18,${rank.color}06)`
                      : unlocked ? 'rgba(17,24,39,0.7)' : 'rgba(9,9,11,0.5)',
                    border: isCurrent
                      ? `1px solid ${rank.color}55`
                      : unlocked ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.02)',
                    boxShadow: isCurrent ? `0 0 18px ${rank.glow}` : 'none',
                    filter: !unlocked ? 'grayscale(1)' : 'none',
                    opacity: !unlocked ? 0.4 : 1,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: unlocked ? `${rank.color}18` : 'rgba(30,41,59,0.8)',
                      border: `2px solid ${unlocked ? rank.color + '50' : 'rgba(55,65,81,0.6)'}`,
                      color: unlocked ? rank.color : '#374151',
                      boxShadow: isCurrent ? `0 0 12px ${rank.glow}` : 'none',
                    }}
                  >
                    {rank.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-black tracking-wide" style={{ color: unlocked ? rank.color : '#374151' }}>
                        {rank.label}
                      </p>
                      {isCurrent && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-yellow-400 text-gray-900 shrink-0">
                          TU RANGO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: unlocked ? 'rgba(156,163,175,0.7)' : '#1f2937' }}>{rank.top}</p>
                  </div>

                  <p className="text-xs font-bold shrink-0" style={{ color: unlocked ? rank.color : '#1f2937' }}>
                    {rank.xpRequired === 0 ? '0 XP' : `${rank.xpRequired.toLocaleString()} XP`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopTab({ leaderboard, loading, myId, profile }: { leaderboard: Profile[]; loading: boolean; myId: string; profile: Profile }) {
  const [sharing, setSharing] = useState(false);

  async function handleShareTop(position: number) {
    setSharing(true);
    try {
      const rank = getRank(profile.xp_points ?? 0);
      const blob = await generateShareCard({
        name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || 'Atleta',
        rankLabel: rank.label,
        rankColor: rank.color,
        xp: profile.xp_points ?? 0,
        avatarUrl: profile.foto_url || undefined,
        mode: 'top',
        position,
      });
      await shareCard(blob, 'mi-top-fptrainingpro.png');
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const podiumColors = ['#facc15', '#9ca3af', '#cd7f32'];
  const posLabels = ['1°', '2°', '3°'];

  return (
    <div className="px-4 pt-5 space-y-2.5">
      <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-4">Clasificacion general · alumnos</p>

      {leaderboard.length === 0 && (
        <p className="text-center text-sm text-gray-600 py-12">Sin datos aun</p>
      )}

      {leaderboard.map((p, idx) => {
        const rank = getRank(p.xp_points ?? 0);
        const isMe = p.id === myId;
        const isPodium = idx < 3;
        const posColor = isPodium ? podiumColors[idx] : '#4b5563';
        const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Alumna';
        const initials = `${p.nombre?.[0] || ''}${p.apellido?.[0] || ''}`.toUpperCase();

        return (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: isMe
                ? 'linear-gradient(135deg,rgba(250,204,21,0.13),rgba(245,158,11,0.06))'
                : isPodium ? 'rgba(17,24,39,0.85)' : 'rgba(9,9,11,0.55)',
              border: isMe
                ? '1px solid rgba(250,204,21,0.38)'
                : isPodium ? `1px solid ${posColor}28` : '1px solid rgba(255,255,255,0.03)',
              boxShadow: isMe ? '0 0 16px rgba(250,204,21,0.1)' : 'none',
            }}
          >
            {/* Position badge */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
              style={{
                background: isPodium ? `${posColor}20` : 'rgba(31,41,55,0.8)',
                color: posColor,
                border: `1.5px solid ${isPodium ? posColor + '45' : 'rgba(55,65,81,0.5)'}`,
              }}
            >
              {isPodium ? posLabels[idx] : idx + 1}
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full overflow-hidden shrink-0"
              style={{ border: `2px solid ${isMe ? '#facc15' : posColor + '45'}` }}
            >
              {p.foto_url ? (
                <img src={p.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  {initials ? (
                    <span className="text-xs font-bold text-gray-300">{initials}</span>
                  ) : (
                    <User size={14} className="text-gray-600" />
                  )}
                </div>
              )}
            </div>

            {/* Name + rank */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-bold truncate" style={{ color: isMe ? '#facc15' : '#fff' }}>{name}</p>
                {isMe && <span className="text-[8px] font-black bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded-full shrink-0">TÚ</span>}
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: rank.color }}>{rank.label}</p>
            </div>

            {/* XP + share */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="text-sm font-black" style={{ color: isMe ? '#facc15' : isPodium ? posColor : '#6b7280' }}>
                  {(p.xp_points ?? 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-gray-700 uppercase">XP</p>
              </div>
              {isMe && (
                <button
                  onClick={() => handleShareTop(idx + 1)}
                  disabled={sharing}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                  style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.35)', color: '#facc15' }}
                  title="Compartir logro"
                >
                  <Share2 size={13} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
