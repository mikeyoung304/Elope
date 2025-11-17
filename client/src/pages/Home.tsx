import { Container } from "@/ui/Container";
import { CatalogGrid } from "@/features/catalog/CatalogGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, Zap, Gift, Target, Star } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";

export function Home() {
  // Load and apply tenant branding
  useBranding();

  const scrollToPackages = () => {
    document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white py-20 md:py-32">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-gray-900">
              Your Perfect Day, Simplified
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
              Intimate, stress-free weddings and elopements designed just for you.
              From simple ceremonies to luxury experiences, we handle every detail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={scrollToPackages}
                size="lg"
                className="font-medium text-xl"
              >
                View Packages
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="text-xl"
              >
                <a href="#about">Learn More</a>
              </Button>
            </div>

            {/* Stats Section */}
            <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-gray-50 border-2 border-gray-200/30 rounded-lg p-6 shadow-sm">
                <div className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-macon-navy-dark mb-2">500+</div>
                <div className="text-lg md:text-xl uppercase tracking-wide text-gray-600">Happy Couples</div>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200/30 rounded-lg p-6 shadow-sm">
                <div className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-macon-navy-dark mb-2">24hr</div>
                <div className="text-lg md:text-xl uppercase tracking-wide text-gray-600">Quick Booking</div>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200/30 rounded-lg p-6 shadow-sm">
                <div className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-macon-navy-dark mb-2">100%</div>
                <div className="text-lg md:text-xl uppercase tracking-wide text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-16 md:py-24 bg-background">
        <Container>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-gray-900">
              Our Packages
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto">
              Choose the perfect experience for your special day
            </p>
          </div>
          <CatalogGrid />
        </Container>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">
                Why Choose Elope?
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
                We believe your wedding day should be about you—not stress, not excessive costs,
                not months of planning. Whether you're dreaming of an intimate courthouse ceremony
                or a luxurious destination celebration, we make it effortless.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="group bg-gray-50 border-gray-200/30">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-lavender-300/20 group-hover:bg-primary transition-colors">
                    <Sparkles className="w-6 h-6 text-gray-500 group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                    Curated Experiences
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Every package is thoughtfully designed with everything you need for a memorable day.
                  </p>
                </CardContent>
              </Card>

              <Card className="group bg-gray-50 border-gray-200/30">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-lavender-300/20 group-hover:bg-primary transition-colors">
                    <Zap className="w-6 h-6 text-gray-500 group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                    Quick & Easy
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Book in minutes, not months. We handle the details so you can focus on each other.
                  </p>
                </CardContent>
              </Card>

              <Card className="group bg-gray-50 border-gray-200/30">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-lavender-300/20 group-hover:bg-primary transition-colors">
                    <Gift className="w-6 h-6 text-gray-500 group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                    All-Inclusive
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Photography, venues, officiants—everything you need in one transparent price.
                  </p>
                </CardContent>
              </Card>

              <Card className="group bg-gray-50 border-gray-200/30">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-lavender-300/20 group-hover:bg-primary transition-colors">
                    <Target className="w-6 h-6 text-gray-500 group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-gray-900">
                    Personalized
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Customize with add-ons like video, flowers, music, and more to make it uniquely yours.
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
              What Our Couples Say
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto">
              Real stories from real couples who chose Elope
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <div className="flex mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-purple-400 text-purple-400" />
                  ))}
                </div>
                <p className="text-xl text-gray-700 mb-6 leading-relaxed italic">
                  "We wanted something simple and beautiful, and Elope delivered perfectly.
                  The process was so easy, and our photographer captured moments we'll treasure forever."
                </p>
                <div className="border-t border-gray-200/30 pt-4">
                  <div className="font-semibold text-xl text-gray-900">Sarah & Michael</div>
                  <div className="text-lg text-gray-600">Basic Elopement • June 2024</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <div className="flex mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-purple-400 text-purple-400" />
                  ))}
                </div>
                <p className="text-xl text-gray-700 mb-6 leading-relaxed italic">
                  "From booking to the ceremony, everything was seamless. We loved the garden venue,
                  and the coordinator made sure every detail was perfect. Highly recommend!"
                </p>
                <div className="border-t border-gray-200/30 pt-4">
                  <div className="font-semibold text-xl text-gray-900">Emma & David</div>
                  <div className="text-lg text-gray-600">Garden Romance • August 2024</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200/30">
              <CardContent className="p-8">
                <div className="flex mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-purple-400 text-purple-400" />
                  ))}
                </div>
                <p className="text-xl text-gray-700 mb-6 leading-relaxed italic">
                  "Best decision ever! We didn't want the stress of a big wedding. Elope made it
                  stress-free and absolutely magical. Worth every penny."
                </p>
                <div className="border-t border-gray-200/30 pt-4">
                  <div className="font-semibold text-xl text-gray-900">Jessica & Ryan</div>
                  <div className="text-lg text-gray-600">Luxury Escape • September 2024</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
