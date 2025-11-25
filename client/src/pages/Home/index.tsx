import { HeroSection } from "./HeroSection";
import { SegmentSection } from "./SegmentSection";
import { StorySection } from "./StorySection";
import { ValueSection } from "./ValueSection";
import { CustomerStorySection } from "./CustomerStorySection";
import { CTASection } from "./CTASection";

/**
 * Home page - Stories That Stick Framework
 *
 * Minimal, impactful landing page using Kindra Hall's storytelling patterns:
 * 1. Hero - The Hook (provocative question, creates tension)
 * 2. Story - Founder + Purpose (emotional connection)
 * 3. Value - Three transformations (before/after benefits)
 * 4. Customer Story - Single powerful testimonial (proof)
 * 5. CTA - Clear next step (resolution)
 */
export function Home() {
  return (
    <main>
      <HeroSection />
      <SegmentSection />
      <StorySection />
      <ValueSection />
      <CustomerStorySection />
      <CTASection />
    </main>
  );
}
