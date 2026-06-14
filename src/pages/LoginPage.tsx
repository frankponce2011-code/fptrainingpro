import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Download, X, Share } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import RegisterPage from './RegisterPage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
    || window.matchMedia('(display-mode: standalone)').matches;
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (isIOS()) {
      setShowIOSBanner(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDebugInfo(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      const raw = (error as Error).message || String(error);
      console.error('[LOGIN] Error completo recibido:', raw);

      // Profile not found after successful auth
      if (raw.startsWith('AUTH_OK_NO_PROFILE::')) {
        const detail = raw.replace('AUTH_OK_NO_PROFILE::', '');
        setError('Tu cuenta existe pero no tiene un perfil activo. Contacta al administrador.');
        setDebugInfo(`Detalle tecnico: ${detail}`);
        return;
      }

      // Invalid credentials
      if (raw.includes('Invalid login credentials') || raw.includes('invalid_credentials')) {
        setError('Correo o contrasena incorrectos.');
        setDebugInfo(`Error de Supabase: ${raw}`);
        return;
      }

      // Email not confirmed
      if (raw.includes('Email not confirmed') || raw.includes('email_not_confirmed')) {
        setError('El correo no fue confirmado. Contacta al administrador para que active tu cuenta.');
        setDebugInfo(`Error de Supabase: ${raw}`);
        return;
      }

      // Database / schema error
      if (raw.includes('querying schema') || raw.includes('Database error')) {
        setError('Error de base de datos al verificar tu cuenta. Contacta al administrador.');
        setDebugInfo(`Error de esquema: ${raw}`);
        return;
      }

      // User not found
      if (raw.includes('User not found') || raw.includes('user_not_found')) {
        setError('No existe una cuenta con ese correo.');
        setDebugInfo(`Error de Supabase: ${raw}`);
        return;
      }

      // Fallback — show raw message
      setError(raw);
      setDebugInfo(`Error no clasificado: ${raw}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-12 page-enter">
      {/* RegisterPage overlay */}
      {showRegister && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
        </div>
      )}
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="mb-5">
          <img
            src="https://twsmiqxywmsskxbejykb.supabase.co/storage/v1/object/public/avatars/LogoActual.jpg"
            alt="FPTrainingPro"
            style={{ width: '200px', margin: '0 auto' }}
            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
          />
        </div>
        <p className="text-gray-400 text-sm mt-1">Tu entrenamiento, tu evolucion</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Ingresar</h2>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm space-y-1">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
              {debugInfo && (
                <p className="text-xs text-red-400/80 pl-6 break-all">{debugInfo}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Correo electronico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Contrasena</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-10 pr-12 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-400/30 disabled:opacity-50 transition-all mt-2 flex items-center justify-center"
            >
              {loading ? <span className="w-5 h-5 spinner" /> : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>

      {/* Register link */}
      <p className="text-center text-gray-400 mt-5 text-sm">
        ¿Eres nuevo?{' '}
        <button
          onClick={() => setShowRegister(true)}
          className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
        >
          Registrate aqui
        </button>
      </p>

      {/* Android/Chrome install banner */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-3 bg-gray-900 border-t border-gray-800 flex items-center gap-3 z-50">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
            <img src="/icon-192.png" alt="FPTrainingPro" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">Instalar FPTrainingPro</p>
            <p className="text-xs text-gray-400">Agrega la app a tu pantalla de inicio</p>
          </div>
          <button onClick={handleInstall}
            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1">
            <Download size={12} /> Instalar
          </button>
          <button onClick={() => setShowInstallBanner(false)} className="text-gray-500 hover:text-white p-1 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* iOS install instructions */}
      {showIOSBanner && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-3 bg-gray-900 border-t border-gray-800 z-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img src="/icon-192.png" alt="FPTrainingPro" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight mb-0.5">Instalar FPTrainingPro</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Toca <Share size={11} className="inline mx-0.5 text-blue-400" /> <span className="text-blue-400 font-semibold">Compartir</span> y luego <span className="text-white font-semibold">"Agregar a inicio"</span> para instalar la app.
              </p>
            </div>
            <button onClick={() => setShowIOSBanner(false)} className="text-gray-500 hover:text-white p-1 shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
