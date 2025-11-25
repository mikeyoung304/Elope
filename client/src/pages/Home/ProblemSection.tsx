import { Container } from "@/ui/Container";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Clock, TrendingDown, Flame } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Drowning in Admin",
    description:
      "You started a business to do what you love—not to spend 60 hours a week on scheduling, invoices, and follow-ups.",
  },
  {
    icon: TrendingDown,
    title: "Losing Leads",
    description:
      "While you're juggling tasks, potential clients are booking with competitors who have better systems.",
  },
  {
    icon: Flame,
    title: "Burning Out",
    description:
      "Wearing every hat isn't sustainable. Something has to give—and it's usually your sanity or your growth.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 bg-neutral-950">
      <Container>
        <AnimatedSection>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Sound Familiar?
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
          {problems.map((problem, idx) => (
            <AnimatedSection key={idx} delay={idx * 100}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center hover:border-neutral-700 transition-colors h-full">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <problem.icon className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {problem.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={400}>
          <div className="text-center mt-16">
            <p className="text-2xl md:text-3xl text-neutral-300 italic font-light">
              "You didn't start a business for this."
            </p>
            <p className="text-macon-orange mt-4 font-medium text-lg">
              There's a better way
            </p>
          </div>
        </AnimatedSection>
      </Container>
    </section>
  );
}
