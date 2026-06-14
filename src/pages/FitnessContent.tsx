import { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, FileText, Download, Image, Trash2,
  Upload, CheckCircle2, AlertCircle, Newspaper,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type FitnessArticle = {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  archivo_url: string | null;
  created_at: string;
};

type Props = {
  onBack: () => void;
};

export default function FitnessContent({ onBack }: Props) {
  const { profile } = useAuth();
  const isAdmin = profile?.rol === 'entrenador_administrador';
  const [articles, setArticles] = useState<FitnessArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'upload'>('list');

  // Upload form state
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { loadArticles(); }, []);

  async function loadArticles() {
    setLoading(true);
    const { data } = await supabase
      .from('fitness_content')
      .select('*')
      .order('created_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  }

  async function handleUpload() {
    if (!titulo.trim()) { setSaveError('El titulo es obligatorio.'); return; }
    setSaving(true); setSaveError('');

    let imagen_url: string | null = null;
    let archivo_url: string | null = null;

    try {
      if (imagenFile) {
        const ext = imagenFile.name.split('.').pop();
        const path = `images/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('fitness-content').upload(path, imagenFile, { upsert: true });
        if (error) throw error;
        imagen_url = supabase.storage.from('fitness-content').getPublicUrl(path).data.publicUrl;
      }

      if (archivoFile) {
        const ext = archivoFile.name.split('.').pop();
        const path = `files/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('fitness-content').upload(path, archivoFile, { upsert: true });
        if (error) throw error;
        archivo_url = supabase.storage.from('fitness-content').getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from('fitness_content').insert({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        imagen_url,
        archivo_url,
        creado_por: profile?.id,
      });
      if (error) throw error;

      setSaveSuccess(true);
      setTitulo(''); setDescripcion(''); setImagenFile(null); setImagenPreview(null); setArchivoFile(null);
      loadArticles();
      setTimeout(() => { setSaveSuccess(false); setView('list'); }, 1200);
    } catch (err: unknown) {
      setSaveError((err as Error).message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(article: FitnessArticle) {
    setDeletingId(article.id);
    await supabase.from('fitness_content').delete().eq('id', article.id);
    setDeletingId(null);
    loadArticles();
  }

  // ── Upload form ──
  if (view === 'upload' && isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Contenido Fitness</p>
              <h2 className="text-sm font-bold text-white">Subir Contenido</h2>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-28 overflow-y-auto space-y-4">
          {saveError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
              <AlertCircle size={14} /> {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl p-3">
              <CheckCircle2 size={14} /> Contenido publicado correctamente
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Titulo *</label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Guia de Nutricion para Hipertrofia"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descripcion</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripcion breve del contenido..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Imagen de portada (opcional)</label>
            {imagenPreview && (
              <div className="mb-2 rounded-xl overflow-hidden" style={{ maxHeight: 180 }}>
                <img src={imagenPreview} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-dashed border-gray-600 rounded-xl text-sm text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400 cursor-pointer transition-colors">
              <Image size={16} />
              {imagenFile ? imagenFile.name : 'Seleccionar imagen'}
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setImagenFile(f); setImagenPreview(URL.createObjectURL(f)); }
                }}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Archivo adjunto — PDF (opcional)</label>
            <label className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-dashed border-gray-600 rounded-xl text-sm text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400 cursor-pointer transition-colors">
              <FileText size={16} />
              {archivoFile ? archivoFile.name : 'Seleccionar PDF'}
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={e => { const f = e.target.files?.[0]; if (f) setArchivoFile(f); }}
                className="hidden"
              />
            </label>
          </div>
        </main>

        <div className="sticky bottom-0 px-4 py-4 bg-gradient-to-t from-gray-950 to-transparent">
          <button
            onClick={handleUpload}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-base bg-yellow-400 hover:bg-yellow-500 text-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
          >
            {saving ? <span className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /> : <><Upload size={18} /> Publicar contenido</>}
          </button>
        </div>
      </div>
    );
  }

  // ── Article list ──
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Fitness</p>
              <h2 className="text-sm font-bold text-white">Contenido Fitness</h2>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setSaveError(''); setSaveSuccess(false); setView('upload'); }}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Subir Contenido
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto pb-8">
        {loading ? (
          <div className="text-center py-12"><span className="w-8 h-8 spinner mx-auto" /></div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Newspaper size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold mb-1">Sin contenido aun</p>
            {isAdmin ? (
              <p className="text-xs text-gray-500 mb-5">Sube el primer articulo usando el boton "Subir Contenido"</p>
            ) : (
              <p className="text-xs text-gray-500">Pronto habra contenido disponible para ti</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map(a => (
              <div
                key={a.id}
                className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700/50"
              >
                {a.imagen_url && (
                  <div className="w-full" style={{ maxHeight: 200, overflow: 'hidden' }}>
                    <img
                      src={a.imagen_url}
                      alt={a.titulo}
                      className="w-full object-cover"
                      style={{ maxHeight: 200 }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {!a.imagen_url && (
                      <div className="w-11 h-11 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                        <Newspaper size={20} className="text-yellow-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white mb-1">{a.titulo}</p>
                      {a.descripcion && (
                        <p className="text-xs text-gray-400 leading-relaxed mb-3">{a.descripcion}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-600">
                          {new Date(a.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {a.archivo_url && (
                          <a
                            href={a.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                              background: 'linear-gradient(135deg,rgba(250,204,21,0.15),rgba(245,158,11,0.08))',
                              border: '1.5px solid rgba(250,204,21,0.4)',
                              color: '#facc15',
                            }}
                          >
                            <Download size={12} /> Descargar
                          </a>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(a)}
                        disabled={deletingId === a.id}
                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors shrink-0 disabled:opacity-40"
                      >
                        {deletingId === a.id
                          ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                          : <Trash2 size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
