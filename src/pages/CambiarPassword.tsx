import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Key, Save, Eye, EyeOff } from 'lucide-react';

export default function CambiarPassword() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    // Supabase actualiza la contraseña del usuario que tiene la sesión activa
    const { error: updateError } = await supabase.auth.updateUser({
      password: password.trim()
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setPassword('');
      setTimeout(() => setSuccess(false), 3000); // Borra el mensaje de éxito tras 3 segundos
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 max-w-sm mx-auto mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Key size={18} className="text-yellow-400" />
        <h3 className="text-sm font-bold text-white font-rajdhani uppercase tracking-wider">Cambiar Contraseña</h3>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Escribe tu nueva contraseña privada para reemplazar la clave temporal.
      </p>

      <form onSubmit={handleUpdatePassword} className="space-y-3">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-2.5">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg p-2.5">
            ¡Contraseña actualizada correctamente!
          </div>
        )}

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 disabled:opacity-50 transition-all"
        >
          <Save size={16} />
          {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
        </button>
      </form>
    </div>
  );
}