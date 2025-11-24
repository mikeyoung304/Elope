import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Zap, TrendingUp } from "lucide-react";

export function TargetAudienceSection() {
  return (
    <section id="target-audience" aria-labelledby="target-audience-heading" className="py-16 md:py-24 bg-white">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 id="target-audience-heading" className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
              Who Is This For?
            </h2>
            <p className="text-xl md:text-2xl text-neutral-700 leading-relaxed max-w-3xl mx-auto">
              Entrepreneurs, small business owners, and anyone ready to level up with AI and digital essentials. Whether you're launching, scaling, or pivoting—we're your growth partner.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="group bg-neutral-50 border-l-4 border-l-macon-orange border-t border-r border-b border-neutral-200/30 hover:shadow-elevation-2 transition-all">
              <CardContent className="p-8">
                <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-orange/10 group-hover:bg-macon-orange transition-colors">
                  <TrendingUp className="w-6 h-6 text-macon-orange group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-neutral-900">
                  The Solopreneur
                </h3>
                <p className="text-xl text-neutral-700 leading-relaxed mb-4">
                  You're wearing all the hats (sales, marketing, ops) and drowning in admin.
                </p>
                <p className="text-base text-neutral-600">
                  <strong>We handle:</strong> Scheduling, payments, website, marketing automation<br/>
                  <strong>You focus on:</strong> Delivering your service, closing deals
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-neutral-50 border-l-4 border-l-macon-teal border-t border-r border-b border-neutral-200/30 hover:shadow-elevation-2 transition-all">
              <CardContent className="p-8">
                <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-teal/10 group-hover:bg-macon-teal transition-colors">
                  <Building2 className="w-6 h-6 text-macon-teal group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-neutral-900">
                  The Scaling Startup
                </h3>
                <p className="text-xl text-neutral-700 leading-relaxed mb-4">
                  You've proven the concept, now need systems to scale without chaos.
                </p>
                <p className="text-base text-neutral-600">
                  <strong>We handle:</strong> Lead management, client onboarding, analytics, consulting<br/>
                  <strong>You focus on:</strong> Strategy, partnerships, growth
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-neutral-50 border-l-4 border-l-macon-navy border-t border-r border-b border-neutral-200/30 hover:shadow-elevation-2 transition-all">
              <CardContent className="p-8">
                <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-navy/10 group-hover:bg-macon-navy transition-colors">
                  <Zap className="w-6 h-6 text-macon-navy group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-neutral-900">
                  The Pivot Artist
                </h3>
                <p className="text-xl text-neutral-700 leading-relaxed mb-4">
                  You're shifting your business model or launching a new offering.
                </p>
                <p className="text-base text-neutral-600">
                  <strong>We handle:</strong> Website redesign, new booking flows, AI-powered marketing<br/>
                  <strong>You focus on:</strong> Testing, iterating, finding product-market fit
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-xl text-neutral-700 mb-4">Not sure if you fit?</p>
            <Button
              variant="outline"
              size="lg"
              className="text-lg"
              onClick={() => window.location.href = 'mailto:support@maconai.com?subject=Inquiry about Macon AI Club'}
            >
              Chat with us →
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}