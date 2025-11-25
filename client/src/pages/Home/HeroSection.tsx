import { Link } from "react-router-dom";
import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/**
 * HeroSection - Stories That Stick "Hook" Pattern
 *
 * Opens with a provocative question that creates tension,
 * then offers the resolution. Minimal, impactful, story-driven.
 */
export function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-[90vh] flex items-center bg-white"
    >
      <Container className="relative z-10">
        <div className="max-w-4xl">
          {/* The Hook - Creates tension */}
          <p className="text-macon-orange font-medium text-lg mb-6 tracking-wide">
            For business owners who want AI working for them—not the other way around
          </p>

          {/* The Promise - Resolution */}
          <h1
            id="hero-heading"
            className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-macon-navy leading-[1.1] tracking-tight mb-8"
          >
            What if growing your business
            <br />
            <span className="text-macon-orange">didn't mean losing your life?</span>
          </h1>

          {/* The Value Proposition - Simple, clear */}
          <p className="text-xl sm:text-2xl text-neutral-600 mb-12 leading-relaxed max-w-2xl">
            We become your AI-powered back office. You keep doing what you love.
            No employees. No tech stack to master. Just growth.
          </p>

          {/* Single, Clear CTA */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Button
              asChild
              size="lg"
              className="bg-macon-navy hover:bg-macon-navy-dark text-white font-semibold text-lg px-8 py-6 rounded-full group transition-all duration-300"
            >
              <Link to="/packages" className="flex items-center gap-2">
                Start a conversation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <span className="text-sm text-neutral-500 self-center">
              Free 15-minute call. No pitch, just answers.
            </span>
          </div>
        </div>
      </Container>

      {/* Subtle decorative element */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 bg-gradient-to-l from-macon-orange/5 to-transparent rounded-l-full hidden lg:block" />
    </section>
  );
}
