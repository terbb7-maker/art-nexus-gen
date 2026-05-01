import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Image as ImgIcon, ShoppingBag, LayoutGrid, Megaphone, Smartphone, FileImage } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Format } from "@/store/useAppStore";

const TEMPLATES: { id: string; name: string; desc: string; icon: any; format: Format }[] = [
  { id: "instagram", name: "Post Instagram", desc: "Quadrado 1:1 para feed", icon: ImgIcon, format: "feed-1-1" },
  { id: "stories", name: "Stories Vertical", desc: "9:16 para Stories e Reels", icon: Smartphone, format: "stories-9-16" },
  { id: "ad", name: "Criativo de Anúncio", desc: "Banner para Meta e Google Ads", icon: Megaphone, format: "banner-16-9" },
  { id: "linkedin", name: "Post LinkedIn", desc: "Formato landscape 1.91:1", icon: FileImage, format: "linkedin" },
  { id: "product", name: "Foto de Produto", desc: "Imagem limpa para e-commerce", icon: ShoppingBag, format: "feed-1-1" },
  { id: "carousel", name: "Carrossel", desc: "Múltiplos slides Instagram", icon: LayoutGrid, format: "feed-1-1" },
  { id: "flyer", name: "Flyer A4", desc: "Material impresso vertical", icon: FileImage, format: "flyer-a4" },
];

const Templates = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { document.title = "Templates — Kreatix"; }, []);

  const create = useMutation({
    mutationFn: async (t: typeof TEMPLATES[number]) => {
      const { data, error } = await supabase.from("projects").insert({
        user_id: user!.id, name: t.name, template: t.id, format: t.format,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => nav(`/editor/${p.id}`),
  });

  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Templates</h1>
          <p className="text-muted-foreground">Comece com um modelo otimizado para seu objetivo.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => create.mutate(t)} className="glass rounded-xl p-6 text-left hover:border-primary/50 transition-all hover:-translate-y-1 group">
              <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:glow">
                <t.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display font-semibold mb-1">{t.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t.desc}</p>
              <Button size="sm" variant="outline" className="w-full">Usar template</Button>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Templates;
