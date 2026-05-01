const testimonials = [
  { name: "Marina S.", role: "Social Media", text: "Reduzi em 80% o tempo que gastava criando posts. Surreal." },
  { name: "Pedro L.", role: "E-commerce", text: "Geramos 200 anúncios em uma tarde. Vendas explodiram." },
  { name: "Camila R.", role: "Designer", text: "Uso como ponto de partida pra todos os clientes agora." },
  { name: "Rafael T.", role: "Founder", text: "Substituiu uma agência inteira no nosso fluxo." },
  { name: "Ana B.", role: "Marketing", text: "A estrutura em nodes é genial. Reutilizo tudo." },
  { name: "Lucas M.", role: "Agência", text: "Entrega de campanhas em 1/3 do tempo." },
  { name: "Júlia P.", role: "Creator", text: "Meu Instagram nunca foi tão consistente visualmente." },
  { name: "Tiago F.", role: "Startup", text: "Levantamos rodada usando criativos feitos aqui." },
];

const Card = ({ t }: { t: typeof testimonials[0] }) => (
  <div className="glass rounded-2xl p-6 w-80 shrink-0 mx-3">
    <p className="text-foreground/90 leading-relaxed mb-4">"{t.text}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold">
        {t.name[0]}
      </div>
      <div>
        <div className="font-medium text-sm">{t.name}</div>
        <div className="text-xs text-muted-foreground">{t.role}</div>
      </div>
    </div>
  </div>
);

export const Testimonials = () => (
  <section className="py-32 overflow-hidden">
    <div className="container mx-auto px-6 mb-16">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Amado por <span className="gradient-text">criadores</span>
        </h2>
        <p className="text-muted-foreground text-lg">Veja o que estão dizendo.</p>
      </div>
    </div>

    <div className="space-y-6">
      <div className="flex marquee" style={{ width: 'fit-content' }}>
        {[...testimonials, ...testimonials].map((t, i) => <Card key={i} t={t} />)}
      </div>
      <div className="flex marquee-reverse" style={{ width: 'fit-content' }}>
        {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((t, i) => <Card key={i} t={t} />)}
      </div>
    </div>
  </section>
);
