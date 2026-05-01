import { useEffect, useState } from "react";
import { Eye, EyeOff, Trash2, Check } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const ProviderRow = ({ provider, label, currentKey, isDefault, onSave, onDelete, onMakeDefault }: {
  provider: "openai" | "gemini"; label: string; currentKey?: string | null; isDefault: boolean;
  onSave: (k: string) => void; onDelete: () => void; onMakeDefault: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [show, setShow] = useState(false);
  const masked = currentKey ? `${currentKey.slice(0, 4)}••••${currentKey.slice(-4)}` : "Não configurado";

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-display font-semibold flex items-center gap-2">
            {label}
            {currentKey ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">Conectado</span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Não configurado</span>
            )}
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="radio" checked={isDefault} onChange={onMakeDefault} className="accent-primary" />
          Usar como padrão
        </label>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input type={show ? "text" : "password"} value={val} onChange={(e) => setVal(e.target.value)} placeholder={provider === "openai" ? "sk-..." : "AIza..."} className="pr-9 font-mono text-sm" />
            <button onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <Button size="sm" onClick={() => { if (val.length < 10) { toast.error("Chave inválida"); return; } onSave(val); setEditing(false); setVal(""); }}>Salvar</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setVal(""); }}>Cancelar</Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <code className="text-sm text-muted-foreground font-mono">{masked}</code>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{currentKey ? "Editar" : "Adicionar"}</Button>
            {currentKey && <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>}
          </div>
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [name, setName] = useState("");

  useEffect(() => { document.title = "Configurações — Kreatix"; }, []);
  useEffect(() => { if (profile?.name) setName(profile.name); }, [profile?.name]);

  return (
    <AppShell>
      <div className="p-8 max-w-3xl mx-auto space-y-10">
        <header><h1 className="font-display text-3xl font-bold">Configurações</h1></header>

        {/* Perfil */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Perfil</h2>
          <div className="glass rounded-xl p-5 space-y-4">
            <div>
              <Label className="mb-1.5 block">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input value={user?.email || ""} readOnly className="opacity-60" />
            </div>
            <Button variant="hero" onClick={async () => {
              await update.mutateAsync({ name });
              toast.success("Perfil atualizado");
            }}>
              <Check className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </div>
        </section>

        {/* Chaves */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-1">Chaves de API</h2>
          <p className="text-sm text-muted-foreground mb-4">Provedor padrão: <strong className="text-foreground capitalize">{profile?.preferred_api || "openai"}</strong></p>
          <div className="space-y-3">
            <ProviderRow
              provider="openai" label="OpenAI (DALL-E 3)"
              currentKey={profile?.api_key_openai}
              isDefault={profile?.preferred_api === "openai"}
              onSave={async (k) => { await update.mutateAsync({ api_key_openai: k }); toast.success("Chave OpenAI salva"); }}
              onDelete={async () => { await update.mutateAsync({ api_key_openai: "" }); toast.success("Removida"); }}
              onMakeDefault={async () => { await update.mutateAsync({ preferred_api: "openai" }); }}
            />
            <ProviderRow
              provider="gemini" label="Google Gemini (Imagen)"
              currentKey={profile?.api_key_gemini}
              isDefault={profile?.preferred_api === "gemini"}
              onSave={async (k) => { await update.mutateAsync({ api_key_gemini: k }); toast.success("Chave Gemini salva"); }}
              onDelete={async () => { await update.mutateAsync({ api_key_gemini: "" }); toast.success("Removida"); }}
              onMakeDefault={async () => { await update.mutateAsync({ preferred_api: "gemini" }); }}
            />
            <p className="text-xs text-muted-foreground px-1">
              Para geração de imagens, use uma chave do <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google AI Studio</a>. Certifique-se de que sua conta tem acesso à geração de imagens ativado.
            </p>
          </div>
        </section>

        {/* Plano */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Plano</h2>
          <div className="glass rounded-xl p-6 border border-primary/30 glow">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-display text-2xl font-bold">Creator</h3>
              <span className="text-2xl font-display font-bold gradient-text">R$47<span className="text-sm text-muted-foreground font-normal">/mês</span></span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground mb-5">
              <li>✦ Gerações ilimitadas (com sua chave API)</li>
              <li>✦ Todos os formatos e templates</li>
              <li>✦ Galeria e histórico completo</li>
              <li>✦ Editor visual em nodes</li>
            </ul>
            <Button variant="outline" className="w-full" disabled>Gerenciar assinatura</Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Settings;
