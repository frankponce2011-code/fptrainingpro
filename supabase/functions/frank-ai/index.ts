import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY no configurada en el servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.95,
        topK: 40,
      },
    };

    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No se recibió respuesta.";
        return new Response(
          JSON.stringify({ text }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (response.status === 503 && attempt < 3) {
        await wait(attempt * 2000);
        continue;
      }

      return new Response(
        JSON.stringify({ error: data?.error?.message || "Error al generar respuesta" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "No fue posible obtener respuesta tras varios intentos" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    console.error("Error en frank-ai:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
