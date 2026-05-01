import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Sparkles } from "lucide-react";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    document.title = "Dashboard — Kreatix";
    if (!loading && !user) nav("/login", { replace: true });
  }, [loading, user, nav]);

  if (loading || !user) return null;

  return (
    <main className="min-h-screen">
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>Sair</Button>
        </div>
      </header>

      <section className="container mx-auto px-6 py-20 text-center max-w-2xl">
        <div className="w-20 h-20 mx-auto rounded-2xl gradient-bg flex items-center justify-center glow mb-6 animate-float">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="font-display text-4xl font-bold mb-3">Bem-vindo à Kreatix 👋</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Sua conta está pronta. O editor de workflows visual chega na próxima atualização.
        </p>
        <div className="glass rounded-2xl p-6 text-left">
          <h2 className="font-display text-lg font-semibold mb-3">Próximos passos</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✦ Onboarding com setup da chave API (OpenAI / Gemini)</li>
            <li>✦ Editor de nodes visuais (React Flow)</li>
            <li>✦ Geração de criativos via Edge Function segura</li>
            <li>✦ Galeria, templates e configurações</li>
          </ul>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
