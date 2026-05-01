import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const perks = [
  "Geração ilimitada de criativos*",
  "Workflows visuais em nodes",
  "Suporte a OpenAI e Google Gemini",
  "Templates premium inclusos",
  "Galeria com histórico completo",
  "Download em alta resolução",
  "Suporte dedicado por email",
];

export const Pricing = () => (
  <section id="pricing" className="py-32 relative">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[600px] rounded-full bg-secondary/15 blur-[120px]" />
    </div>

    <div className="container mx-auto px-6 relative">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Um plano. <span className="gradient-text">Tudo incluso.</span>
        </h2>
        <p className="text-muted-foreground text-lg">Sem surpresas, sem upsells. Só criatividade.</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="relative">
          <div className="absolute -inset-px rounded-3xl gradient-bg opacity-70 blur-md" />
          <div className="relative glass rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Plano</div>
                <h3 className="font-display text-3xl font-bold">Creator</h3>
              </div>
              <div className="px-3 py-1 rounded-full gradient-bg text-xs text-white font-medium">Popular</div>
            </div>

            <div className="mb-8">
              <span className="font-display text-5xl font-bold">R$47</span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            <ul className="space-y-3 mb-8">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="hero" size="lg" className="w-full">
              <Link to="/signup">Começar Agora</Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">*Limitado pela sua chave de API.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
