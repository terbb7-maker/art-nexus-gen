import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Preciso de uma chave de API própria?", a: "Sim. Você usa sua própria chave da OpenAI ou do Google Gemini, garantindo controle total sobre custos e privacidade. Te ensinamos como criar passo a passo." },
  { q: "Quantos criativos posso gerar?", a: "Não há limite imposto pela Kreatix. O limite é definido pela sua cota junto ao provedor de IA escolhido." },
  { q: "Os criativos são exclusivos?", a: "Cada geração é única, baseada na sua copy, sua logo e suas referências visuais. Nada é compartilhado entre usuários." },
  { q: "Posso usar comercialmente?", a: "Sim, todos os criativos gerados podem ser usados em campanhas comerciais. Confira sempre os termos do provedor de IA." },
  { q: "Tem cancelamento fácil?", a: "Sim. Você pode cancelar a qualquer momento direto no painel, sem fidelidade." },
];

export const FAQ = () => (
  <section id="faq" className="py-32">
    <div className="container mx-auto px-6 max-w-3xl">
      <div className="text-center mb-16">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Perguntas <span className="gradient-text">frequentes</span>
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`i${i}`} className="glass rounded-xl px-5 border-0">
            <AccordionTrigger className="text-left font-medium hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
