import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Image as ImgIcon, LayoutTemplate, Infinity as InfinityIcon, Sparkles, ShoppingBag, LayoutGrid, Megaphone } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_TEMPLATES = [
  { id: "instagram", name: "Post Instagram", icon: ImgIcon, format: "feed-1-1" as const },
  { id: "ad", name: "Anúncio", icon: Megaphone, format: "banner-16-9" as const },
  { id: "product", name: "Foto Produto", icon: ShoppingBag, format: "feed-1-1" as const },
  { id: "carousel", name: "Carrossel", icon: LayoutGrid, format: "feed-1-1" as const },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { document.title = "Dashboard — Kreatix"; }, []);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [pj, gen] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("generations").select("image_urls").eq("user_id", user!.id),
      ]);
      const totalImgs = (gen.data || []).reduce((acc, g) => acc + (g.image_urls?.length || 0), 0);
      return { projects: pj.count || 0, images: totalImgs };
    },
  });

  const create = useMutation({
    mutationFn: async ({ template, format }: { template?: string; format?: string }) => {
      const { data, error } = await supabase.from("projects").insert({
        user_id: user!.id,
        name: template ? `Novo ${template}` : "Novo Projeto",
        template,
        format: format || "feed-1-1",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      nav(`/editor/${p.id}`);
    },
    onError: () => toast.error("Erro ao criar projeto"),
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia"; if (h < 18) return "Boa tarde"; return "Boa noite";
  })();
  const name = profile?.name || user?.email?.split("@")[0] || "";

  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">{greeting}, {name} 👋</h1>
          <Button variant="hero" onClick={() => create.mutate({})}>
            <Plus className="w-4 h-4 mr-1" /> Novo Projeto
          </Button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total de Projetos", value: stats?.projects ?? "—", icon: FolderOpen },
            { label: "Imagens Geradas", value: stats?.images ?? "—", icon: ImgIcon },
            { label: "Templates Usados", value: 0, icon: LayoutTemplate },
            { label: "Créditos de API", value: "Ilimitado", icon: InfinityIcon },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick templates */}
        <h2 className="font-display text-xl font-semibold mb-3">Comece com um template</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => create.mutate({ template: t.name, format: t.format })}
              className="glass rounded-xl p-4 text-left hover:border-primary/50 transition-all hover:-translate-y-0.5 group"
            >
              <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center mb-3 group-hover:glow">
                <t.icon className="w-4 h-4 text-white" />
              </div>
              <div className="font-medium text-sm">{t.name}</div>
            </button>
          ))}
        </div>

        {/* Recent projects */}
        <h2 className="font-display text-xl font-semibold mb-3">Projetos recentes</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden hover:border-primary/50 transition-all group">
                <div className="h-32 gradient-bg relative">
                  {p.thumbnail_url && <img src={p.thumbnail_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{new Date(p.updated_at).toLocaleDateString("pt-BR")}</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => nav(`/editor/${p.id}`)}>Abrir Editor</Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg flex items-center justify-center glow animate-float">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">Nenhum projeto ainda</h3>
            <p className="text-muted-foreground text-sm mb-5">Crie seu primeiro projeto e comece a gerar criativos com IA</p>
            <Button variant="hero" onClick={() => create.mutate({})}>
              <Plus className="w-4 h-4 mr-1" /> Crie seu primeiro projeto
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Dashboard;
