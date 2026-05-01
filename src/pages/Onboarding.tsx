import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Shield, Sparkles, Check, Image as ImgIcon, ShoppingBag, LayoutGrid, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

const TEMPLATES = [
  { id: "instagram", name: "Post Instagram", desc: "Quadrado 1:1 para feed", icon: ImgIcon },
  { id: "ad", name: "Criativo de Anúncio", desc: "Para Meta e Google Ads", icon: Megaphone },
  { id: "product", name: "Foto de Produto", desc: "Imagens de e-commerce", icon: ShoppingBag },
  { id: "carousel", name: "Carrossel", desc: "Múltiplos slides", icon: LayoutGrid },
];

const Onboarding = () => {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [template, setTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Configuração — Kreatix";
    if (!loading && !user) nav("/login", { replace: true });
    if (profile?.onboarding_completed) nav("/dashboard", { replace: true });
  }, [loading, user, profile, nav]);

  const saveKey = async () => {
    if (!apiKey.trim() || apiKey.length < 10) {
      toast.error("Insira uma chave válida");
      return;
    }
    setSaving(true);
    try {
      await update.mutateAsync({
        [provider === "openai" ? "api_key_openai" : "api_key_gemini"]: apiKey.trim(),
        preferred_api: provider,
      });
      toast.success("Chave salva com segurança");
      setStep(3);
    } catch (e) {
      toast.error("Erro ao salvar chave");
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await update.mutateAsync({ onboarding_completed: true });
      nav("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="container mx-auto px-6 py-6">
        <Logo />
      </header>

      <section className="flex-1 container mx-auto px-6 py-8 max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <motion.div
                animate={{ scale: step === s ? 1.1 : 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s ? "gradient-bg text-white glow" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </motion.div>
              {s < 3 && <div className={`h-0.5 w-16 transition-all ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full gradient-bg glow animate-pulse-ring" />
                <div className="absolute inset-4 rounded-full gradient-bg glow flex items-center justify-center animate-float">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="font-display text-4xl font-bold mb-3">Vamos configurar sua conta</h1>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                Em 3 passos rápidos você estará pronto para gerar criativos profissionais com IA — posts, anúncios, fotos de produto e carrosséis.
              </p>
              <Button size="lg" variant="hero" onClick={() => setStep(2)}>Começar configuração</Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="font-display text-3xl font-bold mb-2 text-center">Conecte sua chave de API</h2>
              <p className="text-muted-foreground text-center mb-8">Escolha o provedor e cole sua chave. Você pode trocar depois nas configurações.</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {(["openai", "gemini"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      provider === p ? "border-primary bg-primary/5 glow" : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    <div className="font-display font-semibold mb-1">{p === "openai" ? "OpenAI" : "Google Gemini"}</div>
                    <div className="text-xs text-muted-foreground">{p === "openai" ? "DALL-E 3" : "Imagen 3"}</div>
                  </button>
                ))}
              </div>

              <label className="text-sm font-medium mb-2 block">Cole sua chave API aqui</label>
              <div className="relative mb-3">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === "openai" ? "sk-..." : "AIza..."}
                  className="pr-10 font-mono text-sm"
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                <Lock className="w-3.5 h-3.5" /> <Shield className="w-3.5 h-3.5" />
                Sua chave é armazenada com segurança e nunca é compartilhada
              </div>

              <Accordion type="single" collapsible className="mb-8">
                <AccordionItem value="how" className="border border-border rounded-xl px-4">
                  <AccordionTrigger className="text-sm">Como criar minha chave API?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-1.5 pt-2">
                    {provider === "openai" ? (
                      <>
                        <p>1. Acesse <span className="text-primary">platform.openai.com</span></p>
                        <p>2. Vá em <strong>API Keys</strong></p>
                        <p>3. Clique em <strong>Create new secret key</strong></p>
                      </>
                    ) : (
                      <>
                        <p>1. Acesse <span className="text-primary">aistudio.google.com</span></p>
                        <p>2. Clique em <strong>Get API Key</strong></p>
                        <p>3. Copie a chave gerada</p>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                <Button variant="hero" className="flex-1" disabled={saving} onClick={saveKey}>
                  {saving ? "Salvando..." : "Salvar e continuar"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="font-display text-3xl font-bold mb-2 text-center">Escolha seu primeiro template</h2>
              <p className="text-muted-foreground text-center mb-8">Vamos abrir o editor já com esse formato.</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {TEMPLATES.map((t) => (
                  <motion.button
                    key={t.id}
                    whileHover={{ y: -4 }}
                    onClick={() => setTemplate(t.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      template === t.id ? "border-primary bg-primary/5 glow" : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center mb-3">
                      <t.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="font-display font-semibold mb-1">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </motion.button>
                ))}
              </div>

              <Button variant="hero" size="lg" className="w-full" disabled={saving || !template} onClick={finish}>
                {saving ? "Carregando..." : "Entrar na plataforma"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
};

export default Onboarding;
