import { MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, slideLeft, slideRight, viewport } from "@/lib/animations";

const Location = () => {
  return (
    <section id="localizacao" className="py-24 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 uppercase tracking-tight">Nossa Localização</h2>
          <div className="w-24 h-1 bg-accent mx-auto mb-6" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">

          {/* Address Card — slides from left */}
          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <div className="relative p-8 rounded-2xl border border-white/10 h-full flex flex-col justify-center space-y-8">
              <div className="absolute inset-0 liquid-glass-dark rounded-2xl -z-10" />
              <div className="flex items-start space-x-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-sky-400 flex items-center justify-center shadow-lg flex-shrink-0">
                  <MapPin className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 tracking-wider text-white">Cobertura</h3>
                  <p className="text-white/70 leading-relaxed text-lg">
                    Atendimento especializado em todo o litoral de:<br />
                    <strong className="text-white font-semibold">PERNAMBUCO</strong><br />
                    <strong className="text-white font-semibold">PARAÍBA</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6 pt-8 border-t border-white/10 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-sky-400 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Navigation className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 tracking-wider text-white">Como Chegar</h3>
                  <a
                    href="https://wa.me/558193372621"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-sky-300 transition-colors underline text-lg"
                  >
                    Solicitar atendimento remoto
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Map — slides from right */}
          <motion.div
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="rounded-2xl overflow-hidden shadow-xl h-[400px]"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3731.234567890123!2d-41.0500000!3d-21.7500000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDQ1JzAwLjAiUyA0McKwMDMnMDAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1234567890123!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Magnavita Serviços Marítimos"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Location;
