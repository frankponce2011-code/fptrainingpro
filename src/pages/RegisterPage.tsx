import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  onSwitchToLogin: () => void;
};

export default function RegisterPage({ onSwitchToLogin }: Props) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!nombre.trim() || !apellido.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contrasenias no coinciden.');
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });

    if (authError) {
      setLoading(false);
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        setError('Este correo ya esta registrado. Inicia sesion.');
      } else {
        setError(authError.message);
      }
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setError('Error al crear la cuenta. Intenta de nuevo.');
      return;
    }

    // Create profile with entrenador_id = null (guest/invitado)
    const { error: profileError } = await supabase.from('perfiles').insert({
      id: userId,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rol: 'alumno',
      entrenador_id: null,
      sexo: 'masculino',
    });

    setLoading(false);

    if (profileError) {
      setError('Cuenta creada pero hubo un error al guardar el perfil. Contacta al administrador.');
      return;
    }

    setSuccess(true);
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['', 'Debil', 'Media', 'Fuerte'];

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(250,204,21,0.12)', border: '1.5px solid rgba(250,204,21,0.4)' }}
            >
              <User size={30} className="text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Cuenta creada</h2>
            <p className="text-sm text-gray-400 mb-6">
              Tu cuenta fue creada exitosamente. Ahora puedes iniciar sesion.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition-all"
            >
              Ir al inicio de sesion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-12 page-enter">
      <div className="flex flex-col items-center mb-8">
        <img
          src="https://twsmiqxywmsskxbejykb.supabase.co/storage/v1/object/public/avatars/LogoActual.jpg"
          alt="FPTrainingPro"
          style={{ width: '160px', margin: '0 auto', borderRadius: 12 }}
          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
        />
        <p className="text-gray-400 text-sm mt-3">Crea tu cuenta gratis</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Crear Cuenta</h2>

          {error && (
            <div className="flex items-start gap-2 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nombre</label>
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ana"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Apellido</label>
                <input
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  placeholder="Garcia"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                  required
                />
              </div>
            </div>

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
                  placeholder="Minimo 6 caracteres"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-10 pr-12 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength >= i ? strengthColors[passwordStrength] : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Confirmar contrasena</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite tu contrasena"
                  className={`w-full bg-gray-800 border rounded-xl px-4 py-3 pl-10 pr-12 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors ${
                    confirm.length > 0 && confirm !== password ? 'border-red-500' : 'border-gray-700'
                  }`}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-400/30 disabled:opacity-50 transition-all mt-2 flex items-center justify-center"
            >
              {loading ? <span className="w-5 h-5 spinner" style={{ borderTopColor: '#111827' }} /> : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 mt-5 text-sm">
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
          >
            Inicia sesion
          </button>
        </p>
      </div>
    </div>
  );
}
