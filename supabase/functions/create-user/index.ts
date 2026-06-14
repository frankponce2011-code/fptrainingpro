import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey);
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("perfiles")
      .select("rol, id")
      .eq("id", caller.id)
      .maybeSingle();

    if (!callerProfile || !["administrador", "entrenador_administrador", "entrenador"].includes(callerProfile.rol)) {
      return new Response(JSON.stringify({ error: "Sin permisos para crear usuarios" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, nombre, apellido, edad, estatura, sexo, rol, foto_url, entrenador_id } = body;

    if (!email || !password || !nombre || !apellido) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for ghost auth user (auth user without profile)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const ghostUser = existingUsers?.users?.find((u) => u.email === normalizedEmail);
    if (ghostUser) {
      const { data: existingProfile } = await supabaseAdmin
        .from("perfiles")
        .select("id")
        .eq("id", ghostUser.id)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "Ya existe un usuario registrado con ese correo electrónico" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await supabaseAdmin.auth.admin.deleteUser(ghostUser.id);
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!newUser.user) {
      return new Response(JSON.stringify({ error: "No se pudo crear el usuario" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolvedEntrenadorId =
      callerProfile.rol === "entrenador"
        ? callerProfile.id
        : (entrenador_id || null);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("perfiles")
      .insert({
        id: newUser.user.id,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        edad: edad ? parseInt(edad) : null,
        estatura: estatura ? parseFloat(estatura) : null,
        sexo: sexo || "masculino",
        rol: rol || "alumno",
        foto_url: foto_url || null,
        entrenador_id: resolvedEntrenadorId,
      })
      .select()
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user: newUser.user, profile }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
