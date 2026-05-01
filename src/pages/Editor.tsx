import { useEffect, useCallback, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, addEdge,
  useNodesState, useEdgesState, Node, Edge, Connection, MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Save, Sparkles, ArrowLeft, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAppStore, FORMAT_LABELS, Format } from "@/store/useAppStore";
import { CopyNode } from "@/components/editor/nodes/CopyNode";
import { LogoNode, PhotoNode } from "@/components/editor/nodes/UploadNodes";
import { ProcessingNode } from "@/components/editor/nodes/ProcessingNode";
import { ResultsNode } from "@/components/editor/nodes/ResultsNode";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const nodeTypes = { copy: CopyNode, logo: LogoNode, photo: PhotoNode, processing: ProcessingNode, results: ResultsNode };

const buildEdges = (): Edge[] => {
  const style = { stroke: "hsl(var(--primary))", strokeWidth: 2 };
  const mark = { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" };
  return [
    { id: "e1", source: "copy", target: "processing", animated: true, style, markerEnd: mark },
    { id: "e2", source: "logo", target: "processing", animated: true, style, markerEnd: mark },
    { id: "e3", source: "photo", target: "processing", animated: true, style, markerEnd: mark },
    { id: "e4", source: "processing", target: "results", animated: true, style: { ...style, strokeDasharray: "6 4" }, markerEnd: mark },
  ];
};

const EditorInner = ({ projectId }: { projectId: string }) => {
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { selectedFormat, setFormat, setGenStatus, setResults, results, generationStatus } = useAppStore();
  const [name, setName] = useState("Novo Projeto");
  const [copy, setCopy] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [showKeyModal, setShowKeyModal] = useState(false);

  const isNew = projectId === "new";

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    enabled: !isNew && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Create new project automatically when entering /editor/new
  useEffect(() => {
    if (isNew && user) {
      (async () => {
        const { data, error } = await supabase.from("projects").insert({ user_id: user.id, name: "Novo Projeto", format: selectedFormat }).select().single();
        if (!error && data) nav(`/editor/${data.id}`, { replace: true });
      })();
    }
  }, [isNew, user, nav, selectedFormat]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setFormat((project.format as Format) || "feed-1-1");
      const cfg = project.node_config as { copy?: string; logoUrl?: string; photoUrl?: string } | null;
      if (cfg) {
        setCopy(cfg.copy || "");
        setLogoUrl(cfg.logoUrl);
        setPhotoUrl(cfg.photoUrl);
      }
      document.title = `${project.name} — Kreatix`;
    }
  }, [project, setFormat]);

  // Reset results when entering a new project
  useEffect(() => { setResults([]); setGenStatus("idle"); }, [projectId, setResults, setGenStatus]);

  const initialNodes: Node[] = useMemo(() => [
    { id: "copy", type: "copy", position: { x: 50, y: 80 }, data: { value: copy, onChange: setCopy } },
    { id: "logo", type: "logo", position: { x: 50, y: 280 }, data: { value: logoUrl, onChange: setLogoUrl } },
    { id: "photo", type: "photo", position: { x: 50, y: 480 }, data: { value: photoUrl, onChange: setPhotoUrl } },
    { id: "processing", type: "processing", position: { x: 410, y: 320 }, data: {}, draggable: false, selectable: false },
    { id: "results", type: "results", position: { x: 680, y: 220 }, data: {} },
  ], []); // eslint-disable-line

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  // Sync dynamic data into nodes
  useEffect(() => {
    setNodes((ns) => ns.map((n) => {
      if (n.id === "copy") return { ...n, data: { value: copy, onChange: setCopy } };
      if (n.id === "logo") return { ...n, data: { value: logoUrl, onChange: setLogoUrl } };
      if (n.id === "photo") return { ...n, data: { value: photoUrl, onChange: setPhotoUrl } };
      return n;
    }));
  }, [copy, logoUrl, photoUrl, setNodes]);

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)), [setEdges]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").update({
        name, format: selectedFormat, node_config: { copy, logoUrl, photoUrl } as any,
      }).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Projeto salvo"),
    onError: () => toast.error("Erro ao salvar"),
  });

  const generate = async () => {
    if (!copy.trim()) { toast.error("Adicione uma copy primeiro"); return; }
    const hasKey = profile?.preferred_api === "gemini" ? !!profile?.api_key_gemini : !!profile?.api_key_openai;
    if (!hasKey) { setShowKeyModal(true); return; }

    setResults([]);
    setGenStatus("analyzing");
    setTimeout(() => setGenStatus("composing"), 1500);
    setTimeout(() => setGenStatus("generating"), 3000);

    try {
      const { data, error } = await supabase.functions.invoke("generate-creative", {
        body: { prompt: copy, format: selectedFormat, projectId },
      });
      if (error) {
        const message = (error as any)?.context?.json?.error || (error as any)?.context?.error || error.message || "Erro ao gerar imagens";
        setGenStatus("error");
        toast.error(message);
        return;
      }
      if (data?.error) {
        setGenStatus("error");
        toast.error(data.error);
        return;
      }
      const imgs = (data?.images || data?.imageUrls || []) as string[];
      // staggered append
      for (let i = 0; i < imgs.length; i++) {
        await new Promise((r) => setTimeout(r, 250));
        useAppStore.getState().appendResult(imgs[i]);
      }
      setGenStatus("done");
      toast.success(`${imgs.length} criativos gerados!`);
    } catch (e: any) {
      setGenStatus("error");
      toast.error(e?.message || "Erro na geração");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border/60 flex items-center justify-between px-4 glass z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav("/dashboard")}><ArrowLeft className="w-4 h-4" /></Button>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="w-64 h-9 bg-transparent border-transparent hover:border-border focus:border-border font-display font-semibold" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
          <Button variant="hero" size="sm" onClick={generate} disabled={generationStatus === "generating" || generationStatus === "analyzing" || generationStatus === "composing"}>
            <Sparkles className="w-4 h-4 mr-1" /> Gerar Criativos
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <aside className="w-72 border-r border-border/60 p-4 overflow-y-auto bg-card/30">
          <h3 className="font-display font-semibold text-sm mb-3">Formato de Saída</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedFormat === f ? "gradient-bg text-white glow" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}>
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
          <h3 className="font-display font-semibold text-sm mb-3">Como funciona</h3>
          <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Escreva sua copy descritiva</li>
            <li>(Opcional) envie logo e foto</li>
            <li>Escolha o formato</li>
            <li>Clique em Gerar Criativos ⚡</li>
          </ol>
          <div className="mt-6 p-3 rounded-lg border border-primary/30 bg-primary/5 text-xs">
            <strong className="text-primary">Dica:</strong> use o botão <em>"Melhorar com IA"</em> dentro do nó de Copy para descrições mais ricas.
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 dot-grid relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ animated: true }}
            className="bg-transparent"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(240 15% 18%)" />
            <Controls className="!bg-card !border-border [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
          </ReactFlow>
        </div>
      </div>

      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-primary" /> Configure sua chave API</DialogTitle>
            <DialogDescription>
              Para gerar criativos, você precisa de uma chave OpenAI ou Google Gemini configurada nas suas configurações.
            </DialogDescription>
          </DialogHeader>
          <Button variant="hero" onClick={() => nav("/settings")}>Ir para Configurações</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Editor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <AppShell hideSidebar>
      <ReactFlowProvider>
        <EditorInner projectId={projectId!} />
      </ReactFlowProvider>
    </AppShell>
  );
};

export default Editor;
