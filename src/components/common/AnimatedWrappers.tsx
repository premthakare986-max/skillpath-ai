import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

/**
 * Common motion easing curve: refined cubic-bezier for natural settling without bouncy AI slop
 */
export const smoothEase = [0.16, 1, 0.3, 1] as const;

/**
 * FadeIn Component: Scroll-reveal or mount entrance
 */
interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  yOffset?: number;
  scaleFrom?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.45,
  yOffset = 14,
  scaleFrom = 0.98,
  className = '',
  ...rest
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, scale: scaleFrom }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-24px' }}
      transition={{ duration, delay, ease: smoothEase }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * CardReveal Component: Standard scale 0.96 -> 1 + fade in with subtle hover/tap feedback
 */
interface CardRevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  hoverEffect?: boolean;
}

export const CardReveal: React.FC<CardRevealProps> = ({
  children,
  delay = 0,
  hoverEffect = true,
  className = '',
  ...rest
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2, ease: smoothEase } } : undefined}
      whileTap={hoverEffect ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.4, delay, ease: smoothEase }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer & StaggerItem for sequential card reveals
 */
export const StaggerContainer: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  className = '',
  ...rest
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-20px' }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  className = '',
  ...rest
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14, scale: 0.96 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.4, ease: smoothEase },
        },
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedProgressBar: Smoothly animates width fill
 */
interface AnimatedProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  barClassName?: string;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  className = 'h-2 w-full bg-slate-800 rounded-full overflow-hidden',
  barClassName = 'bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={className}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: smoothEase }}
        className={barClassName}
      />
    </div>
  );
};

/**
 * MotionButton: Micro-animation for buttons with subtle hover lift and tap compression
 */
interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const MotionButton: React.FC<MotionButtonProps> = ({
  children,
  className = '',
  onClick,
  disabled,
  type = 'button',
  ...rest
}) => {
  return (
    <motion.button
      type={type}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15, ease: smoothEase }}
      onClick={onClick}
      disabled={disabled}
      className={`touch-manipulation ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
};

/**
 * ModalWrapper: Scale 0.95 -> 1.0 + fade in, with responsive viewport safety
 */
interface ModalWrapperProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  backdropClassName?: string;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  children,
  isOpen,
  onClose,
  className = 'relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto',
  backdropClassName = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm'
}) => {
  if (!isOpen) return null;

  return (
    <div className={backdropClassName} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.25, ease: smoothEase }}
        onClick={(e) => e.stopPropagation()}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
};

/**
 * PopHighlight: Subtle pop effect on updates (e.g. Next Best Action, verified skill, scores)
 */
export const PopHighlight: React.FC<{ children: React.ReactNode; triggerKey?: any; className?: string }> = ({
  children,
  triggerKey,
  className = ''
}) => {
  return (
    <motion.div
      key={triggerKey}
      initial={{ scale: 0.97, opacity: 0.9 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: smoothEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

