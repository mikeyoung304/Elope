import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Zap, TrendingUp, Key, Bell, BarChart, Shield, Check, Star, Quote } from "lucide-react";

export function Home() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      {/* Hero Section */}
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
                onClick={scrollToFeatures}
                size="lg"
                className="bg-macon-orange hover:bg-macon-orange-dark text-white font-bold text-xl px-12 py-7 shadow-2xl hover:shadow-[0_0_40px_rgba(255,107,53,0.6)] w-full sm:w-auto sm:min-w-[300px] min-h-[64px] transition-all duration-300 hover:-translate-y-1 hover:scale-105 rounded-xl"
              >
                Apply to Join the Club
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

      {/* The Club Advantage - Three Pillars */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
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

      {/* Who Is This For? */}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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

      {/* Testimonials Section */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <article>
              <Card className="bg-neutral-50 border-neutral-200/30 hover:shadow-elevation-2 transition-shadow relative">
                <CardContent className="p-8">
                  <Quote className="w-12 h-12 text-macon-orange/30 mb-4" aria-hidden="true" />
                  <div className="flex gap-1 mb-4" aria-label="5 out of 5 stars">
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                  </div>
                  <p className="text-xl text-neutral-700 mb-6 leading-relaxed italic">
                    "Macon AI is more than tech—they're my business upgrade. I went from manually texting appointment reminders to a fully automated booking system. My revenue is up 30% and I'm working fewer hours."
                  </p>
                  <div className="border-t border-neutral-200/30 pt-4">
                    <div className="font-semibold text-xl text-neutral-900">Casey M.</div>
                    <div className="text-lg text-neutral-600">Salon Owner</div>
                  </div>
                </CardContent>
              </Card>
            </article>

            <article>
              <Card className="bg-neutral-50 border-neutral-200/30 hover:shadow-elevation-2 transition-shadow relative">
                <CardContent className="p-8">
                  <Quote className="w-12 h-12 text-macon-orange/30 mb-4" aria-hidden="true" />
                  <div className="flex gap-1 mb-4" aria-label="5 out of 5 stars">
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                  </div>
                  <p className="text-xl text-neutral-700 mb-6 leading-relaxed italic">
                    "I went from lost leads to booked solid in weeks. The AI strategist helped me position my services, built my website, and set up a booking flow that just works."
                  </p>
                  <div className="border-t border-neutral-200/30 pt-4">
                    <div className="font-semibold text-xl text-neutral-900">Robin T.</div>
                    <div className="text-lg text-neutral-600">Consultant</div>
                  </div>
                </CardContent>
              </Card>
            </article>

            <article>
              <Card className="bg-neutral-50 border-neutral-200/30 hover:shadow-elevation-2 transition-shadow relative">
                <CardContent className="p-8">
                  <Quote className="w-12 h-12 text-macon-orange/30 mb-4" aria-hidden="true" />
                  <div className="flex gap-1 mb-4" aria-label="5 out of 5 stars">
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                    <Star className="w-5 h-5 text-macon-orange fill-macon-orange" aria-hidden="true" />
                  </div>
                  <p className="text-xl text-neutral-700 mb-6 leading-relaxed italic">
                    "I didn't have a website, hated tech, and was losing clients to competitors. Macon AI launched my site in 10 days and automated my scheduling. Now I look professional and my calendar is full."
                  </p>
                  <div className="border-t border-neutral-200/30 pt-4">
                    <div className="font-semibold text-xl text-neutral-900">Alex K.</div>
                    <div className="text-lg text-neutral-600">Fitness Coach</div>
                  </div>
                </CardContent>
              </Card>
            </article>
          </div>
        </Container>
      </section>

      {/* Social Proof Bar */}
      <section id="social-proof" aria-labelledby="social-proof-heading" className="py-16 bg-gradient-to-r from-macon-navy via-macon-navy-light to-macon-navy border-y-4 border-macon-orange relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,53,0.08),transparent_70%)]"></div>

        <Container className="relative z-10">
          <div className="text-center">
            <h2 id="social-proof-heading" className="text-2xl text-white/90 mb-10 font-semibold">Join businesses already growing with Macon AI</h2>
            <div className="flex justify-center items-stretch gap-6 flex-wrap max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 px-10 py-6 rounded-2xl hover:bg-white/15 transition-all flex-1 min-w-[200px]">
                <div className="text-5xl font-extrabold text-white mb-1">50+</div>
                <div className="text-sm text-white/80 font-medium uppercase tracking-wide">Businesses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border-2 border-macon-orange/40 px-10 py-6 rounded-2xl hover:bg-white/15 transition-all flex-1 min-w-[200px]">
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-macon-orange to-macon-orange-light mb-1">$2M+</div>
                <div className="text-sm text-white/80 font-medium uppercase tracking-wide">Revenue Managed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 px-10 py-6 rounded-2xl hover:bg-white/15 transition-all flex-1 min-w-[200px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="text-5xl font-extrabold text-white">4.9</div>
                  <svg className="w-10 h-10 text-macon-orange fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                </div>
                <div className="text-sm text-white/80 font-medium uppercase tracking-wide">Member Rating</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works - Club Membership Flow */}
      <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-16 md:py-24 bg-background">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 id="how-it-works-heading" className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
                How It Works
              </h2>
              <p className="text-xl md:text-2xl text-neutral-700 leading-relaxed">
                Join. Grow. Succeed.
              </p>
            </div>

            <div className="space-y-8 relative">
              {/* Connecting line */}
              <div className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-macon-orange via-macon-orange to-macon-teal hidden md:block"></div>

              <div className="flex items-start gap-6 p-8 bg-white rounded-xl border-l-4 border-l-macon-orange border-t border-r border-b border-neutral-200 hover:shadow-elevation-3 transition-all relative">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-macon-orange to-macon-orange-dark flex items-center justify-center text-white font-extrabold text-3xl shadow-lg relative z-10">
                  1
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-neutral-900 mb-3">Apply & Onboard</h3>
                  <p className="text-xl text-neutral-700 leading-relaxed">Fill a short application (5 minutes), meet your dedicated AI strategist, and join exclusive member events. We'll assess your business goals and create your custom plan.</p>
                  <div className="inline-block mt-3 px-4 py-2 bg-macon-orange/10 rounded-lg">
                    <p className="text-base text-macon-orange font-bold">Week 1</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-6 p-8 bg-white rounded-xl border-l-4 border-l-macon-orange border-t border-r border-b border-neutral-200 hover:shadow-elevation-3 transition-all relative">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-macon-orange to-macon-orange-dark flex items-center justify-center text-white font-extrabold text-3xl shadow-lg relative z-10">
                  2
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-neutral-900 mb-3">Tailored Plan</h3>
                  <p className="text-xl text-neutral-700 leading-relaxed">We assess your needs, then set up booking/scheduling, marketing automation, and consulting as you require. No one-size-fits-all—every business is unique.</p>
                  <div className="inline-block mt-3 px-4 py-2 bg-macon-orange/10 rounded-lg">
                    <p className="text-base text-macon-orange font-bold">Week 2-3</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-6 p-8 bg-white rounded-xl border-l-4 border-l-macon-teal border-t border-r border-b border-neutral-200 hover:shadow-elevation-3 transition-all relative">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-macon-teal to-macon-teal-dark flex items-center justify-center text-white font-extrabold text-3xl shadow-lg relative z-10">
                  3
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-neutral-900 mb-3">Revenue Partnership</h3>
                  <p className="text-xl text-neutral-700 leading-relaxed">We invest in your growth and take a small % of your sales—aligned incentives, shared success. You win, we win. No monthly fees eating into your profits.</p>
                  <div className="inline-block mt-3 px-4 py-2 bg-macon-teal/10 rounded-lg">
                    <p className="text-base text-macon-teal font-bold">Ongoing</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                variant="secondary"
                size="lg"
                className="text-xl"
                onClick={() => window.location.href = 'mailto:support@maconai.com?subject=Application to Join Macon AI Club'}
              >
                Apply to Join
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* About Us Section */}
      <section id="about" aria-labelledby="about-heading" className="py-16 md:py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 id="about-heading" className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-macon-navy via-macon-orange to-macon-teal">
                About Macon AI Solutions
              </h2>
            </div>
            <div className="prose prose-xl max-w-none">
              <p className="text-xl text-neutral-700 leading-relaxed mb-6">
                Macon AI Solutions believes business growth shouldn't require wearing all the hats. Our mission is to partner with entrepreneurs
                and small business owners, providing AI-powered consulting, seamless scheduling, professional websites, and marketing automation—all
                through a revenue-sharing model that aligns our success with yours.
              </p>
              <p className="text-xl text-neutral-700 leading-relaxed mb-6">
                Headquartered in Macon, Georgia, our team combines deep AI expertise with hands-on business experience. We understand the challenges
                small business owners face because we've been there—juggling admin tasks, chasing leads, and struggling with tech.
              </p>
              <p className="text-xl text-neutral-700 leading-relaxed">
                That's why we built the Macon AI Club: a partnership where we invest in your growth, not just sell you software.
                Want to know more? <a href="#team" className="text-macon-orange hover:text-macon-orange-dark underline">Learn about our team.</a>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA Section */}
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
                onClick={() => window.location.href = 'mailto:support@maconai.com?subject=Application to Join Macon AI Club'}
              >
                Apply to Join the Club
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
    </main>
  );
}
