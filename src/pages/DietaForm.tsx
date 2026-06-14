import { useState } from 'react';
import { ArrowLeft, Save, Upload, FileText, X, Calendar } from 'lucide-react';
import { supabase, Profile, Dieta } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  alumno: Profile;
  dieta?: Dieta | null;
  onBack: () => void;
  onSaved: () => void;
};

export default function DietaForm({ alumno, dieta, onBack, onSaved }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [archivoName, setArchivoName] = useState<string | null>(dieta?.archivo_url ? dieta.archivo_url.split('/').pop() || 'Archivo' : null);
  const [descripcion, setDescripcion] = useState(dieta?.descripcion || '');
  const [fechaFin, setFechaFin] = useState(dieta?.fecha_fin || '');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoFile(file);
      setArchivoName(file.name);
    }
  }

  async function handleSave() {
    setError('');
    setSaving(true);

    try {
      let archivo_url = dieta?.archivo_url || null;

      if (archivoFile) {
        const ext = archivoFile.name.split('.').pop();
        const path = `${alumno.id}/dieta-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('dietas')
          .upload(path, archivoFile, { upsert: true });
        if (uploadError) {
          // If bucket doesn't exist, try creating it
          if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
            const { error: bucketError } = await supabase.storage.createBucket('dietas', { public: true });
            if (bucketError) throw bucketError;
            const { error: retryError } = await supabase.storage
              .from('dietas')
              .upload(path, archivoFile, { upsert: true });
            if (retryError) throw retryError;
          } else {
            throw uploadError;
          }
        }
        const { data: urlData } = supabase.storage.from('dietas').getPublicUrl(path);
        archivo_url = urlData.publicUrl;
      }

      const data = {
        alumno_id: alumno.id,
        descripcion,
        archivo_url,
        fecha_fin: fechaFin || null,
        nombre: `Dieta - ${alumno.nombre} ${alumno.apellido}`,
      };

      if (dieta) {
        const { error: updateError } = await supabase
          .from('dietas')
          .update(data)
          .eq('id', dieta.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('dietas')
          .insert(data);
        if (insertError) throw insertError;
      }

      // Notify alumno
      await supabase.from('notifications').insert({
        user_id: alumno.id,
        title: 'Nueva dieta asignada',
        message: 'Tu plan de alimentacion ha sido actualizado.',
        read: false,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSaved();
      }, 800);
    } catch (err: unknown) {
      setError((err as Error).message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const alumnoName = `${alumno.nombre} ${alumno.apellido}`;
  const alumnoInitials = `${alumno.nombre?.[0] || ''}${alumno.apellido?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-green-500/20 border border-green-500 shrink-0 flex items-center justify-center">
              {alumno.foto_url ? (
                <img src={alumno.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-green-400">{alumnoInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Enviar Dieta</p>
              <h2 className="text-sm font-bold text-white truncate">{alumnoName}</h2>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg p-3 mb-4">
            Dieta guardada correctamente
          </div>
        )}

        {/* Upload archivo */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-400 mb-2">Archivo de Dieta (Word o PDF)</label>
          {archivoName ? (
            <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
              <FileText size={24} className="text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">{archivoName}</p>
                <p className="text-[10px] text-gray-400">Archivo adjunto</p>
              </div>
              <button
                onClick={() => { setArchivoFile(null); setArchivoName(null); }}
                className="text-gray-500 hover:text-red-400 p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-800 border-2 border-gray-700 border-dashed rounded-xl cursor-pointer hover:border-gray-500 transition-colors">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Upload size={24} className="text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-white font-semibold">Subir archivo</p>
                <p className="text-xs text-gray-400 mt-0.5">Word (.doc, .docx) o PDF</p>
              </div>
              <input
                type="file"
                accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Fecha fin */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              Fecha Fin de la Dieta
            </span>
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Descripcion */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-400 mb-1">Descripcion / Notas</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 resize-none"
            placeholder="Descripcion de la dieta, indicaciones..."
          />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/40 hover:from-green-600 hover:to-green-700 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Guardando...' : 'Guardar Dieta'}
        </button>
      </div>
    </div>
  );
}
