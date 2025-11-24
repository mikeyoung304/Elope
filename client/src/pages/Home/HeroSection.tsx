import { Link } from "react-router-dom";
import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function HeroSection() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative bg-gradient-to-br from-macon-navy via-macon-navy to-neutral-900 py-16 sm:py-20 md:py-28 lg:py-36 px-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,53,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(56,178,172,0.08),transparent_50%)]"></div>

      <Container className="relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 id="hero-heading" className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 sm:mb-8 text-white leading-[1.1] tracking-tight drop-shadow-2xl">
            Unlock Your Business Potential—Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-macon-orange via-macon-orange-light to-macon-teal">Macon AI Club</span>
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-white/90 mb-8 sm:mb-10 leading-relaxed max-w-4xl mx-auto font-light">
            Your all-in-one partner for AI consulting, booking, scheduling, website builds, and business growth. We're your team behind the scenes—let's innovate together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="bg-macon-orange hover:bg-macon-orange-dark text-white font-bold text-xl px-12 py-7 shadow-2xl hover:shadow-[0_0_40px_rgba(255,107,53,0.6)] w-full sm:w-auto sm:min-w-[300px] min-h-[64px] transition-all duration-300 hover:-translate-y-1 hover:scale-105 rounded-xl"
            >
              <Link to="/packages">Browse Packages</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="text-lg text-white border-2 border-white/40 hover:border-white hover:bg-white/10 min-h-[64px] backdrop-blur-sm rounded-xl font-semibold"
            >
              <a href="#how-it-works">Want to learn more? How It Works →</a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Check className="w-5 h-5 text-macon-orange" />
              <span className="text-base text-white font-medium">No credit card required</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Check className="w-5 h-5 text-macon-orange" />
              <span className="text-base text-white font-medium">Setup in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Check className="w-5 h-5 text-macon-orange" />
              <span className="text-base text-white font-medium">Dedicated AI strategist</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}