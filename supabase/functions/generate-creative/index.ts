import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FORMAT_MAP: Record<string, { hint: string; openaiSize: string; w: number; h: number }> = {
  "feed-1-1":       { hint: "square 1:1 ratio, Instagram feed post", openaiSize: "1024x1024", w: 1024, h: 1024 },
  "Feed 1:1":       { hint: "square 1:1 ratio, Instagram feed post", openaiSize: "1024x1024", w: 1024, h: 1024 },
  "stories-9-16":   { hint: "vertical 9:16 ratio, Instagram story",  openaiSize: "1024x1792", w: 576,  h: 1024 },
  "Stories 9:16":   { hint: "vertical 9:16 ratio, Instagram story",  openaiSize: "1024x1792", w: 576,  h: 1024 },
  "banner-16-9":    { hint: "horizontal 16:9 banner",                 openaiSize: "1792x1024", w: 1024, h: 576 },
  "Banner 16:9":    { hint: "horizontal 16:9 banner",                 openaiSize: "1792x1024", w: 1024, h: 576 },
  "linkedin":       { hint: "LinkedIn post horizontal",               openaiSize: "1792x1024", w: 1024, h: 536 },
  "LinkedIn 1.91:1":{ hint: "LinkedIn post horizontal",               openaiSize: "1792x1024", w: 1024, h: 536 },
  "flyer-a4":       { hint: "vertical A4 flyer",                       openaiSize: "1024x1792", w: 794,  h: 1123 },
  "Flyer A4":       { hint: "vertical A4 flyer",                       openaiSize: "1024x1792", w: 794,  h: 1123 },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function uploadImage(
  client: SupabaseClient,
  userId: string,
  projectId: string | null,
  index: number,
  bytes: Uint8Array,
  mimeType: string,
  ext: string,
): Promise<string | null> {
  const fileName = `${userId}/${projectId || "misc"}/${Date.now()}_${index}.${ext}`;
  const { error: upErr } = await client.storage
    .from("creatives")
    .upload(fileName, bytes, { contentType: mimeType, upsert: true });
  if (upErr) {
    console.error("Storage upload error:", upErr.message);
    return null;
  }
  const { data: { publicUrl } } = client.storage.from("creatives").getPublicUrl(fileName);
  return publicUrl;
}

// ============ Validators (used by /test endpoint) ============
async function validateOpenAIKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return { ok: false, error: e.error?.message || `HTTP ${r.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

async function validateGeminiKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
      },
    );
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return { ok: false, error: e.error?.message || `HTTP ${r.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

// ============ Generators ============
async function generateWithOpenAI(opts: {
  client: SupabaseClient;
  apiKey: string;
  prompt: string;
  size: string;
  count: number;
  userId: string;
  projectId: string | null;
  logs: string[];
}): Promise<{ images: string[]; error?: string }> {
  const images: string[] = [];
  for (let i = 0; i < opts.count; i++) {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.apiKey}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: opts.prompt,
        n: 1,
        size: opts.size,
        quality: "standard",
        response_format: "b64_json",
      }),
    });
    if (!r.ok) {
      const errorData = await r.json().catch(() => ({}));
      const msg = errorData.error?.message || `HTTP ${r.status}`;
      opts.logs.push(`OpenAI image ${i} failed: ${msg}`);
      return { images, error: `OpenAI error: ${msg}` };
    }
    const data = await r.json();
    const b64 = data.data[0].b64_json;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const url = await uploadImage(opts.client, opts.userId, opts.projectId, i, bytes, "image/png", "png");
    if (url) images.push(url);
    opts.logs.push(`OpenAI image ${i + 1}/${opts.count} ok`);
  }
  return { images };
}

async function enhancePromptWithGemini(apiKey: string, userPrompt: string, formatHint: string, logs: string[]): Promise<string> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert prompt engineer for AI image generation.
Transform this brief into a detailed, vivid image generation prompt in English.
Brief: "${userPrompt}"
Format context: ${formatHint}
Output ONLY the image generation prompt, nothing else. Make it detailed, professional, for commercial advertising. Max 200 words.`,
            }],
          }],
        }),
      },
    );
    if (!res.ok) {
      const errBody = await res.text();
      logs.push(`Gemini enhancement failed (${res.status}): ${errBody.substring(0, 200)}`);
      return userPrompt;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) {
      logs.push("Gemini enhancement ok");
      return text;
    }
    logs.push("Gemini enhancement returned empty text");
    return userPrompt;
  } catch (e) {
    logs.push(`Gemini fetch error: ${e instanceof Error ? e.message : String(e)}`);
    return userPrompt;
  }
}

async function generateWithGemini(opts: {
  client: SupabaseClient;
  apiKey: string;
  rawPrompt: string;
  formatHint: string;
  format: string;
  count: number;
  userId: string;
  projectId: string | null;
  logs: string[];
}): Promise<{ images: string[]; error?: string }> {
  const images: string[] = [];
  const enhanced = await enhancePromptWithGemini(opts.apiKey, opts.rawPrompt, opts.formatHint, opts.logs);
  const fmt = FORMAT_MAP[opts.format] || FORMAT_MAP["feed-1-1"];
  const basePrompt = encodeURIComponent(`${enhanced}, professional marketing creative, ${opts.formatHint}, commercial advertising`);

  for (let i = 0; i < opts.count; i++) {
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://image.pollinations.ai/prompt/${basePrompt}?width=${fmt.w}&height=${fmt.h}&seed=${seed}&model=flux&nologo=true&enhance=true`;
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      opts.logs.push(`Pollinations image ${i} failed: HTTP ${imgResponse.status}`);
      continue;
    }
    const buf = new Uint8Array(await imgResponse.arrayBuffer());
    const url = await uploadImage(opts.client, opts.userId, opts.projectId, i, buf, "image/jpeg", "jpg");
    if (url) {
      images.push(url);
      opts.logs.push(`Pollinations image ${i + 1}/${opts.count} stored`);
    } else {
      images.push(imageUrl);
      opts.logs.push(`Pollinations image ${i + 1}/${opts.count} stored (direct URL fallback)`);
    }
  }

  if (images.length === 0) {
    return { images, error: "Pollinations não retornou nenhuma imagem." };
  }
  return { images };
}

// ============ Handler ============
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const logs: string[] = [];

  try {
    logs.push("1. Function started");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    logs.push("2. Supabase client created");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized", logs }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: "Auth failed", detail: userError?.message, logs }, 401);
    }
    logs.push(`3. User authenticated: ${user.id}`);

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("api_key_openai, api_key_gemini, preferred_api")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      return jsonResponse({ error: "Profile error", detail: profileError.message, logs }, 400);
    }
    if (!profile) {
      return jsonResponse({ error: "Profile not found", logs }, 404);
    }
    logs.push(`4. Profile loaded. openai=${!!profile.api_key_openai} gemini=${!!profile.api_key_gemini}`);

    const url = new URL(req.url);

    // ============ TEST ENDPOINT ============
    if (req.method === "GET" && url.pathname.endsWith("/test")) {
      const hasOpenAI = !!profile.api_key_openai;
      const hasGemini = !!profile.api_key_gemini;
      const [openaiCheck, geminiCheck] = await Promise.all([
        hasOpenAI ? validateOpenAIKey(profile.api_key_openai!) : Promise.resolve({ ok: false, error: "Não configurado" }),
        hasGemini ? validateGeminiKey(profile.api_key_gemini!) : Promise.resolve({ ok: false, error: "Não configurado" }),
      ]);
      return jsonResponse({
        preferred_api: profile.preferred_api || "openai",
        providers: {
          openai: { configured: hasOpenAI, valid: openaiCheck.ok, error: openaiCheck.ok ? null : openaiCheck.error },
          gemini: { configured: hasGemini, valid: geminiCheck.ok, error: geminiCheck.ok ? null : geminiCheck.error },
        },
      });
    }

    // ============ GENERATION ============
    const body = await req.json();
    const { prompt, format = "feed-1-1", projectId, provider } = body;
    logs.push(`5. Body parsed: prompt="${(prompt || "").substring(0, 60)}", format=${format}, provider=${provider || "(default)"}`);

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return jsonResponse({ error: "Prompt inválido", logs }, 400);
    }

    const requestedProvider = provider || profile.preferred_api || "openai";
    const fmt = FORMAT_MAP[format] || FORMAT_MAP["feed-1-1"];
    const enhancedPromptForOpenAI = `Professional marketing creative, ${prompt}, ${fmt.hint}, modern design, high quality commercial photography, vivid colors`;

    let imageUrls: string[] = [];
    let usedProvider = requestedProvider;
    let fallbackNotice: string | null = null;

    const tryProvider = async (p: string): Promise<{ images: string[]; error?: string }> => {
      if (p === "openai") {
        if (!profile.api_key_openai) return { images: [], error: "Configure sua chave OpenAI nas configurações" };
        logs.push("→ Trying OpenAI DALL-E 3");
        return generateWithOpenAI({
          client: supabaseClient, apiKey: profile.api_key_openai, prompt: enhancedPromptForOpenAI,
          size: fmt.openaiSize, count: 4, userId: user.id, projectId: projectId || null, logs,
        });
      }
      if (p === "gemini") {
        if (!profile.api_key_gemini) return { images: [], error: "Configure sua chave Gemini nas configurações" };
        logs.push("→ Trying Gemini (enhance) + Pollinations FLUX (image)");
        return generateWithGemini({
          client: supabaseClient, apiKey: profile.api_key_gemini, rawPrompt: prompt,
          formatHint: fmt.hint, format, count: 4, userId: user.id, projectId: projectId || null, logs,
        });
      }
      return { images: [], error: `Provider desconhecido: ${p}` };
    };

    const primary = await tryProvider(requestedProvider);
    imageUrls = primary.images;

    // Fallback: requested Gemini but it failed → try OpenAI if configured
    if (imageUrls.length === 0 && requestedProvider === "gemini" && profile.api_key_openai) {
      logs.push("Primary failed, falling back to OpenAI");
      const fb = await tryProvider("openai");
      if (fb.images.length > 0) {
        imageUrls = fb.images;
        usedProvider = "openai";
        fallbackNotice = `Gemini falhou (${primary.error || "sem imagens"}). Geramos com OpenAI como fallback.`;
      } else {
        return jsonResponse({
          error: `Gemini falhou: ${primary.error || "sem imagens"}. Fallback OpenAI também falhou: ${fb.error || "sem imagens"}`,
          logs,
        }, 500);
      }
    }

    if (imageUrls.length === 0) {
      return jsonResponse({ error: primary.error || "Nenhuma imagem foi gerada.", logs }, 500);
    }

    const { error: dbError } = await supabaseClient.from("generations").insert({
      project_id: projectId || null,
      user_id: user.id,
      prompt_used: prompt,
      format,
      provider: usedProvider,
      image_urls: imageUrls,
    });
    if (dbError) logs.push(`DB save error: ${dbError.message}`);
    else logs.push("Saved to generations table");

    return jsonResponse({
      success: true,
      images: imageUrls,
      imageUrls,
      count: imageUrls.length,
      provider: usedProvider,
      requestedProvider,
      fallback: fallbackNotice,
      format,
      logs,
    });
  } catch (error) {
    console.error("generate-creative error:", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Internal server error",
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      logs,
    }, 500);
  }
});
