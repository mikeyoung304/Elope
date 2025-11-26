import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

/**
 * SplashScreen - Minimal brand moment with skip functionality
 *
 * - Max 2 seconds before auto-exit
 * - Click anywhere or press any key to skip
 * - Uses new brand colors (cream/sage)
 * - Text-only wordmark (no lotus logo)
 */
export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleSkip = useCallback(() => {
    if (!isExiting) {
      setIsExiting(true);
    }
  }, [isExiting]);

  useEffect(() => {
    // Auto-exit after 2 seconds max
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2000);

    // Complete transition after exit animation (300ms)
    const completeTimer = setTimeout(() => {
      onAnimationComplete();
    }, 2300);

    // Allow skip on any key press
    const handleKeyDown = () => handleSkip();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onAnimationComplete, handleSkip]);

  // Early exit when isExiting becomes true
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(onAnimationComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [isExiting, onAnimationComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: "#FFFBF8" }} // cream/surface color
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleSkip}
          role="button"
          tabIndex={0}
          aria-label="Click or press any key to skip"
        >
          {/* Centered wordmark */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h1
              className="font-serif text-5xl md:text-6xl font-bold tracking-tight"
              style={{ color: "#1A1815" }} // charcoal/text-primary
            >
              MaconAI
            </h1>
            <p
              className="mt-2 text-lg tracking-widest uppercase"
              style={{ color: "#4A7C6F" }} // sage/accent
            >
              Solutions
            </p>
          </motion.div>

          {/* Skip hint */}
          <motion.p
            className="absolute bottom-8 text-sm"
            style={{ color: "#4A4440" }} // text-muted
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.8 }}
          >
            Click or press any key to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
