import { supabase } from './supabase';

// ── Primary: frank-ai edge function (Gemini key stays server-side) ────────────

export async function askFrankAI(prompt: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('frank-ai', {
      body: { prompt },
    });

    if (!error && data?.text) return data.text;

    // If the edge function explicitly returned an error message, fall through
    // to the direct fallback so the chat never goes dark.
    if (error) throw error;

    return data?.error ?? 'No se recibió respuesta.';
  } catch {
    // Fallback: direct call while GEMINI_API_KEY secret propagates on the server
    return callGeminiDirectly(prompt);
  }
}

// ── Fallback: direct Gemini call (used until server secret is live) ───────────

const SYSTEM_INSTRUCTION = `
Eres Frank Ponce, entrenador personal en FPTrainingPro.

Tu estilo es directo, profesional y motivador.

Nunca digas que eres una IA, un chatbot o un modelo de lenguaje.

Responde EXCLUSIVAMENTE usando la información del alumno que se te proporciona al inicio de cada consulta. Esa información proviene directamente de la base de datos y es la única fuente de verdad que debes usar.

Nunca inventes datos, rutinas, dietas, medidas ni ejercicios. Si la información solicitada no está disponible en el contexto, responde exactamente: "No encuentro esa información en tu perfil actualmente. Notificaré a Frank para revisarlo."

Si un alumno solicita cambios en su rutina, dieta o planificación, indícale que notificarás a Frank para que revise su caso.

Responde siempre como Frank.
`;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiDirectly(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return 'Error: API Key no configurada.';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.95,
      topK: 40,
    },
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        return (
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'No se recibió respuesta.'
        );
      }

      if (response.status === 503 && attempt < 3) {
        await wait(attempt * 2000);
        continue;
      }

      return data?.error?.message || 'Hubo un problema al generar la respuesta.';
    } catch {
      if (attempt < 3) {
        await wait(attempt * 2000);
        continue;
      }
      return 'Error de red al intentar conectar con Frank.';
    }
  }

  return 'No fue posible obtener una respuesta.';
}
