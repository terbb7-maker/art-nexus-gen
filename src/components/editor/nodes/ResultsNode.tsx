import { NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Image as ImgIcon, Download, Eye } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { Skeleton } from "@/components/ui/skeleton";

export const ResultsNode = (_: NodeProps) => {
  const results = useAppStore((s) => s.results);
  const status = useAppStore((s) => s.generationStatus);
  const generating = status === "generating" || status === "analyzing" || status === "composing";

  const downloadAll = async () => {
    for (let i = 0; i < results.length; i++) {
      const a = document.createElement("a");
      a.href = results[i]; a.download = `kreatix_${i}.png`; a.target = "_blank";
      document.body.appendChild(a); a.click(); a.remove();
    }
  };

  const hasContent = results.length > 0 || generating;

  return (
    <NodeShell variant="results" title="Resultados" icon={<ImgIcon className="w-4 h-4" />} width={380} hasTarget hasSource={false}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{results.length} imagens</span>
      </div>
      <div className="grid grid-cols-2 gap-2 nodrag">
        {generating && results.length === 0 && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded" />)}
        {results.map((url, i) => (
          <motion.div key={url + i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="relative group aspect-square rounded overflow-hidden bg-muted">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <a href={url} target="_blank" rel="noreferrer" className="p-1.5 rounded-full bg-background hover:bg-primary hover:text-white transition-colors">
                <Eye className="w-3.5 h-3.5" />
              </a>
              <a href={url} download={`kreatix_${i}.png`} className="p-1.5 rounded-full bg-background hover:bg-primary hover:text-white transition-colors">
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        ))}
        {!hasContent && [0,1,2,3].map((i) => (
          <div key={i} className="aspect-square rounded bg-muted/50 border border-dashed border-border" />
        ))}
      </div>
      {results.length > 0 && (
        <Button size="sm" variant="outline" className="w-full mt-3 nodrag" onClick={downloadAll}>
          <Download className="w-3.5 h-3.5 mr-1" /> Baixar Todas
        </Button>
      )}
    </NodeShell>
  );
};
