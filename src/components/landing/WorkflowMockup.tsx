import { FileText, Image as ImageIcon, Camera, Sparkles } from "lucide-react";

const Node = ({ icon: Icon, title, color, children }: any) => (
  <div className="glass rounded-xl w-56 overflow-hidden">
    <div className={`px-3 py-2 flex items-center gap-2 text-xs font-medium border-b border-border ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {title}
    </div>
    <div className="p-3 text-xs text-muted-foreground">{children}</div>
  </div>
);

export const WorkflowMockup = () => (
  <div className="relative glass rounded-3xl p-8 dot-grid overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60 pointer-events-none" />
    <div className="relative grid grid-cols-3 gap-8 items-center min-h-[320px]">
      {/* Inputs */}
      <div className="space-y-4">
        <Node icon={FileText} title="Sua Copy" color="text-primary">
          "Lance da nova coleção de verão com 30% off..."
        </Node>
        <Node icon={ImageIcon} title="Sua Logo" color="text-secondary">
          logo-marca.svg
        </Node>
        <Node icon={Camera} title="Sua Foto" color="text-primary-glow">
          produto-01.jpg
        </Node>
      </div>

      {/* Center orb */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full gradient-bg animate-pulse-ring" />
          <div className="absolute inset-2 rounded-full gradient-bg opacity-60 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-6 rounded-full gradient-bg flex items-center justify-center glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="glass rounded-xl p-3">
        <div className="text-xs font-medium mb-2 flex items-center justify-between">
          <span>Resultados</span>
          <span className="px-1.5 py-0.5 rounded gradient-bg text-[10px] text-white">12</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-md bg-gradient-to-br from-primary/30 to-secondary/30 border border-border" />
          ))}
        </div>
      </div>
    </div>

    {/* Connection lines (decorative) */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(258 90% 66%)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);
