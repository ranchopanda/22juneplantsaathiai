import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function FadeIn({ children, className }: TransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({ children, className }: TransitionProps) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className }: TransitionProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children }: TransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Accessibility-focused transitions
export function FocusTransition({ children, className }: TransitionProps) {
  return (
    <motion.div
      whileFocus={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn("focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50", className)}
    >
      {children}
    </motion.div>
  );
}

export function HoverTransition({ children, className }: TransitionProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
} 