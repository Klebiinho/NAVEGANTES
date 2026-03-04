import { Anchor, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/navegantes-logo.png";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return <footer className="bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Company Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Magnavita Logo" className="h-12 w-12 rounded-full" />
            <div className="flex items-center gap-2">
              <div>
                <h3 className="font-bold text-lg">Navegantes</h3>
                <p className="text-sm text-primary-foreground/80">Despachante Náutico</p>
              </div>

            </div>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Excelência e profissionalismo em serviços marítimos. Sua navegação, nossa missão.
          </p>
          <div className="flex items-center space-x-2 pt-2">
            <Anchor className="w-5 h-5 text-accent" />
            <span className="text-sm text-primary-foreground/80">Empresa legalizada e especializada</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-bold text-lg mb-4">Links Rápidos</h3>
          <ul className="space-y-2">
            <li>
              <button onClick={() => document.getElementById("inicio")?.scrollIntoView({
                behavior: "smooth"
              })} className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                Início
              </button>
            </li>
            <li>
              <button onClick={() => document.getElementById("servicos")?.scrollIntoView({
                behavior: "smooth"
              })} className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                Serviços
              </button>
            </li>
            <li>
              <button onClick={() => document.getElementById("sobre")?.scrollIntoView({
                behavior: "smooth"
              })} className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                Sobre Nós
              </button>
            </li>
            <li>
              <button onClick={() => document.getElementById("contato")?.scrollIntoView({
                behavior: "smooth"
              })} className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                Contato
              </button>
            </li>
            <li>
              <a href="https://www.instagram.com/navegantes_despachante" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                Instagram
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-bold text-lg mb-4">Fale Conosco</h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-2">
              <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <a href="mailto:contato@navegantesdespachante.com.br" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm break-all">
                contato@navegantesdespachante.com.br
              </a>
            </li>
            <li className="flex items-start space-x-2">
              <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <a href="tel:+558193372621" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                (81) 9 9337-2621
              </a>
            </li>
            <li className="pt-2">
              <h4 className="text-xs font-bold uppercase text-accent mb-1">Funcionamento</h4>
              <p className="text-sm text-primary-foreground/80">Todos os dias | 8H às 20H</p>
            </li>
            <li className="pt-2">
              <h4 className="text-xs font-bold uppercase text-accent mb-1">Cobertura</h4>
              <p className="text-sm text-primary-foreground/80">PERNAMBUCO | PARAÍBA</p>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/20 pt-8 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm text-primary-foreground/80">
              Copyright © 2026 Navegantes Despachante Náutico
            </p>
            <p className="text-xs text-primary-foreground/60 mt-1">
              Todos os direitos reservados | CNPJ: 47.990.202/0001-91
            </p>
          </div>
          <button onClick={() => window.open("https://wa.me/558193372621", "_blank")} className="text-sm text-accent hover:text-accent/80 transition-colors font-semibold">
            Fale conosco pelo WhatsApp
          </button>
        </div>
      </div>
    </div>

    {/* Decorative Wave */}
    <div className="h-1 bg-gradient-to-r from-accent via-accent/50 to-accent" />
  </footer>;
};
export default Footer;