import { HeroSection } from "./HeroSection";
import { ClubAdvantageSection } from "./ClubAdvantageSection";
import { TargetAudienceSection } from "./TargetAudienceSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { SocialProofSection } from "./SocialProofSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { AboutSection } from "./AboutSection";
import { FinalCTASection } from "./FinalCTASection";

/**
 * Home page component - Landing page for the Macon AI Solutions platform
 *
 * This component orchestrates all the landing page sections including:
 * - Hero section with main call-to-action
 * - Club advantage features (Three Pillars of Growth)
 * - Target audience segments
 * - Customer testimonials
 * - Social proof statistics
 * - How it works process
 * - About company section
 * - Final CTA section
 */
export function Home() {
  return (
    <main>
      <HeroSection />
      <ClubAdvantageSection />
      <TargetAudienceSection />
      <TestimonialsSection />
      <SocialProofSection />
      <HowItWorksSection />
      <AboutSection />
      <FinalCTASection />
    </main>
  );
}