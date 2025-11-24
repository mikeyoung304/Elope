import { Link } from "react-router-dom";
import { Container } from "@/ui/Container";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: 1,
    title: "Apply & Onboard",
    description: "Fill a short application (5 minutes), meet your dedicated AI strategist, and join exclusive member events. We'll assess your business goals and create your custom plan.",
    timeline: "Week 1",
    highlight: "orange",
  },
  {
    number: 2,
    title: "Tailored Plan",
    description: "We assess your needs, then set up booking/scheduling, marketing automation, and consulting as you require. No one-size-fits-all—every business is unique.",
    timeline: "Week 2-3",
    highlight: "orange",
  },
  {
    number: 3,
    title: "Revenue Partnership",
    description: "We invest in your growth and take a small % of your sales—aligned incentives, shared success. You win, we win. No monthly fees eating into your profits.",
    timeline: "Ongoing",
    highlight: "teal",
  },
];

export function HowItWorksSection() {
  return (
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

            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex items-start gap-6 p-8 bg-white rounded-xl border-l-4 ${
                  step.highlight === "teal" ? "border-l-macon-teal" : "border-l-macon-orange"
                } border-t border-r border-b border-neutral-200 hover:shadow-elevation-3 transition-all relative`}
              >
                <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${
                  step.highlight === "teal"
                    ? "from-macon-teal to-macon-teal-dark"
                    : "from-macon-orange to-macon-orange-dark"
                } flex items-center justify-center text-white font-extrabold text-3xl shadow-lg relative z-10`}>
                  {step.number}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-neutral-900 mb-3">{step.title}</h3>
                  <p className="text-xl text-neutral-700 leading-relaxed">{step.description}</p>
                  <div className={`inline-block mt-3 px-4 py-2 ${
                    step.highlight === "teal" ? "bg-macon-teal/10" : "bg-macon-orange/10"
                  } rounded-lg`}>
                    <p className={`text-base ${
                      step.highlight === "teal" ? "text-macon-teal" : "text-macon-orange"
                    } font-bold`}>
                      {step.timeline}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              variant="secondary"
              size="lg"
              className="text-xl"
              asChild
            >
              <Link to="/packages">Browse Our Packages</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}