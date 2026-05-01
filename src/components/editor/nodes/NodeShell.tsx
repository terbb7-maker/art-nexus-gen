import { Handle, Position, NodeProps } from "@xyflow/react";
import { ReactNode } from "react";

const HEADERS: Record<string, { color: string; bg: string }> = {
  copy: { color: "text-amber-400", bg: "from-amber-500/20 to-amber-500/5" },
  logo: { color: "text-primary", bg: "from-primary/20 to-primary/5" },
  photo: { color: "text-secondary", bg: "from-secondary/20 to-secondary/5" },
  results: { color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5" },
};

export const NodeShell = ({
  variant, title, icon, children, width = 280, hasTarget, hasSource = true,
}: { variant: keyof typeof HEADERS; title: string; icon: ReactNode; children: ReactNode; width?: number; hasTarget?: boolean; hasSource?: boolean }) => {
  const h = HEADERS[variant];
  return (
    <div className="glass rounded-xl shadow-elegant overflow-hidden border border-border/60" style={{ width }}>
      <div className={`bg-gradient-to-br ${h.bg} px-4 py-3 flex items-center gap-2 border-b border-border/60`}>
        <span className={h.color}>{icon}</span>
        <span className="font-display font-semibold text-sm">{title}</span>
      </div>
      <div className="p-4">{children}</div>
      {hasTarget && <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />}
      {hasSource && <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />}
    </div>
  );
};
