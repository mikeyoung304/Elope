import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Zap, TrendingUp, Key, Bell, BarChart, Shield, Check } from "lucide-react";

export function Home() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white py-20 md:py-32">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-gray-900">
              AI-Powered Tenant Management, Made Effortless
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
              Onboard. Automate. Delight tenants—all in a single platform built for simplicity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={scrollToFeatures}
                variant="secondary"
                size="lg"
                className="font-medium text-xl"
              >
                Try Free for 14 Days
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="text-xl"
              >
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            {/* Stats Section */}
            <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-gray-50 border-2 border-gray-200/30 rounded-lg p-6 shadow-sm">
                <div className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-macon-navy-dark mb-2">1000+</div>
                <div className="text-lg md:text-xl uppercase tracking-wide text-gray-600">Properties Managed</div>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200/30 rounded-lg p-6 shadow-sm">
                <div className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-macon-navy-dark mb-2">60%</div>
                <div className="text-lg md:text-xl uppercase tracking-wide text-gray-600">Time Saved</div>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200/30 rounded-lg p-6 shadow-sm">
                <div className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-macon-navy-dark mb-2">95%</div>
                <div className="text-lg md:text-xl uppercase tracking-wide text-gray-600">Tenant Satisfaction</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Feature Highlights Section */}
      <section id="features" className="py-16 md:py-24 bg-background">
        <Container>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-gray-900">
              Feature Highlights
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto">
              Everything you need to manage properties and delight tenants
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
            <Card className="group bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-orange/10 group-hover:bg-macon-orange transition-colors">
                  <Building2 className="w-6 h-6 text-macon-orange group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                  One-Click Onboarding
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed">
                  Seamlessly add tenants, properties, and staff in minutes—no tech skills required.
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-orange/10 group-hover:bg-macon-orange transition-colors">
                  <Zap className="w-6 h-6 text-macon-orange group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                  Automated Workflows
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed">
                  Say goodbye to manual tasks. Let our AI handle reminders, renewals, and notifications.
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-orange/10 group-hover:bg-macon-orange transition-colors">
                  <TrendingUp className="w-6 h-6 text-macon-orange group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                  Real-Time Analytics
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed">
                  Instantly track occupancy, payments, and tenant satisfaction from a single dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 md:py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">
                Why Choose Macon AI?
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
                Built by property management experts and AI specialists, Macon AI Solutions combines cutting-edge automation
                with hands-on industry experience to help you focus on growth, not paperwork.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="group bg-gray-50 border-gray-200/30">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-orange/10 group-hover:bg-macon-orange transition-colors">
                    <Key className="w-6 h-6 text-macon-orange group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                    Seamless Access
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Grant digital access to properties, track entry logs, and manage permissions—all from one secure platform.
                  </p>
                </CardContent>
              </Card>

              <Card className="group bg-gray-50 border-gray-200/30">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-orange/10 group-hover:bg-macon-orange transition-colors">
                    <Bell className="w-6 h-6 text-macon-orange group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                    Smart Notifications
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    AI-powered alerts keep tenants informed and reduce support requests by up to 70%.
                  </p>
                </CardContent>
              </Card>

              <Card className="group bg-gray-50 border-gray-200/30">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-orange/10 group-hover:bg-macon-orange transition-colors">
                    <BarChart className="w-6 h-6 text-macon-orange group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                    Actionable Insights
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Understand tenant behavior patterns and optimize operations with data-driven recommendations.
                  </p>
                </CardContent>
              </Card>

              <Card className="group bg-gray-50 border-gray-200/30">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-macon-orange/10 group-hover:bg-macon-orange transition-colors">
                    <Shield className="w-6 h-6 text-macon-orange group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                    Enterprise Security
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Bank-level encryption and compliance standards keep your data and tenants' information protected.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-background">
        <Container>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-gray-900">
              Tenants Love the Simplicity
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto">
              Hear from property managers who transformed their operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <p className="text-xl text-gray-700 mb-6 leading-relaxed italic">
                  "Macon AI just works—I manage more properties with less stress."
                </p>
                <div className="border-t border-gray-200/30 pt-4">
                  <div className="font-semibold text-xl text-gray-900">Taylor M.</div>
                  <div className="text-lg text-gray-600">Property Manager</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <p className="text-xl text-gray-700 mb-6 leading-relaxed italic">
                  "The onboarding was so easy. Our tenants noticed the difference immediately."
                </p>
                <div className="border-t border-gray-200/30 pt-4">
                  <div className="font-semibold text-xl text-gray-900">Alex R.</div>
                  <div className="text-lg text-gray-600">Community Lead</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <p className="text-xl text-gray-700 mb-6 leading-relaxed italic">
                  "We automated 80% of our routine communication. Huge time saver."
                </p>
                <div className="border-t border-gray-200/30 pt-4">
                  <div className="font-semibold text-xl text-gray-900">Jordan S.</div>
                  <div className="text-lg text-gray-600">Tenant Relations</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Social Proof Bar */}
      <section className="py-12 bg-white border-y border-gray-200">
        <Container>
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">Trusted by leading tenants and property managers</p>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              {/* Placeholder for logos */}
              <div className="text-gray-400 text-sm px-6 py-3 border border-gray-200 rounded">Oakridge Realty</div>
              <div className="text-gray-400 text-sm px-6 py-3 border border-gray-200 rounded">Blue Sky Living</div>
              <div className="text-gray-400 text-sm px-6 py-3 border border-gray-200 rounded">Riverbank Communities</div>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Tour / How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-background">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">
                How Macon AI Works
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                From sign-up to automation, Macon AI Solutions is designed to save you time and keep your tenants happy.
              </p>
            </div>

            <div className="space-y-6">
              {[
                "Create your account—no setup fees, no hassle.",
                "Add properties and assign staff with guided onboarding.",
                "Automate lease renewals, rent collection, and tenant communications.",
                "Monitor everything with real-time reporting.",
                "Get human support whenever you need it."
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-lg border border-gray-200 hover:shadow-elevation-2 transition-shadow">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-orange flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <p className="text-xl text-gray-700 pt-1">{step}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="secondary" size="lg" className="text-xl">
                Get Started
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* About Us Section */}
      <section className="py-16 md:py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">
                About Macon AI Solutions
              </h2>
            </div>
            <div className="prose prose-xl max-w-none">
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                Macon AI Solutions believes in making tenant management effortless for everyone. Our mission is to bring world-class
                automation to property management, helping owners and teams focus on growth and service—not paperwork.
              </p>
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                Headquartered in Macon, Georgia, our team combines deep AI expertise with hands-on property experience. We understand
                the challenges property managers face because we've been there.
              </p>
              <p className="text-xl text-gray-700 leading-relaxed">
                Want to know more? <a href="#team" className="text-macon-orange hover:text-macon-orange-dark underline">Learn about our team.</a>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-navy text-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Ready to Transform Your Property Management?
            </h2>
            <p className="text-xl mb-8 text-gray-200">
              Join hundreds of property managers who've automated their workflows and delighted their tenants.
            </p>
            <Button variant="secondary" size="lg" className="text-xl">
              Start Your Free Trial
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
