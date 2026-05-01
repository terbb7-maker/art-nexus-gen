import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer className="border-t border-border/50 py-12 mt-20">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <Logo />
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            Criativos profissionais com IA. Workflows visuais, geração em escala.
          </p>
        </div>
        <div>
          <div className="font-medium mb-3 text-sm">Produto</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground">Recursos</a></li>
            <li><a href="#pricing" className="hover:text-foreground">Preços</a></li>
            <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3 text-sm">Empresa</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Sobre</a></li>
            <li><a href="#" className="hover:text-foreground">Blog</a></li>
            <li><a href="#" className="hover:text-foreground">Contato</a></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3 text-sm">Legal</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Termos</a></li>
            <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Kreatix. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);
