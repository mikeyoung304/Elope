import { Link } from "react-router-dom";
import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function FinalCTASection() {
  return (
    <section id="final-cta" aria-labelledby="final-cta-heading" className="relative py-28 bg-gradient-to-br from-macon-navy via-neutral-900 to-black text-white overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-macon-orange/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-macon-teal/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 id="final-cta-heading" className="font-heading text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight text-white drop-shadow-2xl">
            Ready to Unlock Your Growth?
          </h2>
          <p className="text-2xl md:text-3xl mb-12 text-white/90 leading-relaxed font-light max-w-3xl mx-auto">
            Apply to join the Macon AI Club and get a dedicated team working on your success—not just another tool collecting dust.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button
              className="bg-macon-orange hover:bg-macon-orange-dark text-white font-extrabold text-2xl px-16 py-8 shadow-[0_0_60px_rgba(255,107,53,0.5)] hover:shadow-[0_0_80px_rgba(255,107,53,0.7)] hover:scale-110 w-full sm:w-auto sm:min-w-[340px] rounded-2xl transition-all duration-300 border-4 border-macon-orange-light"
              asChild
            >
              <Link to="/packages">Browse Our Packages</Link>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Check className="w-6 h-6 text-macon-orange" />
              <span className="text-base text-white font-medium">5-minute application</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Check className="w-6 h-6 text-macon-orange" />
              <span className="text-base text-white font-medium">24-hour review</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Check className="w-6 h-6 text-macon-orange" />
              <span className="text-base text-white font-medium">No obligation</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}