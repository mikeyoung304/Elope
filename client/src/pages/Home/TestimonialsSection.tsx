import { Container } from "@/ui/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "Macon AI is more than tech—they're my business upgrade. I went from manually texting appointment reminders to a fully automated booking system. My revenue is up 30% and I'm working fewer hours.",
    name: "Casey M.",
    title: "Salon Owner",
  },
  {
    quote: "I went from lost leads to booked solid in weeks. The AI strategist helped me position my services, built my website, and set up a booking flow that just works.",
    name: "Robin T.",
    title: "Consultant",
  },
  {
    quote: "I didn't have a website, hated tech, and was losing clients to competitors. Macon AI launched my site in 10 days and automated my scheduling. Now I look professional and my calendar is full.",
    name: "Alex K.",
    title: "Fitness Coach",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" aria-labelledby="testimonials-heading" className="py-16 md:py-24 bg-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 id="testimonials-heading" className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
            What Club Members Are Saying
          </h2>
          <p className="text-xl md:text-2xl text-neutral-700 max-w-2xl mx-auto">
            Real businesses, real growth
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <article key={index}>
              <Card className="bg-neutral-50 border-neutral-200/30 hover:shadow-elevation-2 transition-shadow relative">
                <CardContent className="p-8">
                  <Quote className="w-12 h-12 text-macon-orange/30 mb-4" aria-hidden="true" />
                  <div className="flex gap-1 mb-4" aria-label="5 out of 5 stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-macon-orange fill-macon-orange"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-xl text-neutral-700 mb-6 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="border-t border-neutral-200/30 pt-4">
                    <div className="font-semibold text-xl text-neutral-900">{testimonial.name}</div>
                    <div className="text-lg text-neutral-600">{testimonial.title}</div>
                  </div>
                </CardContent>
              </Card>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}