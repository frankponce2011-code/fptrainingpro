import { useState, useRef } from 'react';
import { Camera, User, Save, AlertCircle, CheckCircle2, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  isEditing?: boolean;
  onDone?: () => void;
};

export default function ProfileSetupPage({ isEditing = false, onDone }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(profile?.nombre || '');
  const [apellido, setApellido] = useState(profile?.apellido || '');
  const [edad, setEdad] = useState(profile?.edad?.toString() || '');
  const [estatura, setEstatura] = useState(profile?.estatura?.toString() || '');
  const [sexo, setSexo] = useState(profile?.sexo || '');
  const [fotoPreview, setFotoPreview] = useState(profile?.foto_url || '');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      console.error('[PROFILE] Sin usuario autenticado');
      setError('No hay usuario autenticado.');
      return;
    }

    console.log('[PROFILE] Guardando perfil para usuario:', user.id);
    setError('');

    if (!nombre.trim() || !apellido.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }

    setLoading(true);

    try {
      let foto_url = profile?.foto_url || '';

      if (fotoFile) {
        console.log('[PROFILE] Subiendo foto...');
        const ext = fotoFile.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, fotoFile, { upsert: true });

        if (uploadError) {
          console.error('[PROFILE] Error al subir foto:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(path);
        foto_url = urlData.publicUrl + `?t=${Date.now()}`;
        console.log('[PROFILE] Foto subida correctamente');
      }

      const profileData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        edad: edad ? parseInt(edad) : null,
        estatura: estatura ? parseFloat(estatura) : null,
        sexo,
        foto_url,
        rol: profile?.rol || 'alumno',
      };

      console.log('[PROFILE] Datos a guardar:', { id: user.id, ...profileData });

      if (isEditing && profile) {
        console.log('[PROFILE] Actualizando perfil existente...');
        const { error: updateError } = await supabase
          .from('perfiles')
          .update(profileData)
          .eq('id', user.id);

        if (updateError) {
          console.error('[PROFILE] Error al actualizar:', updateError);
          throw updateError;
        }
        console.log('[PROFILE] Perfil actualizado correctamente');
      } else {
        console.log('[PROFILE] Insertando nuevo perfil...');
        const { error: insertError } = await supabase
          .from('perfiles')
          .insert({ id: user.id, ...profileData });

        if (insertError) {
          console.error('[PROFILE] Error al insertar:', insertError);
          throw insertError;
        }
        console.log('[PROFILE] Perfil insertado correctamente');
      }

      console.log('[PROFILE] Llamando a refreshProfile...');
      await refreshProfile();
      console.log('[PROFILE] RefreshProfile completado');

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        console.log('[PROFILE] Llamando a onDone...');
        onDone?.();
      }, 800);
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'Error al guardar el perfil.';
      console.error('[PROFILE] Error capturado:', errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start px-4 py-8 page-enter">
      {!isEditing && (
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-yellow-400/30">
            <Dumbbell size={24} className="text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold text-white font-rajdhani">Completa tu perfil</h1>
          <p className="text-gray-400 text-sm mt-1">Solo tomará un momento</p>
        </div>
      )}

      {isEditing && (
        <div className="w-full max-w-md mb-6">
          <h2 className="text-2xl font-bold text-white font-rajdhani">Editar Perfil</h2>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="card p-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-900/40 border border-green-700 text-green-300 rounded-xl px-4 py-3 mb-5 text-sm">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Perfil guardado correctamente.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-700 border-2 border-yellow-400 cursor-pointer group"
                onClick={() => fileRef.current?.click()}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={40} className="text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold transition-colors"
              >
                {fotoPreview ? 'Cambiar foto' : 'Subir foto de perfil'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Juan"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Apellido *</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  placeholder="García"
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Edad y Estatura */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Edad</label>
                <input
                  type="number"
                  value={edad}
                  onChange={e => setEdad(e.target.value)}
                  placeholder="25"
                  min="10"
                  max="100"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Estatura (cm)</label>
                <input
                  type="number"
                  value={estatura}
                  onChange={e => setEstatura(e.target.value)}
                  placeholder="175"
                  min="100"
                  max="250"
                  className="input-field"
                />
              </div>
            </div>

            {/* Sexo */}
            <div>
              <label className="label">Sexo</label>
              <div className="grid grid-cols-2 gap-3">
                {['Masculino', 'Femenino'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSexo(s)}
                    className={`py-3 rounded-xl border font-semibold text-sm transition-all duration-200 ${
                      sexo === s
                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-yellow-400 hover:text-yellow-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-orange w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 spinner" />
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Guardar cambios' : 'Continuar'}
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={onDone}
                className="btn-ghost w-full text-center"
              >
                Cancelar
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
