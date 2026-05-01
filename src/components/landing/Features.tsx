import { Maximize2, Layers, Repeat, LayoutTemplate, Workflow, Headphones } from "lucide-react";

const features = [
  { icon: Maximize2, title: "Geração em 4K", desc: "Imagens em altíssima resolução prontas para impressão e mídias premium." },
  { icon: Layers, title: "Criação em Escala", desc: "Gere dezenas de variações em um único clique para testar mais rápido." },
  { icon: Repeat, title: "Fluxos Reutilizáveis", desc: "Salve seus workflows e replique campanhas inteiras em segundos." },
  { icon: LayoutTemplate, title: "Templates Prontos", desc: "Comece com layouts profissionais de social, anúncios e carrossel." },
  { icon: Workflow, title: "Estrutura em Nodes", desc: "Editor visual onde cada bloco é um input controlável da geração." },
  { icon: Headphones, title: "Suporte Dedicado", desc: "Atendimento humano para tirar suas dúvidas e otimizar resultados." },
];

export const Features = () => (
  <section id="features" className="py-32 relative">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Tudo o que você precisa para <span className="gradient-text">criar mais</span>
        </h2>
        <p className="text-muted-foreground text-lg">
          Uma plataforma completa para transformar ideias em criativos profissionais.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="group glass rounded-2xl p-6 hover:border-primary/40 transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
