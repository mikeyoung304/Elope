import { Link } from "react-router-dom";
import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/**
 * HeroSection - AI-Powered Storefronts for High-Value Service Businesses
 *
 * Editorial design with Playfair Display headlines and earth tone palette.
 */
export function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-[90vh] flex items-center bg-surface"
    >
      <Container className="relative z-10">
        <div className="max-w-4xl">
          {/* Headline - Serif for editorial feel */}
          <h1
            id="hero-heading"
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-text-primary leading-[1.1] tracking-tight mb-8"
          >
            AI-powered storefronts for high-value service businesses
          </h1>

          {/* Subheadline - Sans-serif body */}
          <p className="text-xl sm:text-2xl text-text-muted mb-12 leading-relaxed max-w-3xl">
            MaconAI Solutions builds and runs a 3-tier online storefront for your services—booking, payments, and AI workflows included—so you sell more experiences without adding more admin.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Button
              asChild
              size="lg"
              className="bg-sage hover:bg-sage-hover text-white font-semibold text-lg px-8 py-6 rounded-full group transition-all duration-300"
            >
              <Link to="/contact" className="flex items-center gap-2">
                Book a Discovery Call
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <span className="text-sm text-text-muted self-center">
              20 minutes to see if a done-for-you AI storefront makes sense for your business.
            </span>
          </div>
        </div>
      </Container>

      {/* Subtle decorative element */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 bg-gradient-to-l from-sage-light/10 to-transparent rounded-l-full hidden lg:block" />
    </section>
  );
}
