import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { prompt, format = "feed-1-1", projectId, provider } = body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Prompt inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("api_key_openai, api_key_gemini, preferred_api")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedProvider = provider || profile.preferred_api || "openai";
    const fmt = FORMAT_MAP[format] || FORMAT_MAP["feed-1-1"];
    const enhancedPrompt = `Create a professional marketing creative: ${prompt}. Format: ${fmt.hint}. Style: modern, high quality, commercial advertising photography, vibrant colors, clean composition, professional design, suitable for social media advertising.`;

    const imageUrls: string[] = [];

    if (selectedProvider === "openai") {
      const apiKey = profile.api_key_openai;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Configure sua chave OpenAI nas configurações" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      for (let i = 0; i < 4; i++) {
        const r = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: fmt.size,
            quality: "standard",
            response_format: "b64_json",
          }),
        });
        if (!r.ok) {
          const errorData = await r.json().catch(() => ({}));
          console.error("OpenAI error:", JSON.stringify(errorData));
          return new Response(JSON.stringify({ error: `OpenAI error: ${errorData.error?.message || "Unknown error"}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const data = await r.json();
        const b64 = data.data[0].b64_json;
        const fileName = `${user.id}/${projectId || "misc"}/${Date.now()}_${i}.png`;
        const imageBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const { error: upErr } = await supabaseClient.storage
          .from("creatives")
          .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabaseClient.storage.from("creatives").getPublicUrl(fileName);
          imageUrls.push(publicUrl);
        }
      }
    } else if (selectedProvider === "gemini") {
      const apiKey = profile.api_key_gemini;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Configure sua chave Gemini nas configurações" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      for (let i = 0; i < 4; i++) {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: enhancedPrompt }] }],
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
          return new Response(JSON.stringify({
            error: `Gemini API error: ${errMsg}. Use uma chave do Google AI Studio (aistudio.google.com) com geração de imagens habilitada.`,
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const data = await r.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            const b64 = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            const ext = mimeType.includes("png") ? "png" : "jpg";
            const fileName = `${user.id}/${projectId || "misc"}/${Date.now()}_${i}.${ext}`;
            const imageBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const { error: upErr } = await supabaseClient.storage
              .from("creatives")
              .upload(fileName, imageBytes, { contentType: mimeType, upsert: true });
            if (!upErr) {
              const { data: { publicUrl } } = supabaseClient.storage.from("creatives").getPublicUrl(fileName);
              imageUrls.push(publicUrl);
            }
            break;
          }
        }
      }
    } else {
      return new Response(JSON.stringify({ error: `Provider desconhecido: ${selectedProvider}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem foi gerada. Verifique sua chave de API." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseClient.from("generations").insert({
      project_id: projectId || null,
      user_id: user.id,
      prompt_used: enhancedPrompt,
      format,
      provider: selectedProvider,
      image_urls: imageUrls,
    });

    return new Response(JSON.stringify({ success: true, images: imageUrls, imageUrls, count: imageUrls.length, provider: selectedProvider, format }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-creative error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
