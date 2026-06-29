import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Camera, X, Calculator } from 'lucide-react';
import { supabase, Profile, Evaluacion } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  alumno: Profile;
  evaluacion?: Evaluacion | null;
  onBack: () => void;
  onSaved: () => void;
};

const fieldGroups = [
  {
    title: 'Medidas Corporales',
    fields: [
      { key: 'peso', label: 'Peso (kg)' },
      { key: 'hombros', label: 'Hombros (cm)' },
      { key: 'pecho', label: 'Pecho (cm)' },
      { key: 'intercostal', label: 'Intercostal (cm)' },
      { key: 'cintura', label: 'Cintura (cm)' },
      { key: 'cadera_alta', label: 'Cadera Alta (cm)' },
      { key: 'gluteos', label: 'Gluteos (cm)' },
    ],
  },
  {
    title: 'Extremidades',
    fields: [
      { key: 'muslo_derecho', label: 'Muslo Derecho (cm)' },
      { key: 'muslo_izquierdo', label: 'Muslo Izquierdo (cm)' },
      { key: 'pantorrilla_derecha', label: 'Pantorrilla Derecha (cm)' },
      { key: 'pantorrilla_izquierda', label: 'Pantorrilla Izquierda (cm)' },
      { key: 'biceps_derecho_relajado', label: 'Biceps Derecho Relajado (cm)' },
      { key: 'biceps_derecho_contraido', label: 'Biceps Derecho Contraido (cm)' },
      { key: 'biceps_izquierdo', label: 'Biceps Izquierdo (cm)' },
    ],
  },
  {
    title: 'Pliegues Cutaneos',
    fields: [
      { key: 'pliegue_triceps', label: 'Pliegue Triceps (mm)' },
      { key: 'pliegue_biceps', label: 'Pliegue Bíceps (mm)' },
      { key: 'pliegue_subescapular', label: 'Pliegue Subescapular (mm)' },
      { key: 'pliegue_cresta_iliaca', label: 'Pliegue Cresta Iliaca (mm)' },
      { key: 'pliegue_supraespinal', label: 'Pliegue Supraespinal (mm)' },
      { key: 'pliegue_abdominal', label: 'Pliegue Abdominal (mm)' },
      { key: 'pliegue_muslo', label: 'Pliegue Muslo (mm)' },
      { key: 'pliegue_pantorrilla', label: 'Pliegue Pantorrilla (mm)' },
    ],
  },
];

type FormData = Record<string, string>;

type FormulaGrasa = 'manual' | 'ross_kerr' | 'slaughter' | 'yuhasz' | 'durnin_womersley';

function calcularGrasa(formula: FormulaGrasa, pliegues: Record<string, number | null>, sexo: string): number | null {
  const p = (key: string) => pliegues[key] ?? null;

  if (formula === 'durnin_womersley') {
  const b = p('pliegue_biceps');
  const t = p('pliegue_triceps');
  const s = p('pliegue_subescapular');
  const c = p('pliegue_cresta_iliaca');
  if (b === null || t === null || s === null || c === null) return null;

  const suma = b + t + s + c;

  // Constantes de ejemplo (17–29 años). Ajusta según tablas de edad/sexo.
  let cte, mult;
  if (sexo === 'femenino') {
    cte = 1.1599;
    mult = 0.0717;
  } else {
    cte = 1.1620;
    mult = 0.0630;
  }

  const densidad = cte - mult * Math.log10(suma);
  const porcentaje = (4.95 / densidad - 4.50) * 100;

  return Math.round(porcentaje * 10) / 10;
}

  if (formula === 'ross_kerr') {
    const vals = [p('pliegue_triceps'), p('pliegue_subescapular'), p('pliegue_cresta_iliaca'),
      p('pliegue_supraespinal'), p('pliegue_abdominal'), p('pliegue_muslo'), p('pliegue_pantorrilla')];
    if (vals.some(v => v === null)) return null;
    const suma = vals.reduce((a, b) => a! + b!, 0)!;
    return sexo === 'femenino'
      ? Math.round((0.1548 * suma + 3.58) * 10) / 10
      : Math.round((0.1051 * suma + 2.585) * 10) / 10;
  }

  if (formula === 'slaughter') {
    const t = p('pliegue_triceps');
    const s = p('pliegue_subescapular');
    if (t === null || s === null) return null;
    const suma = t + s;
    if (sexo === 'femenino') {
      return suma <= 35
        ? Math.round((1.33 * suma - 0.013 * suma * suma - 2.5) * 10) / 10
        : Math.round((0.546 * suma + 9.7) * 10) / 10;
    }
    return suma <= 35
      ? Math.round((1.21 * suma - 0.008 * suma * suma - 1.7) * 10) / 10
      : Math.round((0.783 * suma + 1.6) * 10) / 10;
  }

  if (formula === 'yuhasz') {
    const vals = [p('pliegue_triceps'), p('pliegue_subescapular'), p('pliegue_cresta_iliaca'),
      p('pliegue_abdominal'), p('pliegue_muslo'), p('pliegue_pantorrilla')];
    if (vals.some(v => v === null)) return null;
    const suma = vals.reduce((a, b) => a! + b!, 0)!;
    return sexo === 'femenino'
      ? Math.round((0.1429 * suma + 4.56) * 10) / 10
      : Math.round((0.097 * suma + 3.64) * 10) / 10;
  }

  return null;
}

export default function EvaluacionForm({ alumno, evaluacion, onBack, onSaved }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(evaluacion?.foto_url || null);
  const [notas, setNotas] = useState(evaluacion?.notas || '');
  const [fecha, setFecha] = useState(evaluacion?.fecha || new Date().toISOString().split('T')[0]);
  const [porcentajeGrasa, setPorcentajeGrasa] = useState(
    evaluacion?.porcentaje_grasa?.toString() || ''
  );
  const [formulaGrasa, setFormulaGrasa] = useState<FormulaGrasa>('manual');
  const [autoCalculado, setAutoCalculado] = useState(false);

  const initialData: FormData = {};
  fieldGroups.forEach(g => g.fields.forEach(f => {
    const val = evaluacion ? (evaluacion as Record<string, unknown>)[f.key] : null;
    initialData[f.key] = val != null ? String(val) : '';
  }));
  const [form, setForm] = useState<FormData>(initialData);

  // Auto-calculate fat % when formula or pliegues change
 useEffect(() => {
  if (formulaGrasa === 'manual') { 
    setAutoCalculado(false); 
    return; 
  }

  const pliegues: Record<string, number | null> = {};
  [
    'pliegue_triceps',
    'pliegue_subescapular',
    'pliegue_cresta_iliaca',
    'pliegue_supraespinal',
    'pliegue_abdominal',
    'pliegue_muslo',
    'pliegue_pantorrilla',
    'pliegue_biceps'
  ].forEach(k => {
    pliegues[k] = form[k] !== '' ? parseFloat(form[k]) : null;
  });

  const resultado = calcularGrasa(formulaGrasa, pliegues, alumno.sexo ?? 'masculino');

  if (resultado !== null) {
    setPorcentajeGrasa(String(resultado));
    setAutoCalculado(true);
  } else {
    setAutoCalculado(false);
  }
}, [formulaGrasa, form, alumno.sexo]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  }

  function setField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError('');
    setSaving(true);

    try {
      let foto_url = evaluacion?.foto_url || alumno?.foto_url || '';

      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop();
        const path = `${alumno.id}/eval-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, fotoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path);
        foto_url = urlData.publicUrl;
      }

      const numericFields: Record<string, number | null> = {};
      fieldGroups.forEach(g => g.fields.forEach(f => {
        const val = form[f.key];
        numericFields[f.key] = val !== '' ? parseFloat(val) : null;
      }));

      const data = {
        alumno_id: alumno.id,
        fecha,
        foto_url,
        notas,
        porcentaje_grasa: porcentajeGrasa !== '' ? parseFloat(porcentajeGrasa) : null,
        grasa_corporal: porcentajeGrasa !== '' ? parseFloat(porcentajeGrasa) : null,
        cargado_por: user?.id,
        ...numericFields,
      };

      if (evaluacion) {
        const { error: updateError } = await supabase
          .from('evaluaciones')
          .update(data)
          .eq('id', evaluacion.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('evaluaciones')
          .insert(data);
        if (insertError) throw insertError;
      }

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
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500/20 border border-blue-500 shrink-0 flex items-center justify-center">
              {alumno.foto_url ? (
                <img src={alumno.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-blue-400">{alumnoInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Evaluacion</p>
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
            Evaluacion guardada correctamente
          </div>
        )}

        {/* Fecha */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* Foto */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-400 mb-2">Foto del Alumno</label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
              {fotoPreview ? (
                <img src={fotoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera size={24} className="text-gray-600" />
              )}
            </div>
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 border-dashed rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-500 cursor-pointer transition-colors">
              <Camera size={16} />
              Subir foto
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
            {fotoPreview && (
              <button
                onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                className="text-gray-500 hover:text-red-400 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Secciones de campos */}
        {fieldGroups.map(group => (
          <div key={group.title} className="mb-5">
            <h3 className="text-sm font-bold text-white mb-3 font-rajdhani">{group.title}</h3>
            <div className="space-y-2.5">
              {group.fields.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <label className="text-xs text-gray-400 w-40 shrink-0">{field.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={form[field.key]}
                    onChange={e => setField(field.key, e.target.value)}
                    placeholder="--"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-yellow-400"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Composicion corporal + formula */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-white mb-3 font-rajdhani">Composicion Corporal</h3>

          {/* Formula selector */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
              <Calculator size={12} /> Formula de calculo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'manual', label: 'Manual' },
                { value: 'ross_kerr', label: 'Ross y Kerr' },
                { value: 'slaughter', label: 'Slaughter' },
                { value: 'yuhasz', label: 'Yuhasz' },
      { value: 'durnin_womersley', label: 'Durnin-Womersley' },
              ] as { value: FormulaGrasa; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormulaGrasa(opt.value)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    formulaGrasa === opt.value
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {formulaGrasa !== 'manual' && (
              <p className="text-[10px] text-gray-500 mt-1.5">
                {formulaGrasa === 'ross_kerr' && 'Usa 7 pliegues: Triceps, Subescapular, Cresta Iliaca, Supraespinal, Abdominal, Muslo, Pantorrilla'}
                {formulaGrasa === 'slaughter' && 'Usa 2 pliegues: Triceps + Subescapular'}
                {formulaGrasa === 'yuhasz' && 'Usa 6 pliegues: Triceps, Subescapular, Cresta Iliaca, Abdominal, Muslo, Pantorrilla'}
                {formulaGrasa === 'durnin_womersley' && 'Usa 4 pliegues: Bíceps, Triceps, Subescapular, Cresta Iliaca'}
              </p>
            )}
          </div>

          {/* % Grasa field */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400 w-40 shrink-0">% Grasa Corporal</label>
            <div className="flex-1 relative">
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={porcentajeGrasa}
                onChange={e => { setPorcentajeGrasa(e.target.value); setAutoCalculado(false); setFormulaGrasa('manual'); }}
                placeholder="--"
                className={`w-full border rounded-lg px-3 py-2 text-sm text-right focus:outline-none transition-colors ${
                  autoCalculado
                    ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-300 focus:border-yellow-400'
                    : 'bg-gray-800 border-gray-700 text-white focus:border-yellow-400'
                }`}
              />
            </div>
          </div>
          {autoCalculado && (
            <p className="text-[10px] text-yellow-400 mt-1 text-right flex items-center justify-end gap-1">
              <Calculator size={10} />
              Calculado con {formulaGrasa === 'ross_kerr' ? 'Ross y Kerr' : formulaGrasa === 'slaughter' ? 'Slaughter' : formulaGrasa === 'yuhasz' ? 'Yuhasz' : formulaGrasa === 'durnin_womersley' ? 'Durnin-Womersley' : 'Manual'
                }
            </p>
          )}
        </div>

        {/* Notas */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-400 mb-1">Notas</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400 resize-none"
            placeholder="Observaciones adicionales..."
          />
        </div>
      </main>

      {/* Boton guardar flotante */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-400/30 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Guardando...' : 'Guardar Evaluacion'}
        </button>
      </div>
    </div>
  );
}
