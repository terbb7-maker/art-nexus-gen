import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FORMAT_MAP: Record<string, { size: string; aspect: string; desc: string }> = {
  "feed-1-1": { size: "1024x1024", aspect: "1:1", desc: "Instagram feed square post" },
  "stories-9-16": { size: "1024x1792", aspect: "9:16", desc: "vertical Instagram/TikTok story" },
  "banner-16-9": { size: "1792x1024", aspect: "16:9", desc: "horizontal banner" },
  "linkedin": { size: "1792x1024", aspect: "1.91:1", desc: "LinkedIn landscape post" },
  "flyer-a4": { size: "1024x1792", aspect: "A4 portrait", desc: "vertical A4 flyer" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub;

    const body = await req.json();
    const { prompt, format = "feed-1-1", projectId, count = 4 } = body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Prompt inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile, error: pErr } = await supabase
      .from("profiles").select("api_key_openai, api_key_gemini, preferred_api").eq("id", userId).maybeSingle();
    if (pErr) throw pErr;

    const provider = profile?.preferred_api || "openai";
    const fmt = FORMAT_MAP[format] || FORMAT_MAP["feed-1-1"];
    const enhancedPrompt = `Professional marketing creative, ${fmt.desc} (${fmt.aspect}). ${prompt}. High quality, vibrant, eye-catching, clean composition, suitable for social media advertising.`;

    const imageUrls: string[] = [];
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (provider === "openai") {
      const apiKey = profile?.api_key_openai;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Configure sua chave OpenAI nas configurações" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      for (let i = 0; i < count; i++) {
        const r = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "dall-e-3", prompt: enhancedPrompt, n: 1, size: fmt.size, response_format: "b64_json" }),
        });
        if (!r.ok) {
          const err = await r.text();
          console.error("OpenAI error", err);
          return new Response(JSON.stringify({ error: "Falha ao gerar com OpenAI: " + err.slice(0, 200) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const data = await r.json();
        const b64 = data.data[0].b64_json;
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const path = `${userId}/${projectId || "misc"}/${Date.now()}_${i}.png`;
        const { error: upErr } = await admin.storage.from("creatives").upload(path, bytes, { contentType: "image/png", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = admin.storage.from("creatives").getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }
    } else {
      const apiKey = profile?.api_key_gemini;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Configure sua chave Gemini nas configurações" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: enhancedPrompt }],
          parameters: { sampleCount: count, aspectRatio: fmt.aspect.includes(":") ? fmt.aspect : "1:1" },
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        console.error("Gemini error", err);
        return new Response(JSON.stringify({ error: "Falha ao gerar com Gemini: " + err.slice(0, 200) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await r.json();
      const preds = data.predictions || [];
      for (let i = 0; i < preds.length; i++) {
        const b64 = preds[i].bytesBase64Encoded;
        if (!b64) continue;
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const path = `${userId}/${projectId || "misc"}/${Date.now()}_${i}.png`;
        const { error: upErr } = await admin.storage.from("creatives").upload(path, bytes, { contentType: "image/png", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = admin.storage.from("creatives").getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }
    }

    await admin.from("generations").insert({
      project_id: projectId || null, user_id: userId, prompt_used: enhancedPrompt, format, provider, image_urls: imageUrls,
    });

    return new Response(JSON.stringify({ images: imageUrls, provider, format }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-creative error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
