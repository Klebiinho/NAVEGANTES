import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ReviewForm = () => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || rating === 0 || !reviewText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos e selecione uma avaliação.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await (supabase as any).from("reviews").insert({
      name: name.trim(),
      rating,
      review_text: reviewText.trim(),
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Erro ao enviar avaliação",
        description: "Não foi possível enviar sua avaliação. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Avaliação enviada!",
      description: "Obrigado pelo seu feedback.",
    });

    // Reset form
    setName("");
    setRating(0);
    setReviewText("");
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto p-8 rounded-2xl border border-white/10 transition-all duration-300">
      <div className="absolute inset-0 liquid-glass-dark rounded-2xl -z-10" />
      <div className="mb-8 relative z-10">
        <h3 className="text-2xl font-bold text-white mb-2 tracking-wider">Deixe sua Avaliação</h3>
        <p className="text-white/70 leading-relaxed">
          Conte-nos sobre sua experiência com nossos serviços
        </p>
      </div>
      <div className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-white">Seu Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              maxLength={100}
              className="bg-primary/20 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent h-12"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-white">Avaliação</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110 outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${star <= (hoveredStar || rating)
                      ? "fill-accent text-accent"
                      : "text-white/30"
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="review" className="text-white">Seu Comentário</Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Compartilhe sua experiência conosco..."
              rows={4}
              maxLength={1000}
              className="bg-primary/20 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent resize-none"
            />
            <p className="text-xs text-white/50 text-right">
              {reviewText.length}/1000
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-6 text-lg transition-colors border-none"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </form>
      </div>
    </div>
  );
};
