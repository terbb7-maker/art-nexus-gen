import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <nav className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild variant="hero" size="sm"><Link to="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/login">Entrar</Link></Button>
                <Button asChild variant="hero" size="sm"><Link to="/signup">Começar</Link></Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
