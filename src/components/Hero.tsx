import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-background.png";
import { motion } from "framer-motion";
import { fadeUp, fadeIn, staggerContainer } from "@/lib/animations";

const heroStagger = staggerContainer(0.15, 0.2);

const Hero = () => {
  const scrollToServices = () => {
    const element = document.getElementById("servicos");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="inicio" className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background with Ken Burns effect */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: [0.25, 0.1, 0.25, 1.0] }}
          src={heroImage}
          alt="Serviços Marítimos"
          className="w-full h-full object-cover"
        />
        {/* Base blue overlay (solid/linear) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-primary"
        />
        {/* Black vignette (bottom to top) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center pt-20">
        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* Title block */}
          <motion.div variants={fadeUp} className="space-y-5">

            {/* Eyebrow label */}
            <motion.p
              variants={fadeUp}
              className="text-sm md:text-base tracking-[0.35em] uppercase text-accent font-semibold mb-2"
            >
              Navegantes Despachante Náutico
            </motion.p>

            {/* Main title — blended fonts */}
            <h1 className="leading-[1.08] tracking-tight">
              <span className="block text-5xl md:text-7xl lg:text-8xl font-extrabold text-white uppercase">
                O único
              </span>
              <span className="block text-4xl md:text-6xl lg:text-7xl font-light italic text-transparent bg-clip-text bg-gradient-to-r from-accent via-sky-300 to-white mt-1">
                despachante náutico
              </span>
              <span className="block text-3xl md:text-5xl lg:text-6xl font-bold text-white/90 mt-1 uppercase">
                que facilita sua jornada
              </span>
              <span className="block text-3xl md:text-5xl lg:text-6xl font-bold text-white/90 uppercase">
                rumo ao mar
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-white/70 max-w-xl mx-auto tracking-wide"
          >
            Habilitações, certificados e regularização de embarcações em Pernambuco e Paraíba.
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={fadeUp} className="flex justify-center pt-8">
            <button className="blob-btn" onClick={scrollToServices}>
              <span className="relative z-10 flex items-center">
                Conheça nossos Serviços
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 1.5 }}
                >
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.span>
              </span>
              <span className="blob-btn__inner">
                <span className="blob-btn__blobs">
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                </span>
              </span>
            </button>

            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="absolute w-0 h-0 hidden">
              <defs>
                <filter id="goo">
                  <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"></feGaussianBlur>
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="goo"></feColorMatrix>
                  <feBlend in2="goo" in="SourceGraphic" result="mix"></feBlend>
                </filter>
              </defs>
            </svg>
          </motion.div>


        </motion.div>
      </div>


    </section>
  );
};

export default Hero;