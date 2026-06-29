import { useState } from 'react';
import { ArrowLeft, Save, Upload, FileText, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { supabase, Profile, Dieta } from '../lib/supabase';

type Props = {
  alumno: Profile;
  dieta?: Dieta | null;
  onBack: () => void;
  onSaved: () => void;
};

type Status = 'idle' | 'saving' | 'processing' | 'done' | 'error';

export default function DietaForm({ alumno, dieta, onBack, onSaved }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState(dieta?.descripcion || '');

  const isBusy = status === 'saving' || status === 'processing';

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setArchivoFile(file);
  }

  function removeFile() {
    setArchivoFile(null);
    setStatus('idle');
    setStatusMsg('');
  }

  async function handleSave() {
    if (isBusy) return;
    setStatus('saving');
    setStatusMsg('Guardando dieta...');

    try {
      let archivo_url = dieta?.archivo_url ?? null;

      if (archivoFile) {
        const path = `${alumno.id}/${Date.now()}-${archivoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('dietas')
          .upload(path, archivoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('dietas').getPublicUrl(path);
        archivo_url = urlData.publicUrl;
      }

      const payload = {
        alumno_id: alumno.id,
        descripcion,
        archivo_url,
        nombre: `Dieta - ${alumno.nombre}`,
      };

      let dietaId = dieta?.id ?? null;

      if (dieta) {
        const { error } = await supabase.from('dietas').update(payload).eq('id', dieta.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('dietas').insert(payload).select('id').single();
        if (error) throw error;
        dietaId = data.id;
      }

      // Only process if there's a file (new or updated)
      if (archivo_url && dietaId) {
        setStatus('processing');
        setStatusMsg('Extrayendo texto del archivo...');

        const { error: fnError } = await supabase.functions.invoke('procesar-dieta', {
          body: { dieta_id: dietaId },
        });

        if (fnError) {
          // Processing failed — dieta was saved, just extraction didn't work
          setStatus('error');
          setStatusMsg('Dieta guardada, pero no fue posible procesar el archivo. La IA usará la descripción hasta que se reprocese.');
          setTimeout(() => onSaved(), 3000);
          return;
        }

        setStatus('done');
        setStatusMsg('Texto extraído correctamente.');
        setTimeout(() => onSaved(), 1500);
      } else {
        // No file — just navigate back
        onSaved();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setStatus('error');
      setStatusMsg(msg);
    }
  }

  return (
    <div className="p-4 bg-gray-950 min-h-screen text-white max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          disabled={isBusy}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-white">
          {dieta ? 'Editar Dieta' : 'Nueva Dieta'}
        </h1>
      </div>

      {/* Student info */}
      <div className="mb-5 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-400">
        Alumno: <span className="text-white font-medium">{alumno.nombre} {alumno.apellido}</span>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">Descripción</label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          disabled={isBusy}
          rows={3}
          placeholder="Describe el plan nutricional..."
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 disabled:opacity-50 transition-colors resize-none"
        />
      </div>

      {/* File upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Archivo del Plan <span className="text-gray-600">(PDF o DOCX)</span>
        </label>

        {archivoFile ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-yellow-400/30 rounded-xl">
            <FileText size={18} className="text-yellow-400 shrink-0" />
            <span className="text-sm text-white truncate flex-1">{archivoFile.name}</span>
            <button
              onClick={removeFile}
              disabled={isBusy}
              className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <X size={16} />
            </button>
          </div>
        ) : dieta?.archivo_url ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl">
            <FileText size={18} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-400 truncate flex-1">Archivo actual guardado</span>
            <label className="cursor-pointer text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
              Reemplazar
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} disabled={isBusy} />
            </label>
          </div>
        ) : (
          <label className={`flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isBusy ? 'opacity-50 cursor-not-allowed border-gray-700' : 'border-gray-700 hover:border-yellow-400/50 hover:bg-gray-900/50'}`}>
            <Upload size={20} className="text-gray-500" />
            <span className="text-sm text-gray-500">Subir PDF o DOCX</span>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} disabled={isBusy} />
          </label>
        )}
      </div>

      {/* Status feedback */}
      {status !== 'idle' && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm ${
          status === 'done' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
          status === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
          'bg-yellow-400/10 border border-yellow-400/20 text-yellow-300'
        }`}>
          {(status === 'saving' || status === 'processing') && (
            <Loader2 size={16} className="animate-spin shrink-0" />
          )}
          {status === 'done' && <CheckCircle size={16} className="shrink-0" />}
          {status === 'error' && <AlertCircle size={16} className="shrink-0" />}
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isBusy || status === 'done'}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isBusy ? (
          <><Loader2 size={16} className="animate-spin" /> {status === 'processing' ? 'Procesando archivo...' : 'Guardando...'}</>
        ) : (
          <><Save size={16} /> {dieta ? 'Actualizar Dieta' : 'Guardar Dieta'}</>
        )}
      </button>
    </div>
  );
}
