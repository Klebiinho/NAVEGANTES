import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, scaleIn, cardItem, staggerContainer, viewport } from "@/lib/animations";

const cardsStagger = staggerContainer(0.12, 0.1);

const contactCards = [
  {
    icon: Mail,
    title: "E-mail",
    href: "mailto:contato@navegantesdespachante.com.br",
    label: "contato@navegantesdespachante.com.br",
    className: "break-all",
  },
  {
    icon: Phone,
    title: "Telefone",
    href: "tel:+558193372621",
    label: "(81) 9.9337-2621",
    className: "",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    href: "https://wa.me/558193372621",
    label: "(81) 9.9337-2621",
    external: true,
    className: "",
  },
];

const Contact = () => {
  return (
    <section id="contato" className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Entre em Contato</h2>
          <div className="w-24 h-1 bg-accent mx-auto mb-6" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Estamos prontos para atendê-lo. Entre em contato conosco e tire todas as suas dúvidas.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <motion.div
          variants={cardsStagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12"
        >
          {contactCards.map(({ icon: Icon, title, href, label, external, className }) => (
            <motion.div
              key={title}
              variants={cardItem}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] } }}
            >
              <Card className="group hover:shadow-2xl transition-shadow duration-300 bg-card border-border h-full">
                <CardContent className="p-8 text-center space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.12, rotate: 5 }}
                    transition={{ duration: 0.25 }}
                    className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-accent/20 transition-colors duration-300"
                  >
                    <Icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-300" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-card-foreground">{title}</h3>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`text-muted-foreground hover:text-accent transition-colors duration-200 block ${className}`}
                  >
                    {label}
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Block */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center bg-[#001e3b] p-12 rounded-2xl shadow-2xl max-w-4xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Precisa de Ajuda com Serviços Marítimos?
          </h3>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Entre em contato agora mesmo pelo WhatsApp e receba atendimento personalizado
          </p>
          <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => window.open("https://wa.me/558193372621", "_blank")}
              className="text-lg px-8 py-6 font-semibold shadow-lg"
            >
              <MessageCircle className="mr-2" />
              Falar no WhatsApp
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;