import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image as ImgIcon, Download } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const Gallery = () => {
  const { user } = useAuth();
  useEffect(() => { document.title = "Galeria — Kreatix"; }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["gallery", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("generations").select("*, projects(name)").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const images = (data || []).flatMap((g) =>
    (g.image_urls || []).map((url) => ({ url, gen: g }))
  );

  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-6">Galeria</h1>

        {isLoading ? (
          <div className="columns-2 md:columns-3 gap-4">
            {[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="mb-4 break-inside-avoid h-64 rounded-xl" />)}
          </div>
        ) : images.length === 0 ? (
          <div className="glass rounded-xl p-16 text-center">
            <ImgIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">Nenhum criativo ainda</h3>
            <p className="text-muted-foreground text-sm">Gere seu primeiro criativo no editor para vê-lo aqui.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 gap-4">
            {images.map((img, i) => (
              <motion.div key={img.url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="mb-4 break-inside-avoid relative group rounded-xl overflow-hidden glass">
                <img src={img.url} alt="" className="w-full block" loading="lazy" />
                <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <div className="text-xs text-foreground font-medium mb-1 truncate">
                    {(img.gen as any).projects?.name || "Sem projeto"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-2">{new Date(img.gen.created_at).toLocaleDateString("pt-BR")}</div>
                  <a href={img.url} download className="inline-flex items-center justify-center gap-1 text-xs px-2 py-1 rounded gradient-bg text-white">
                    <Download className="w-3 h-3" /> Baixar
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Gallery;
