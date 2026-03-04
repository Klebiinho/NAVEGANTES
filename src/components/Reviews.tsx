"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewForm } from "./ReviewForm";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { fadeUp, scaleInSubtle, viewport } from "@/lib/animations";

interface Review {
  id: string;
  name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel("reviews_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => fetchReviews())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setReviews(data);
    setIsLoading(false);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <section id="avaliacoes" className="py-24 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 uppercase tracking-tight">Avaliações</h2>
          <div className="w-24 h-1 bg-accent mx-auto mb-6" />
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Veja o que nossos clientes dizem sobre nossos serviços
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          variants={scaleInSubtle}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-12 max-w-5xl mx-auto"
        >
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando avaliações...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Seja o primeiro a deixar uma avaliação!</p>
            </div>
          ) : (
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
              className="w-full"
            >
              <CarouselContent>
                {reviews.map((review) => (
                  <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="bg-primary-foreground/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm h-full flex flex-col items-start transition-all duration-300 mx-2">
                      <div className="flex items-center justify-between mb-6 w-full">
                        <h3 className="font-bold text-xl text-white tracking-wider">{review.name}</h3>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? "fill-accent text-accent" : "text-white/30"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-white/70 mb-4 text-base leading-relaxed flex-grow">{review.review_text}</p>
                      <p className="text-sm text-white/40">{formatDate(review.created_at)}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
        </motion.div>

        {/* Review form */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-12 max-w-5xl mx-auto"
        >
          <ReviewForm />
        </motion.div>
      </div>
    </section>
  );
};