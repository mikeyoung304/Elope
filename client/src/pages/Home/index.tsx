import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { ServicesSection } from "./ServicesSection";
import { StorefrontSection } from "./StorefrontSection";
import { CollectiveSection } from "./CollectiveSection";
import { FutureStateSection } from "./FutureStateSection";
import { WaitlistCTASection } from "./WaitlistCTASection";

/**
 * Home page - Pre-Launch Waitlist Landing
 *
 * Full-featured landing page with exclusive positioning.
 * Targeting select service businesses: wedding photographers,
 * elopement agencies, horse farms, event planners.
 *
 * Section flow:
 * 1. Hero - Transformation headline + email capture
 * 2. Problem - Pain points they recognize (builds trust)
 * 3. Services - Overview of 3 core offerings
 * 4. Storefront - Deep dive on 3-tier model
 * 5. Collective - The team/partnership angle
 * 6. FutureState - The transformation narrative
 * 7. WaitlistCTA - Final email capture
 *
 * Additional sections archived in ./_archive/ for future use.
 */
export function Home() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <ServicesSection />
      <StorefrontSection />
      <CollectiveSection />
      <FutureStateSection />
      <WaitlistCTASection />
    </main>
  );
}
