import { motion } from "framer-motion";
import { Clock, Headset, ShieldCheck } from "lucide-react";
import { fadeUp, staggerContainer, cardItem, widthGrow, viewport } from "@/lib/animations";

const features = [
    {
        title: "AGILIDADE PROCESSUAL",
        description: "Documentação regularizada com rapidez, dentro do prazo estabelecido pela Marinha.",
        icon: Clock,
    },
    {
        title: "SUPORTE AO CLIENTE",
        description: "Você informado em todas as etapas do processo, com atendimento diário para dúvidas e informações.",
        icon: Headset,
    },
    {
        title: "SEGURANÇA JURÍDICA",
        description: "Com emissão de nota fiscal, proporcionamos segurança jurídica e proteção ao cliente.",
        icon: ShieldCheck,
    },
];

const gridVariants = staggerContainer(0.1, 0.2);

const WhyChooseUs = () => {
    return (
        <section className="py-24 bg-primary text-primary-foreground overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewport}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 uppercase tracking-tight">
                        Por que escolher a nossa acessoria náutica?
                    </h2>
                    <motion.div variants={widthGrow} className="h-1 bg-accent mx-auto mb-6" />
                </motion.div>

                <motion.div
                    variants={gridVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewport}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
                >
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={cardItem}
                                className="relative group p-8 rounded-2xl border border-white/10 transition-colors duration-300 text-center md:text-left flex flex-col items-center md:items-start hover:bg-white/5"
                            >
                                <div className="absolute inset-0 liquid-glass-dark rounded-2xl -z-10" />
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-sky-400 flex items-center justify-center shadow-lg mb-6">
                                    <Icon className="w-8 h-8 text-primary" strokeWidth={2} />
                                </div>
                                <h3 className="text-xl font-bold mb-4 tracking-wider">{feature.title}</h3>
                                <p className="text-white/70 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
