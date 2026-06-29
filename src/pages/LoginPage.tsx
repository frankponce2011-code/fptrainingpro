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
  const { signIn, signInWithGoogle } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
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
      if (raw.includes('invalid_credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Error al iniciar sesión.');
        setDebugInfo(raw);
      }
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoadingGoogle(true);
    const { error } = await signInWithGoogle({
      options: { redirectTo: "https://www.fptrainingpro.com" }
    });
    setLoadingGoogle(false);
    if (error) setError('Error al iniciar sesión con Google.');
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-12">
      {showRegister && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
        </div>
      )}

      <div className="flex flex-col items-center mb-10">
        <img
          src="https://twsmiqxywmsskxbejykb.supabase.co/storage/v1/object/public/avatars/LogoActual.jpg"
          alt="FPTrainingPro"
          style={{ width: '200px', margin: '0 auto' }}
        />
        <p className="text-gray-400 text-sm mt-1">Tu entrenamiento, tu evolución</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Ingresar</h2>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all mb-4 disabled:opacity-50"
          >
            {loadingGoogle ? <span className="spinner" /> : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500">o ingresa con correo</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm" required />
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm" required />
            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold bg-yellow-400 text-gray-900">{loading ? 'Cargando...' : 'Ingresar'}</button>
          </form>
        </div>
      </div>

      <p className="text-center text-gray-400 mt-5 text-sm">
        ¿Eres nuevo? <button onClick={() => setShowRegister(true)} className="text-yellow-400 font-semibold">Regístrate aquí</button>
      </p>

      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center z-50">
          <p className="text-white text-sm">Instalar app</p>
          <button onClick={handleInstall} className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-xs">Instalar</button>
        </div>
      )}

      {showIOSBanner && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 text-white text-sm z-50">
          Toca <Share size={16} className="inline" /> y "Agregar a inicio".
        </div>
      )}
    </div>
  );
}