/**
 * PageTransition - Smooth fade-in animation for route changes
 *
 * Features:
 * - Subtle fade-in with slight vertical movement (opacity 0→1, translateY 8px→0)
 * - Respects reduced-motion preferences (automatically via Framer Motion)
 * - Disabled in E2E test mode for deterministic tests
 * - Performant (uses transform/opacity only, GPU-accelerated)
 * - Smooth easing curve (custom cubic-bezier)
 *
 * Implementation Notes:
 * - Framer Motion automatically respects `prefers-reduced-motion: reduce`
 * - When reduced motion is preferred, animations are instant (0ms duration)
 * - AnimatePresence in AppShell enables exit animations
 * - Key is set to location.pathname for proper animation triggers
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const isE2EMode = import.meta.env.VITE_E2E === '1';

// Animation variants - subtle and professional
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8, // Slight downward start position
  },
  animate: {
    opacity: 1,
    y: 0, // Slide to natural position
  },
  exit: {
    opacity: 0,
    y: -8, // Slight upward exit (creates smooth transition feel)
  },
};

// Timing configuration - fast and smooth
const pageTransition = {
  duration: 0.25, // 250ms - perceptible but not slow
  ease: [0.22, 1, 0.36, 1], // Custom easing curve (similar to ease-out-expo)
};

export function PageTransition({ children }: PageTransitionProps) {
  // Disable animations in E2E mode for deterministic tests
  if (isE2EMode) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
