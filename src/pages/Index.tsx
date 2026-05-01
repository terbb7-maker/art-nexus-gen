import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Kreatix — Criativos visuais com IA em workflows visuais";
    const m = document.querySelector('meta[name="description"]');
    const desc = "Gere criativos profissionais (posts, anúncios, carrosséis) com IA usando um editor visual em nodes. Conecte sua copy, logo e fotos.";
    if (m) m.setAttribute("content", desc);
    else {
      const meta = document.createElement("meta");
      meta.name = "description"; meta.content = desc;
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
};

export default Index;
