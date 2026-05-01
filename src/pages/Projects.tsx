import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Trash2, Plus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Projects = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  useEffect(() => { document.title = "Projetos — Kreatix"; }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["all-projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-projects"] }); toast.success("Projeto excluído"); },
  });

  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">Meus Projetos</h1>
          <Button variant="hero" onClick={() => nav("/editor/new")}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : !data?.length ? (
          <div className="glass rounded-xl p-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display text-lg font-semibold mb-2">Nenhum projeto</h3>
            <p className="text-muted-foreground text-sm mb-5">Crie seu primeiro projeto.</p>
            <Button variant="hero" onClick={() => nav("/editor/new")}>Criar projeto</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((p) => (
              <div key={p.id} className="glass rounded-xl overflow-hidden hover:border-primary/50 transition-all group">
                <div className="h-32 gradient-bg" />
                <div className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{new Date(p.updated_at).toLocaleDateString("pt-BR")}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => nav(`/editor/${p.id}`)}>Abrir</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir projeto?")) del.mutate(p.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Projects;
