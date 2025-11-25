import { Link } from "react-router-dom";
import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative bg-gradient-to-br from-macon-navy via-macon-navy to-neutral-900 py-16 sm:py-20 md:py-28 lg:py-36 px-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,53,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(56,178,172,0.08),transparent_50%)]"></div>

      <Container className="relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 id="hero-heading" className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 sm:mb-8 text-white leading-[1.1] tracking-tight drop-shadow-2xl">
            Stop Drowning in Admin. <span className="text-transparent bg-clip-text bg-gradient-to-r from-macon-orange via-macon-orange-light to-macon-teal">Start Growing Your Business.</span>
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-white/90 mb-8 sm:mb-10 leading-relaxed max-w-4xl mx-auto font-light">
            We handle your scheduling, payments, and marketing—so you can focus on what you do best. Join 50+ business owners who've escaped the admin trap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="bg-macon-orange hover:bg-macon-orange-dark text-white font-bold text-xl px-12 py-7 shadow-2xl hover:shadow-[0_0_40px_rgba(255,107,53,0.6)] w-full sm:w-auto sm:min-w-[300px] min-h-[64px] transition-all duration-300 hover:-translate-y-1 hover:scale-105 rounded-xl"
            >
              <Link to="/packages">Start My Free Growth Audit</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="text-lg text-white border-2 border-white/40 hover:border-white hover:bg-white/10 min-h-[64px] backdrop-blur-sm rounded-xl font-semibold"
            >
              <a href="#how-it-works">See How It Works</a>
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
              <span className="text-base text-white font-medium">Live in under 2 weeks</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Check className="w-5 h-5 text-macon-orange" />
              <span className="text-base text-white font-medium">Your dedicated growth partner</span>
            </div>
          </div>

          {/* Social Proof Bar */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/70">
              <span>Trusted by <strong className="text-white">50+</strong> businesses</span>
              <span className="hidden sm:inline text-white/30">•</span>
              <span><strong className="text-white">$2M+</strong> revenue managed</span>
              <span className="hidden sm:inline text-white/30">•</span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <strong className="text-white">4.9</strong> average rating
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}