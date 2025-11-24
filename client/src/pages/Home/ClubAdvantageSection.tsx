import { Container } from "@/ui/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Zap, TrendingUp, Check } from "lucide-react";

export function ClubAdvantageSection() {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-16 md:py-24 bg-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 id="features-heading" className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
            The Club Advantage
          </h2>
          <p className="text-xl md:text-2xl text-neutral-700 max-w-2xl mx-auto">
            Three Pillars of Growth
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          <Card className="group bg-white border-2 border-neutral-200 hover:border-macon-orange/50 shadow-elevation-1 hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-macon-orange/20 to-macon-orange/10 group-hover:from-macon-orange group-hover:to-macon-orange-700 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                <TrendingUp className="w-8 h-8 text-macon-orange group-hover:text-white transition-all duration-300" />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-semibold mb-3 text-neutral-900 group-hover:text-macon-navy transition-colors">
                Business Growth, Accelerated
              </h3>
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                Hands-on marketing, bespoke consulting, and sales-driven strategies powered by cutting-edge AI. We don't just give you tools—we execute alongside you.
              </p>
              <p className="text-base text-macon-orange font-semibold">
                Outcome: Increase revenue, land more clients, scale smarter
              </p>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-macon-navy to-macon-navy-dark border-2 border-macon-orange shadow-[0_20px_50px_rgba(255,107,53,0.3)] hover:shadow-[0_25px_60px_rgba(255,107,53,0.4)] hover:-translate-y-3 transition-all duration-300 md:scale-105 relative overflow-hidden">
            {/* Accent glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-macon-orange/10 via-transparent to-macon-teal/10 opacity-60"></div>
            <CardContent className="p-10 relative z-10">
              <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-macon-orange to-macon-orange-dark shadow-[0_0_30px_rgba(255,107,53,0.5)]">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mb-3 text-white">
                Seamless Scheduling & Bookings
              </h3>
              <p className="text-lg text-white/90 leading-relaxed mb-4">
                Effortlessly manage appointments, payments, and client flow with tools tailored to your brand. No more double-bookings, missed payments, or admin chaos.
              </p>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-macon-orange mt-0.5 flex-shrink-0" />
                <p className="text-base text-macon-orange-light font-bold">
                  Outcome: Save 60+ hours/month, never lose a lead, get paid faster
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-white border-2 border-neutral-200 hover:border-macon-orange/50 shadow-elevation-1 hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-macon-orange/20 to-macon-orange/10 group-hover:from-macon-orange group-hover:to-macon-orange-700 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                <Building2 className="w-8 h-8 text-macon-orange group-hover:text-white transition-all duration-300" />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-semibold mb-3 text-neutral-900 group-hover:text-macon-navy transition-colors">
                Your Website, Your Way
              </h3>
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                Don't have a site? Need an upgrade? Our team designs, launches, and maintains your digital hub—no dev skills required. You focus on your business, we handle the tech.
              </p>
              <p className="text-base text-macon-orange font-semibold">
                Outcome: Professional web presence without hiring developers
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}