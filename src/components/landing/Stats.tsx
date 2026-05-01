import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 1100, label: "Usuários", prefix: "+" },
  { value: 800, label: "Projetos", prefix: "+" },
  { value: 10000, label: "Imagens Geradas", prefix: "+" },
  { value: 1000, label: "Vídeos Gerados", prefix: "+" },
];

const Counter = ({ target, prefix }: { target: number; prefix: string }) => {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const duration = 1800;
        const tick = () => {
          const p = Math.min((Date.now() - start) / duration, 1);
          setN(Math.floor(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        tick();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  const display = n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}${n >= 10000 ? 'mil' : 'k'}` : n.toString();
  return <div ref={ref} className="font-display text-4xl md:text-5xl font-bold gradient-text">{prefix}{display}</div>;
};

export const Stats = () => (
  <section className="py-20 border-y border-border/50">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <Counter target={s.value} prefix={s.prefix} />
            <div className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
