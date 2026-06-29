import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import mammoth from "npm:mammoth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const { dieta_id } = await req.json();

    if (!dieta_id) {
      return new Response(
        JSON.stringify({
          error: "dieta_id requerido",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: dieta, error: dietaError } = await supabase
      .from("dietas")
      .select("id, archivo_url")
      .eq("id", dieta_id)
      .single();

    if (dietaError || !dieta) {
      throw new Error("Dieta no encontrada");
    }

    if (!dieta.archivo_url) {
      throw new Error("La dieta no tiene archivo asociado");
    }

    // Ejemplo:
    // https://xxxx.supabase.co/storage/v1/object/public/dietas/carpeta/archivo.docx

    const marker = "/storage/v1/object/public/dietas/";

    const index = dieta.archivo_url.indexOf(marker);

    if (index === -1) {
      throw new Error("archivo_url inválida");
    }

    const filePath = decodeURIComponent(
      dieta.archivo_url.substring(index + marker.length),
    );

    console.log("Ruta del archivo:", filePath);

    const { data: fileData, error: storageError } = await supabase.storage
      .from("dietas")
      .download(filePath);

    if (storageError || !fileData) {
      throw new Error(
        `No se pudo descargar el archivo: ${storageError?.message}`,
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();

    let textoExtraido = "";

    const lower = filePath.toLowerCase();

    if (lower.endsWith(".docx")) {
      const result = await mammoth.extractRawText({
        arrayBuffer,
      });

      textoExtraido = result.value;
    } else if (lower.endsWith(".doc")) {
      textoExtraido =
        "Los archivos .doc no son compatibles. Guarda la dieta como .docx.";
    } else if (lower.endsWith(".pdf")) {
      textoExtraido =
        "Extracción PDF pendiente de implementación.";
    } else {
      textoExtraido = "Formato de archivo no compatible.";
    }

    textoExtraido = textoExtraido
      .replace(/\s+/g, " ")
      .trim();

    const { error: updateError } = await supabase
      .from("dietas")
      .update({
        texto_extraido: textoExtraido,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id", dieta_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        chars: textoExtraido.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error(err);

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Error interno",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});