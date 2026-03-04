import { useState, useEffect } from "react";
import {
  Compass, Award, FileText, GraduationCap, Ship,
  Shield, Navigation, Stamp, CreditCard, LayoutGrid, Scroll, ShieldCheck
} from "lucide-react";
import ServiceBookingModal from "./ServiceBookingModal";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { fadeUp, cardItem, staggerContainer, widthGrow, viewport } from "@/lib/animations";
interface Service {
  id: string;
  title: string;
  description: string;
  icon_name: string;
}

const iconMap: Record<string, any> = {
  FileText, Shield, Stamp, CreditCard, Award, Ship, Navigation,
  GraduationCap, Compass, LayoutGrid, Scroll, ShieldCheck
};

const gridVariants = staggerContainer(0.08, 0.1);

const Services = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await (supabase as any)
        .from("servicos")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      if (data) setServices(data as any);
    };

    fetchServices();

    const channel = supabase
      .channel("services_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "servicos" }, () => fetchServices())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleServiceClick = (title: string) => {
    setSelectedService(title);
    setIsModalOpen(true);
  };

  return (
    <section id="servicos" className="py-24 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 uppercase tracking-tight">Nossos Serviços</h2>
          <motion.div variants={widthGrow} className="h-1 bg-accent mx-auto mb-6" />
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Oferecemos uma ampla gama de serviços especializados para atender todas as suas necessidades marítimas
          </p>
        </motion.div>

        {/* Cards grid with stagger */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => {
            const IconComponent = iconMap[service.icon_name] || LayoutGrid;
            return (
              <motion.div
                key={service.id}
                variants={cardItem}
                onClick={() => handleServiceClick(service.title)}
                className="block cursor-pointer outline-none"
              >
                <div className="relative group p-8 rounded-2xl border border-white/10 transition-colors duration-300 h-full flex flex-col text-center md:text-left items-center md:items-start hover:bg-white/5">
                  <div className="absolute inset-0 liquid-glass-dark rounded-2xl -z-10" />
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-sky-400 flex items-center justify-center shadow-lg mb-6"
                  >
                    <IconComponent className="w-8 h-8 text-primary" strokeWidth={2} />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-4 tracking-wider text-white relative z-10">{service.title}</h3>
                  <p className="text-white/70 leading-relaxed relative z-10">{service.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <ServiceBookingModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        serviceTitle={selectedService}
      />
    </section>
  );
};

export default Services;
