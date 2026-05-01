import { NodeProps } from "@xyflow/react";
import { useDropzone } from "react-dropzone";
import { Image as ImgIcon, Camera, Upload, X } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

const UploadNode = ({ data, variant, title, icon, helper, accept }: {
  data: { value?: string; onChange: (v: string | undefined) => void };
  variant: "logo" | "photo"; title: string; icon: React.ReactNode; helper?: string; accept: Record<string, string[]>;
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: false,
    onDrop: async (files) => {
      const f = files[0];
      if (!f || !user) return;
      setUploading(true);
      try {
        const path = `${user.id}/uploads/${Date.now()}_${f.name}`;
        const { error } = await supabase.storage.from("creatives").upload(path, f, { contentType: f.type });
        if (error) throw error;
        const { data: pub } = supabase.storage.from("creatives").getPublicUrl(path);
        data.onChange(pub.publicUrl);
        toast.success("Upload concluído");
      } catch (e) {
        toast.error("Erro no upload");
      } finally { setUploading(false); }
    },
  });

  return (
    <NodeShell variant={variant} title={title} icon={icon}>
      {data.value ? (
        <div className="relative nodrag">
          <img src={data.value} alt="" className="w-full h-32 object-contain rounded bg-muted" />
          <button onClick={() => data.onChange(undefined)} className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-destructive">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div {...getRootProps()} className={`nodrag border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}>
          <input {...getInputProps()} />
          <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{uploading ? "Enviando..." : "Arraste ou clique para enviar"}</p>
        </div>
      )}
      {helper && <p className="text-[10px] text-muted-foreground mt-2">{helper}</p>}
    </NodeShell>
  );
};

export const LogoNode = ({ data }: NodeProps) => (
  <UploadNode data={data as any} variant="logo" title="Sua Logo" icon={<ImgIcon className="w-4 h-4" />}
    accept={{ "image/png": [".png"], "image/svg+xml": [".svg"], "image/jpeg": [".jpg", ".jpeg"] }} />
);

export const PhotoNode = ({ data }: NodeProps) => (
  <UploadNode data={data as any} variant="photo" title="Sua Foto de Referência" icon={<Camera className="w-4 h-4" />}
    helper="Opcional — foto do produto ou referência visual"
    accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] }} />
);
