import { Container } from "@/ui/Container";

/**
 * FutureStateSection - StoryBrand-Style Future State Narrative
 *
 * Paints the transformation picture: from inquiry to paid booking without the chase.
 * Emotional, aspirational, outcome-focused.
 */
export function FutureStateSection() {
  return (
    <section
      id="future-state"
      aria-labelledby="future-state-heading"
      className="py-24 sm:py-32 bg-surface"
    >
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          {/* Section headline */}
          <h2
            id="future-state-heading"
            className="font-serif text-4xl sm:text-5xl font-bold text-text-primary mb-12"
          >
            From inquiry to paid booking—without the chase
          </h2>

          {/* Narrative */}
          <div className="bg-surface-alt rounded-2xl p-8 sm:p-12 mb-8">
            <p className="text-xl text-text-muted leading-relaxed mb-6">
              A couple finds your elopement services. They land on a page with three clear options. They choose a package, see available dates, answer a few guided questions, sign the agreement, and pay a deposit—without a single email thread.
            </p>
            <p className="text-2xl sm:text-3xl text-text-primary font-serif italic">
              You wake up to a notification: "New booking confirmed." Your calendar is fuller. Your inbox is quieter.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
