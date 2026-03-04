import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, slideLeft, slideRight, scaleIn, cardItem, staggerContainer, widthGrow, viewport } from "@/lib/animations";
import logo from "@/assets/navegantes-logo.png";

const values = [
  "Empresa séria e legalizada",
  "Especialização em trâmites marítimos",
  "Atendimento rápido e humanizado",
  "Conhecimento profundo das normas",
  "Compromisso com segurança",
  "Profissionalismo em cada etapa"
];

const valuesStagger = staggerContainer(0.1, 0.2);

const About = () => {
  return (
    <section id="sobre" className="relative py-24 bg-background overflow-hidden">
      {/* Marca d'água do Logo - Somente na parte branca do 'Sobre' */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
        <img src={logo} alt="" className="w-full max-w-[800px] object-contain select-none" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Sobre a Navegantes</h2>
            <motion.div variants={widthGrow} className="h-1 bg-accent mx-auto mb-6" />
          </motion.div>

          <div className="space-y-8 text-center md:text-left">
            <motion.p
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="text-xl text-foreground font-medium italic leading-relaxed"
            >
              Navegar é clareza, propósito e a tranquilidade de saber que tudo está em ordem para seguir.
            </motion.p>

            <motion.p
              variants={slideRight}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Aqui, tornamos sua experiência no universo náutico simples, ágil e livre de burocracia, seja para conquistar sua habilitação náutica ou regularizar a documentação da sua embarcação.
            </motion.p>

            <motion.p
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Contamos com instrutores qualificados e um despachante náutico experiente que cuida de cada detalhe para você.
              <br /><br />
              <span className="text-2xl font-marinha font-bold text-primary block mt-4">
                O vento que nos move é ver você pronto para zarpar. O resto, pode deixar com a gente.
              </span>
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
