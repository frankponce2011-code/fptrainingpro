import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, ArrowLeft, Trash2, ChevronRight } from 'lucide-react';
import { askFrankAI } from '../lib/aiService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Message = { role: 'user' | 'assistant'; text: string; };

type Category = {
  id: string;
  emoji: string;
  label: string;
  questions: string[];
};

type Screen = 'categories' | 'questions' | 'chat';

type StudentData = {
  hasEval: boolean;
  hasDieta: boolean;
  hasRutina: boolean;
  context: string;
};

// ── Construcción del contexto ─────────────────────────────────────────────────

async function buildStudentContext(profile: Profile): Promise<StudentData> {
  const lines: string[] = [];
  lines.push(`ALUMNO: ${profile.nombre} ${profile.apellido}`);
  if (profile.edad) lines.push(`Edad: ${profile.edad} años`);
  if (profile.sexo) lines.push(`Sexo: ${profile.sexo}`);
  if ((profile as any).estatura) lines.push(`Estatura: ${(profile as any).estatura} cm`);

  const [evalRes, dietaRes, rutinaRes] = await Promise.all([
    supabase.from('evaluaciones').select('*').eq('alumno_id', profile.id)
      .order('fecha', { ascending: false }).limit(2),
    supabase.from('dietas').select('*').eq('alumno_id', profile.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('rutinas_alumno').select('*').eq('alumno_id', profile.id)
      .eq('activa', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const evals = evalRes.data || [];
  const hasEval = evals.length > 0;
  const hasDieta = !!dietaRes.data;
  const hasRutina = !!rutinaRes.data;

  // ── Evaluaciones ──
  lines.push('\n=== MEDICIONES ANTROPOMÉTRICAS ===');
  if (hasEval) {
    const ev = evals[0];
    if (ev.fecha) lines.push(`Fecha: ${ev.fecha}`);
    if (ev.peso) lines.push(`Peso: ${ev.peso} kg`);
    if (ev.porcentaje_grasa) lines.push(`% Grasa: ${ev.porcentaje_grasa}%`);
    if (ev.grasa_corporal) lines.push(`Grasa corporal: ${ev.grasa_corporal}`);

    const medidas = [
      ['Hombros', ev.hombros], ['Pecho', ev.pecho],
      ['Cintura', ev.cintura], ['Cadera alta', ev.cadera_alta],
      ['Glúteos', ev.gluteos], ['Muslo derecho', ev.muslo_derecho],
      ['Muslo izquierdo', ev.muslo_izquierdo],
      ['Pantorrilla derecha', ev.pantorrilla_derecha],
      ['Pantorrilla izquierda', ev.pantorrilla_izquierda],
      ['Bíceps derecho relajado', ev.biceps_derecho_relajado],
      ['Bíceps derecho contraído', ev.biceps_derecho_contraido],
      ['Bíceps izquierdo', ev.biceps_izquierdo],
    ].filter(([_, v]) => v != null);
    if (medidas.length > 0) {
      lines.push('Medidas (cm):');
      medidas.forEach(([l, v]) => lines.push(`  ${l}: ${v} cm`));
    }

    const pliegues = [
      ['Tríceps', ev.pliegue_triceps], ['Subescapular', ev.pliegue_subescapular],
      ['Cresta ilíaca', ev.pliegue_cresta_iliaca], ['Supraespinal', ev.pliegue_supraespinal],
      ['Abdominal', ev.pliegue_abdominal], ['Muslo', ev.pliegue_muslo],
      ['Pantorrilla', ev.pliegue_pantorrilla],
    ].filter(([_, v]) => v != null);
    if (pliegues.length > 0) {
      lines.push('Pliegues cutáneos (mm):');
      pliegues.forEach(([l, v]) => lines.push(`  ${l}: ${v} mm`));
    }

    if (ev.notas) lines.push(`Notas: ${ev.notas}`);

    // Progreso
    if (evals.length > 1 && evals[1].peso && ev.peso) {
      const cambio = (ev.peso - evals[1].peso).toFixed(1);
      const signo = Number(cambio) > 0 ? '+' : '';
      lines.push(`Cambio de peso vs anterior: ${signo}${cambio} kg`);
    }
  } else {
    lines.push('Sin evaluaciones registradas.');
  }

  // ── Rutina ──
  lines.push('\n=== RUTINA DE ENTRENAMIENTO ===');
  const rutina = rutinaRes.data;
  if (hasRutina && rutina) {
    lines.push(`Nombre: ${rutina.nombre}`);
    if (rutina.descripcion) lines.push(`Descripción: ${rutina.descripcion}`);

    const { data: dias } = await supabase
      .from('rutina_alumno_dias')
      .select('id, numero_dia, nombre_dia')
      .eq('rutina_id', rutina.id)
      .order('numero_dia', { ascending: true });

    if (dias && dias.length > 0) {
      const diasConEj = await Promise.all(dias.map(async (dia) => {
        const { data: ejercicios } = await supabase
          .from('rutina_alumno_ejercicios')
          .select('series, repeticiones, tipo, grupo_serie, notas, descanso_segundos, ejercicio:ejercicio_id(nombre, grupo_muscular)')
          .eq('dia_id', dia.id)
          .order('orden', { ascending: true });
        return { dia, ejercicios: ejercicios || [] };
      }));

      diasConEj.forEach(({ dia, ejercicios }) => {
        lines.push(`\nDía ${dia.numero_dia}: ${dia.nombre_dia}`);
        ejercicios.forEach((ej: any) => {
          const nombre = ej.ejercicio?.nombre || 'Ejercicio';
          const grupo = ej.ejercicio?.grupo_muscular || '';
          const series = ej.series ? `${ej.series} series` : '';
          const reps = ej.repeticiones ? `x ${ej.repeticiones} reps` : '';
          const descanso = ej.descanso_segundos ? `descanso ${ej.descanso_segundos}s` : '';
          const tipo = ej.tipo !== 'serie' ? `[${ej.tipo}${ej.grupo_serie ? ` ${ej.grupo_serie}` : ''}]` : '';
          lines.push(`  • ${nombre} (${grupo}) ${series} ${reps} ${descanso} ${tipo}`.trim());
        });
      });
    } else {
      lines.push('La rutina no tiene días registrados aún.');
    }
  } else {
    lines.push('Sin rutina activa asignada.');
  }

  // ── Dieta ──
  lines.push('\n=== PLAN NUTRICIONAL ===');
  const dieta = dietaRes.data;
  if (hasDieta && dieta) {
    lines.push(`Nombre: ${dieta.nombre || 'Plan nutricional'}`);
    if (dieta.descripcion) lines.push(`Descripción: ${dieta.descripcion}`);
    if (dieta.fecha_fin) lines.push(`Válida hasta: ${dieta.fecha_fin}`);
    const contenido = dieta.texto_extraido || dieta.descripcion;
    if (contenido) lines.push(`Detalle: ${contenido.slice(0, 2000)}`);
    else lines.push('Contenido de dieta no disponible.');
  } else {
    lines.push('Sin dieta asignada actualmente.');
  }

  return { hasEval, hasDieta, hasRutina, context: lines.join('\n') };
}

// ── Categorías dinámicas ──────────────────────────────────────────────────────

function buildCategories(data: StudentData): Category[] {
  const cats: Category[] = [];

  if (data.hasRutina) {
    cats.push({
      id: 'rutina',
      emoji: '💪',
      label: 'Mi Rutina',
      questions: [
        '¿Cuál es mi rutina completa?',
        '¿Qué ejercicios tengo hoy?',
        '¿Qué peso aproximado debo usar en cada ejercicio?',
        '¿Cuánto tiempo de descanso necesito entre series?',
        '¿Cómo ejecuto correctamente cada ejercicio?',
        '¿Cuántos días entreno a la semana?',
      ],
    });
  }

  if (data.hasDieta) {
    cats.push({
      id: 'dieta',
      emoji: '🥗',
      label: 'Mi Dieta',
      questions: [
        '¿Cuántas calorías tengo asignadas?',
        '¿Qué puedo comer en el desayuno?',
        '¿Qué alternativas similares tengo si no tengo un alimento?',
        '¿Cuál es mi distribución de macros?',
        '¿Puedo comer algo diferente con las mismas calorías?',
        'Explícame mi dieta de forma sencilla',
      ],
    });
  }

  if (data.hasEval) {
    cats.push({
      id: 'evaluaciones',
      emoji: '📊',
      label: 'Mis Evaluaciones',
      questions: [
        '¿Cómo va mi progreso?',
        'Analiza mis medidas y dime en qué debo mejorar',
        '¿Cuál es mi diagnóstico actual?',
        '¿En qué zona corporal tengo más grasa?',
        '¿Estoy mejorando respecto a mi evaluación anterior?',
        '¿Qué debo hacer para mejorar mis resultados?',
      ],
    });
  }

  // Siempre disponible
  cats.push({
    id: 'libre',
    emoji: '💬',
    label: 'Pregunta libre',
    questions: [],
  });

  return cats;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(context: string, message: string): string {
  return `CONTEXTO DEL ALUMNO:
${context}

INSTRUCCIONES PARA FRANK:
Eres Frank, entrenador experto en FPTrainingPro. Responde de forma cercana, motivadora y práctica.
- Usa SOLO los datos del contexto. No inventes información.
- Si no encuentras el dato, dilo amablemente.
- Si preguntan por rutina, usa la sección RUTINA DE ENTRENAMIENTO.
- Si preguntan por dieta/calorías/macros, usa la sección PLAN NUTRICIONAL.
- Si preguntan por progreso/medidas, usa la sección MEDICIONES.
- Responde en español, de forma clara y concisa.

PREGUNTA: ${message}`;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AIChatModal() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleOpenEvent = () => handleOpen();
    window.addEventListener('open-frank-ai', handleOpenEvent);
    return () => window.removeEventListener('open-frank-ai', handleOpenEvent);
  }, []);

  useEffect(() => {
    if (!open || !profile || studentData !== null) return;
    setContextLoading(true);
    buildStudentContext(profile).then(data => {
      setStudentData(data);
      setCategories(buildCategories(data));
      setContextLoading(false);
    });
  }, [open, profile]);

  function handleOpen() {
    setOpen(true);
    setScreen('categories');
    setSelectedCategory(null);
    setMessages([]);
    setInput('');
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSelectCategory(cat: Category) {
    setSelectedCategory(cat);
    if (cat.id === 'libre') {
      setMessages([]);
      setScreen('chat');
    } else {
      setScreen('questions');
    }
  }

  function handleSelectQuestion(question: string) {
    setMessages([]);
    setInput('');
    setScreen('chat');
    sendMessage(question);
  }

  function handleBack() {
    if (screen === 'chat') {
      setScreen(selectedCategory?.id === 'libre' ? 'categories' : 'questions');
    } else if (screen === 'questions') {
      setScreen('categories');
    }
  }

  function handleClearChat() {
    setMessages([]);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !studentData) return;
    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const reply = await askFrankAI(buildPrompt(studentData.context, userMsg));
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error al conectar con Frank AI. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    await sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Header dinámico ──
  function renderHeader() {
    const showBack = screen !== 'categories';
    const title = screen === 'categories'
      ? 'Frank AI'
      : screen === 'questions'
      ? selectedCategory?.label || 'Preguntas'
      : selectedCategory?.label || 'Frank AI';

    return (
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors mr-1">
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center mr-1">
              <Sparkles size={14} className="text-gray-900" />
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm">{title}</p>
            {screen === 'categories' && (
              <p className="text-gray-500 text-[10px]">
                {contextLoading ? 'Cargando tu información...' : 'Tu asistente personal'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {screen === 'chat' && messages.length > 0 && (
            <button onClick={handleClearChat} className="text-gray-500 hover:text-red-400 transition-colors" title="Borrar chat">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!open && (
        <div
          onClick={handleOpen}
          className="fixed bottom-20 right-4 z-40 flex flex-col items-center gap-1.5 cursor-pointer max-w-[120px] transition-transform hover:scale-105 active:scale-95 animate-fadeIn"
          title="Frank AI"
        >
          {/* Avatar circular del entrenador */}
          <div className="w-14 h-14 rounded-full border-2 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.65)] relative overflow-hidden bg-gray-900 flex items-center justify-center shrink-0">
            <img 
              src="/frank_avatar.jpg" 
              alt="Frank AI" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.src = "https://twsmiqxywmsskxbejykb.supabase.co/storage/v1/object/public/avatars/LogoActual.jpg";
              }}
            />
            {/* Logo FP overlay */}
            <span className="absolute bottom-1 right-2 text-[9px] font-black text-yellow-400 tracking-tighter bg-black/40 px-1 py-0.5 rounded leading-none font-rajdhani">
              FP
            </span>
          </div>

          {/* Globo de texto (Speech Bubble) */}
          <div className="bg-[#0b1322] border border-yellow-400/40 text-white text-[9px] font-black px-2 py-1 rounded-xl text-center leading-normal shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative select-none font-rajdhani uppercase tracking-wider">
            {/* Triángulo apuntando hacia arriba */}
            <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-[#0b1322]" />
            ¿En qué puedo ayudarte hoy?
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg bg-gray-900 rounded-t-2xl flex flex-col"
            style={{ height: '78vh' }}
            onClick={e => e.stopPropagation()}
          >
            {renderHeader()}

            {/* ── Pantalla: Categorías ── */}
            {screen === 'categories' && (
              <div className="flex-1 overflow-y-auto p-4">
                {contextLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 animate-spin border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-gray-400 text-xs">Cargando tu información...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 text-xs mb-4 text-center">
                      ¡Hola {profile?.nombre}! ¿Sobre qué te ayudo hoy?
                    </p>
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleSelectCategory(cat)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors text-left"
                        >
                          <span className="text-2xl">{cat.emoji}</span>
                          <span className="flex-1 text-sm font-semibold text-white">{cat.label}</span>
                          <ChevronRight size={16} className="text-gray-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Pantalla: Preguntas predefinidas ── */}
            {screen === 'questions' && selectedCategory && (
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-gray-400 text-xs mb-4 text-center">
                  Selecciona una pregunta o escribe la tuya
                </p>
                <div className="space-y-2 mb-4">
                  {selectedCategory.questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectQuestion(q)}
                      className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-yellow-400/10 hover:border-yellow-400/40 border border-transparent rounded-2xl text-sm text-gray-300 hover:text-white transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Input para pregunta libre desde esta pantalla */}
                <div className="border-t border-gray-800 pt-4">
                  <p className="text-gray-500 text-xs mb-2">O escribe tu propia pregunta:</p>
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && input.trim()) {
                          handleSelectQuestion(input.trim());
                        }
                      }}
                      className="flex-1 bg-gray-800 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 placeholder-gray-500"
                      placeholder="Escribe aquí..."
                    />
                    <button
                      onClick={() => input.trim() && handleSelectQuestion(input.trim())}
                      disabled={!input.trim()}
                      className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 p-2.5 rounded-xl transition-colors"
                    >
                      <Send size={16} className="text-gray-900" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Pantalla: Chat ── */}
            {screen === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      Enviando tu pregunta...
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-yellow-400 text-gray-900 rounded-br-sm'
                          : 'bg-gray-800 text-white rounded-bl-sm'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input del chat */}
                <div className="p-4 border-t border-gray-800 flex gap-2 shrink-0">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-gray-800 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 placeholder-gray-500"
                    placeholder="Escribe otra pregunta..."
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 p-2.5 rounded-xl transition-colors"
                  >
                    <Send size={16} className="text-gray-900" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}