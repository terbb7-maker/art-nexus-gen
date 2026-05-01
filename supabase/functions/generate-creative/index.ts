import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maps both internal slugs and human labels to a format hint + OpenAI size
const FORMAT_MAP: Record<string, { hint: string; size: string }> = {
  "feed-1-1": { hint: "square format 1:1, social media post", size: "1024x1024" },
  "Feed 1:1": { hint: "square format 1:1, social media post", size: "1024x1024" },
  "stories-9-16": { hint: "vertical format 9:16, Instagram story", size: "1024x1792" },
  "Stories 9:16": { hint: "vertical format 9:16, Instagram story", size: "1024x1792" },
  "banner-16-9": { hint: "horizontal banner 16:9", size: "1792x1024" },
  "Banner 16:9": { hint: "horizontal banner 16:9", size: "1792x1024" },
  "linkedin": { hint: "LinkedIn post format", size: "1792x1024" },
  "LinkedIn 1.91:1": { hint: "LinkedIn post format", size: "1792x1024" },
  "flyer-a4": { hint: "A4 flyer vertical format", size: "1024x1792" },
  "Flyer A4": { hint: "A4 flyer vertical format", size: "1024x1792" },
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

async function generateWithOpenAI(opts: {
  client: SupabaseClient;
  apiKey: string;
  prompt: string;
  size: string;
  count: number;
  userId: string;
  projectId: string | null;
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
      console.error("OpenAI error:", JSON.stringify(errorData));
      return { images, error: `OpenAI error: ${errorData.error?.message || "Unknown error"}` };
    }
    const data = await r.json();
    const b64 = data.data[0].b64_json;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const url = await uploadImage(opts.client, opts.userId, opts.projectId, i, bytes, "image/png", "png");
    if (url) images.push(url);
  }
  return { images };
}

async function generateWithGemini(opts: {
  client: SupabaseClient;
  apiKey: string;
  prompt: string;
  count: number;
  userId: string;
  projectId: string | null;
}): Promise<{ images: string[]; error?: string }> {
  const images: string[] = [];
  for (let i = 0; i < opts.count; i++) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${opts.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: opts.prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
            responseMimeType: "text/plain",
          },
        }),
      },
    );
    if (!r.ok) {
      const errorData = await r.json().catch(() => ({}));
      console.error("Gemini error:", JSON.stringify(errorData));
      const errMsg = errorData.error?.message || "Unknown error";
      return {
        images,
        error: `Gemini API error: ${errMsg}. Use uma chave do Google AI Studio (aistudio.google.com) com geração de imagens habilitada.`,
      };
    }
    const data = await r.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const b64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        const ext = mimeType.includes("png") ? "png" : "jpg";
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const url = await uploadImage(opts.client, opts.userId, opts.projectId, i, bytes, mimeType, ext);
        if (url) images.push(url);
        break;
      }
    }
  }
  if (images.length === 0) {
    return { images, error: "Gemini não retornou imagens. Sua chave pode não ter acesso à geração de imagens." };
  }
  return { images };
}

// Lightweight key validation — single cheap call per provider, no images generated
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
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("api_key_openai, api_key_gemini, preferred_api")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError || !profile) return jsonResponse({ error: "Profile not found" }, 404);

    const url = new URL(req.url);

    // ============ TEST ENDPOINT ============
    // GET /generate-creative/test — validates configured keys without generating images
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
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return jsonResponse({ error: "Prompt inválido" }, 400);
    }

    const requestedProvider = provider || profile.preferred_api || "openai";
    const fmt = FORMAT_MAP[format] || FORMAT_MAP["feed-1-1"];
    const enhancedPrompt = `Create a professional marketing creative: ${prompt}. Format: ${fmt.hint}. Style: modern, high quality, commercial advertising photography, vibrant colors, clean composition, professional design, suitable for social media advertising.`;

    let imageUrls: string[] = [];
    let usedProvider = requestedProvider;
    let fallbackNotice: string | null = null;

    const tryProvider = async (p: string): Promise<{ images: string[]; error?: string }> => {
      if (p === "openai") {
        if (!profile.api_key_openai) return { images: [], error: "Configure sua chave OpenAI nas configurações" };
        return generateWithOpenAI({
          client: supabaseClient, apiKey: profile.api_key_openai, prompt: enhancedPrompt,
          size: fmt.size, count: 4, userId: user.id, projectId: projectId || null,
        });
      }
      if (p === "gemini") {
        if (!profile.api_key_gemini) return { images: [], error: "Configure sua chave Gemini nas configurações" };
        return generateWithGemini({
          client: supabaseClient, apiKey: profile.api_key_gemini, prompt: enhancedPrompt,
          count: 4, userId: user.id, projectId: projectId || null,
        });
      }
      return { images: [], error: `Provider desconhecido: ${p}` };
    };

    const primary = await tryProvider(requestedProvider);
    imageUrls = primary.images;

    // Fallback: if requested provider was Gemini and it failed, try OpenAI
    if (imageUrls.length === 0 && requestedProvider === "gemini" && profile.api_key_openai) {
      console.log("Gemini failed, falling back to OpenAI");
      const fallback = await tryProvider("openai");
      if (fallback.images.length > 0) {
        imageUrls = fallback.images;
        usedProvider = "openai";
        fallbackNotice = `Gemini falhou (${primary.error || "sem imagens"}). Geramos com OpenAI como fallback.`;
      } else {
        return jsonResponse({
          error: `Gemini falhou: ${primary.error || "sem imagens"}. Fallback OpenAI também falhou: ${fallback.error || "sem imagens"}`,
        }, 500);
      }
    }

    if (imageUrls.length === 0) {
      return jsonResponse({ error: primary.error || "Nenhuma imagem foi gerada." }, 500);
    }

    await supabaseClient.from("generations").insert({
      project_id: projectId || null,
      user_id: user.id,
      prompt_used: enhancedPrompt,
      format,
      provider: usedProvider,
      image_urls: imageUrls,
    });

    return jsonResponse({
      success: true,
      images: imageUrls,
      imageUrls,
      count: imageUrls.length,
      provider: usedProvider,
      requestedProvider,
      fallback: fallbackNotice,
      format,
    });
  } catch (error) {
    console.error("generate-creative error:", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500);
  }
});
