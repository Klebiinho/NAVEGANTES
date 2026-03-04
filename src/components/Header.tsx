import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/navegantes-logo.png";
import { Link } from "react-router-dom"; // Import Link from react-router-dom

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Check if header is over light background sections
      const overLightSection = ['sobre', 'contato'].some(id => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Header sits at the top, check if element occupies the header space (~40px down)
          return rect.top <= 40 && rect.bottom >= 40;
        }
        return false;
      });
      setIsLightMode(overLightSection);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const textColorClass = isLightMode ? "text-primary" : "text-primary-foreground";
  const hoverColorClass = isLightMode ? "hover:text-accent font-medium" : "hover:text-secondary";

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isLightMode ? 'border-black/5' : 'border-white/5'} ${isScrolled || isMobileMenuOpen ? "shadow-lg" : ""}`}
    >
      <div className={`absolute inset-0 -z-10 transition-all duration-500 ${(isScrolled || isMobileMenuOpen) ? (isLightMode ? "liquid-glass border-b border-black/5" : "liquid-glass-dark") : "bg-transparent"}`} />
      <nav className={`container mx-auto px-4 transition-all duration-500 ${isScrolled || isMobileMenuOpen ? "py-2" : "py-4"}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3"> {/* Use Link for logo */}
            <img src={logo} alt="Navegantes Despachante Náutico" className={`rounded-full transition-all duration-500 ${isScrolled || isMobileMenuOpen ? "h-9 w-9" : "h-12 w-12"}`} />
            <div className="flex flex-col">
              <h1 className={`${textColorClass} font-marinha font-bold text-xl md:text-2xl leading-tight whitespace-nowrap transition-colors duration-300`}>Navegantes</h1>
              <p className={`${textColorClass} font-marinha text-xs md:text-sm leading-tight whitespace-nowrap transition-colors duration-300`}>Despachante Náutico</p>
            </div>
          </Link>

          {/* ... desktop menu remains same ... */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection("inicio")} className={`${textColorClass} ${hoverColorClass} transition-colors duration-300`}>Início</button>
            <button onClick={() => scrollToSection("servicos")} className={`${textColorClass} ${hoverColorClass} transition-colors duration-300`}>Serviços</button>
            <button onClick={() => scrollToSection("sobre")} className={`${textColorClass} ${hoverColorClass} transition-colors duration-300`}>Sobre Nós</button>
            <button onClick={() => scrollToSection("avaliacoes")} className={`${textColorClass} ${hoverColorClass} transition-colors duration-300`}>Avaliações</button>
            <button onClick={() => scrollToSection("contato")} className={`${textColorClass} ${hoverColorClass} transition-colors duration-300`}>Contato</button>
            <Button variant="secondary" onClick={() => window.open("https://wa.me/558193372621", "_blank")} className="font-semibold">WhatsApp</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden ${textColorClass} transition-colors duration-300`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden mt-4 pb-4 space-y-4 border-t ${isLightMode ? 'border-primary/20' : 'border-primary-foreground/20'} pt-4 relative z-10`}>
            <button
              onClick={() => scrollToSection("inicio")}
              className={`block w-full text-left ${textColorClass} ${hoverColorClass} transition-colors duration-300`}
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection("servicos")}
              className={`block w-full text-left ${textColorClass} ${hoverColorClass} transition-colors duration-300`}
            >
              Serviços
            </button>
            <button
              onClick={() => scrollToSection("sobre")}
              className={`block w-full text-left ${textColorClass} ${hoverColorClass} transition-colors duration-300`}
            >
              Sobre Nós
            </button>
            <button
              onClick={() => scrollToSection("avaliacoes")}
              className={`block w-full text-left ${textColorClass} ${hoverColorClass} transition-colors duration-300`}
            >
              Avaliações
            </button>
            <button
              onClick={() => scrollToSection("contato")}
              className={`block w-full text-left ${textColorClass} ${hoverColorClass} transition-colors duration-300`}
            >
              Contato
            </button>
            {/* WhatsApp link */}
            <Button
              variant="secondary"
              onClick={() => window.open("https://wa.me/558193372621", "_blank")}
              className="w-full font-semibold"
            >
              WhatsApp
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;