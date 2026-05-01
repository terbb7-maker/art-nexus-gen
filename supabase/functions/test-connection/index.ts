import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Step 1: Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ step: "auth", error: "No auth header" }, 400);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return json({ step: "auth", error: userError?.message || "Invalid token" }, 401);
    }

    // Step 2: Profile query
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return json({
        step: "profile_query",
        error: profileError.message,
        userId: user.id,
        hint: "Check if profiles table exists and has correct columns",
      }, 400);
    }

    if (!profile) {
      return json({
        step: "profile_query",
        error: "Profile row missing for this user",
        userId: user.id,
      }, 404);
    }

    // Step 3: Inspect columns (this project uses preferred_api, not preferred_provider)
    const geminiKeyValue = profile.api_key_gemini as string | null;
    const openaiKeyValue = profile.api_key_openai as string | null;

    // Step 4: Storage buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    return json({
      success: true,
      userId: user.id,
      profile: {
        hasGeminiKeyColumn: "api_key_gemini" in profile,
        hasOpenAIKeyColumn: "api_key_openai" in profile,
        hasPreferredApiColumn: "preferred_api" in profile,
        geminiKeyConfigured: !!geminiKeyValue,
        openaiKeyConfigured: !!openaiKeyValue,
        geminiKeyPreview: geminiKeyValue ? geminiKeyValue.substring(0, 8) + "..." : null,
        openaiKeyPreview: openaiKeyValue ? openaiKeyValue.substring(0, 8) + "..." : null,
        preferred_api: profile.preferred_api,
        onboarding_completed: profile.onboarding_completed,
        allColumns: Object.keys(profile),
      },
      storage: {
        hasCreativesBucket: buckets?.some((b) => b.name === "creatives") ?? false,
        buckets: buckets?.map((b) => b.name) ?? [],
        listError: bucketError?.message ?? null,
      },
    });
  } catch (error) {
    return json({
      step: "catch",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    }, 500);
  }
});
