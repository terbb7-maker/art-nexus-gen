import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { WorkflowMockup } from "./WorkflowMockup";

export const Hero = () => (
  <section className="relative pt-40 pb-24 overflow-hidden">
    <div className="absolute inset-0 dot-grid opacity-30" />
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
    <div className="absolute top-40 right-10 w-[400px] h-[400px] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

    <div className="container mx-auto px-6 relative">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-muted-foreground mb-8">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Criativos profissionais com IA — em segundos</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
          Gere criativos<br />
          <span className="gradient-text">visuais infinitos</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Conecte sua copy, sua logo e sua foto em um workflow visual.
          Deixe a IA gerar dezenas de criativos prontos para suas campanhas.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild variant="hero" size="xl">
            <Link to="/signup">
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="glow" size="xl">
            <a href="#features">Ver recursos</a>
          </Button>
        </div>
      </div>

      <div className="mt-20 max-w-5xl mx-auto">
        <WorkflowMockup />
      </div>
    </div>
  </section>
);
