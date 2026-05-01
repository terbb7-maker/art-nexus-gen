import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Sparkles, FolderOpen, Image, LayoutTemplate, Settings, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/editor/new", label: "Novo Projeto", icon: Sparkles },
  { to: "/projects", label: "Meus Projetos", icon: FolderOpen },
  { to: "/gallery", label: "Galeria", icon: Image },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/settings", label: "Configurações", icon: Settings },
];

export const AppSidebar = () => {
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const nav = useNavigate();
  const loc = useLocation();

  const initial = (profile?.name || user?.email || "U")[0].toUpperCase();

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 border-r border-border/60 bg-sidebar flex flex-col">
      <div className="p-5">
        <Logo />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((it) => {
          const active = loc.pathname === it.to || (it.to !== "/dashboard" && loc.pathname.startsWith(it.to));
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active ? "gradient-bg text-white glow" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <it.icon className="w-4 h-4" />
              {it.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border/60">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="gradient-bg text-white text-xs font-semibold">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name || user?.email?.split("@")[0]}</p>
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Plano Creator</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); nav("/"); }}>
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>
    </aside>
  );
};
