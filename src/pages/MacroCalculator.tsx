import React, { useState } from 'react';
import { ArrowLeft, Calculator } from 'lucide-react';

type Props = {
  onClose: () => void;
};

export default function MacroCalculator({ onClose }: Props) {
  const [sexo, setSexo] = React.useState('Masculino');
  const [edad, setEdad] = React.useState('');
  const [peso, setPeso] = React.useState('');
  const [estatura, setEstatura] = React.useState('');
  const [actividad, setActividad] = React.useState('Moderadamente activo');
  const [objetivo, setObjetivo] = React.useState('Mantener peso');
  const [resultado, setResultado] = React.useState<any>(null);

  function calcularMacros(e: React.FormEvent) {
    e.preventDefault();
    if (!edad || !peso || !estatura) return;

    const edadNum = parseFloat(edad);
    const pesoNum = parseFloat(peso);
    const estaturaNum = parseFloat(estatura);

    // Mifflin-St Jeor
    let tmb = 0;
    if (sexo === 'Masculino') {
      tmb = 10 * pesoNum + 6.25 * estaturaNum - 5 * edadNum + 5;
    } else {
      tmb = 10 * pesoNum + 6.25 * estaturaNum - 5 * edadNum - 161;
    }

    // Factor de actividad
    const actividadMap: Record<string, number> = {
      'Sedentario': 1.2,
      'Ligeramente activo': 1.375,
      'Moderadamente activo': 1.55,
      'Muy activo': 1.725,
      'Extremadamente activo': 1.9,
    };
    const calorias = tmb * (actividadMap[actividad] || 1.55);

    // Ajuste por objetivo
    let caloriasFinales = calorias;
    if (objetivo === 'Bajar grasa') {
      caloriasFinales = calorias - 500;
    } else if (objetivo === 'Ganar músculo') {
      caloriasFinales = calorias + 300;
    }

    // Macros
    const proteina = (caloriasFinales * 0.3) / 4;
    const carbohidratos = (caloriasFinales * 0.4) / 4;
    const grasas = (caloriasFinales * 0.3) / 9;

    setResultado({
      calorias: Math.round(caloriasFinales),
      proteina: Math.round(proteina * 10) / 10,
      carbohidratos: Math.round(carbohidratos * 10) / 10,
      grasas: Math.round(grasas * 10) / 10,
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto page-enter">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Herramienta</p>
          <h2 className="text-lg font-bold text-white font-rajdhani">Calculadora de Macros</h2>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 overflow-y-auto pb-8">
        <div className="space-y-5">
          <div className="card p-5">
            <form onSubmit={calcularMacros} className="space-y-4">
              {/* Sexo */}
              <div>
                <label className="label">Sexo</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Masculino', 'Femenino'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSexo(s)}
                      className={`py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                        sexo === s
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-orange-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edad y Peso */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Edad (años)</label>
                  <input
                    type="number"
                    value={edad}
                    onChange={e => setEdad(e.target.value)}
                    placeholder="25"
                    className="input-field"
                    min="10"
                    max="100"
                  />
                </div>
                <div>
                  <label className="label">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={peso}
                    onChange={e => setPeso(e.target.value)}
                    placeholder="75"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Estatura */}
              <div>
                <label className="label">Estatura (cm)</label>
                <input
                  type="number"
                  value={estatura}
                  onChange={e => setEstatura(e.target.value)}
                  placeholder="175"
                  className="input-field"
                />
              </div>

              {/* Nivel de Actividad */}
              <div>
                <label className="label">Nivel de Actividad</label>
                <select value={actividad} onChange={e => setActividad(e.target.value)} className="input-field">
                  <option>Sedentario</option>
                  <option>Ligeramente activo</option>
                  <option>Moderadamente activo</option>
                  <option>Muy activo</option>
                  <option>Extremadamente activo</option>
                </select>
              </div>

              {/* Objetivo */}
              <div>
                <label className="label">Objetivo</label>
                <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className="input-field">
                  <option>Bajar grasa</option>
                  <option>Mantener peso</option>
                  <option>Ganar músculo</option>
                </select>
              </div>

              <button type="submit" className="btn-orange w-full flex items-center justify-center gap-2">
                <Calculator size={18} />
                Calcular Macros
              </button>
            </form>
          </div>

          {/* Resultados */}
          {resultado && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white font-rajdhani">Tu Plan de Macros</h3>

              {/* Calorías */}
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/30">
                <p className="text-sm text-orange-100 mb-1">Calorías Diarias</p>
                <p className="text-5xl font-bold font-rajdhani">{resultado.calorias}</p>
                <p className="text-xs text-orange-100 mt-2">kcal/día</p>
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-4 text-white shadow-lg">
                  <p className="text-xs text-red-100 font-semibold mb-2">PROTEÍNA</p>
                  <p className="text-2xl font-bold font-rajdhani">{resultado.proteina}</p>
                  <p className="text-[10px] text-red-100 mt-1">g/día (30%)</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-lg">
                  <p className="text-xs text-blue-100 font-semibold mb-2">CARBS</p>
                  <p className="text-2xl font-bold font-rajdhani">{resultado.carbohidratos}</p>
                  <p className="text-[10px] text-blue-100 mt-1">g/día (40%)</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-4 text-white shadow-lg">
                  <p className="text-xs text-yellow-100 font-semibold mb-2">GRASAS</p>
                  <p className="text-2xl font-bold font-rajdhani">{resultado.grasas}</p>
                  <p className="text-[10px] text-yellow-100 mt-1">g/día (30%)</p>
                </div>
              </div>

              {/* Barra visual */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-400 font-semibold mb-3">Distribución de Macros</p>
                <div className="flex rounded-full overflow-hidden h-6 bg-gray-700 shadow-lg">
                  <div style={{ width: '30%' }} className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-[10px] font-bold text-white">
                    30%
                  </div>
                  <div style={{ width: '40%' }} className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                    40%
                  </div>
                  <div style={{ width: '30%' }} className="bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center text-[10px] font-bold text-white">
                    30%
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Proteína</span>
                  <span>Carbohidratos</span>
                  <span>Grasas</span>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase">Objetivo</p>
                <p className="text-sm text-gray-300">
                  {objetivo === 'Bajar grasa' && '500 kcal menos que tu gasto diario para un déficit de 0.5kg/semana'}
                  {objetivo === 'Mantener peso' && 'Calorías mantenimiento. Ideal para recomposición corporal'}
                  {objetivo === 'Ganar músculo' && '300 kcal más que tu gasto diario para ganar 0.5kg/semana'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
