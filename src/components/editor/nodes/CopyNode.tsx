import { NodeProps } from "@xyflow/react";
import { useState } from "react";
import { FileText, Wand2, Loader2 } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const CopyNode = ({ data }: NodeProps) => {
  const d = data as { value: string; onChange: (v: string) => void };
  const [enhancing, setEnhancing] = useState(false);

  const enhance = async () => {
    if (!d.value?.trim()) { toast.error("Escreva algo primeiro"); return; }
    setEnhancing(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("enhance-prompt", { body: { prompt: d.value } });
      if (error) throw error;
      if (res?.enhanced) { d.onChange(res.enhanced); toast.success("Copy melhorada"); }
    } catch (e) {
      toast.error("Erro ao melhorar");
    } finally { setEnhancing(false); }
  };

  return (
    <NodeShell variant="copy" title="Sua Copy" icon={<FileText className="w-4 h-4" />}>
      <Textarea
        value={d.value || ""}
        onChange={(e) => d.onChange(e.target.value)}
        placeholder="Descreva o criativo que você quer criar..."
        rows={4}
        maxLength={500}
        className="text-xs resize-none nodrag"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-muted-foreground">{(d.value || "").length}/500</span>
        <Button size="sm" variant="ghost" className="h-7 text-xs nodrag" onClick={enhance} disabled={enhancing}>
          {enhancing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
          Melhorar com IA
        </Button>
      </div>
    </NodeShell>
  );
};
