import { Handle, Position, NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const STATUS_TEXT: Record<string, string> = {
  idle: "Pronto",
  analyzing: "Analisando inputs...",
  composing: "Compondo layout...",
  generating: "Gerando imagens...",
  done: "Concluído",
  error: "Erro",
};

export const ProcessingNode = (_: NodeProps) => {
  const status = useAppStore((s) => s.generationStatus);
  const active = status !== "idle" && status !== "done" && status !== "error";
  const isDone = status === "done";

  return (
    <div className="relative w-[180px] h-[180px] flex items-center justify-center">
      <div className={`absolute inset-0 rounded-full border-2 ${isDone ? "border-emerald-500/40" : "border-primary/40"} ${active ? "animate-pulse-ring" : ""}`} />
      <div className={`absolute inset-3 rounded-full border-2 ${isDone ? "border-emerald-500/60" : "border-secondary/60"} ${active ? "animate-pulse-ring" : ""}`} style={{ animationDelay: "0.5s" }} />
      <div className={`absolute inset-6 rounded-full ${isDone ? "bg-emerald-500" : "gradient-bg"} ${active ? "animate-pulse" : ""} glow flex items-center justify-center shadow-elegant`}>
        <Sparkles className={`w-10 h-10 text-white ${active ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-foreground bg-background/80 px-2 py-1 rounded-md">
        {STATUS_TEXT[status]}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
    </div>
  );
};
