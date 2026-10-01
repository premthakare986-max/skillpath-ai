import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';
import { MotionButton, smoothEase } from './AnimatedWrappers.js';

interface CelebrationModalProps {
  onViewRoadmap?: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ onViewRoadmap }) => {
  const { celebration, closeCelebration } = useNotifications();

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
          onClick={closeCelebration}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.3, ease: smoothEase }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-blue-500/30 bg-slate-900 p-5 sm:p-6 shadow-2xl shadow-blue-500/10 text-center"
          >
            <button
              onClick={closeCelebration}
              className="absolute top-3.5 right-3.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Close celebration modal"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.35, ease: smoothEase }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 text-emerald-400 border border-emerald-500/30 mb-3 sm:mb-4"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </motion.div>

            <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-800/40 mb-2">
              {celebration.badge || 'Milestone Completed'}
            </span>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {celebration.title}
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {celebration.subtitle}
            </p>

            <div className="mt-4 rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 text-xs text-slate-400 flex items-center gap-2 text-left">
              <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>Roadmap and Next Best Action dynamically recalculated based on your updated state.</span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <MotionButton
                onClick={() => {
                  closeCelebration();
                  if (onViewRoadmap) onViewRoadmap();
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all min-h-[44px] cursor-pointer"
              >
                <span>View Updated Roadmap</span>
                <ArrowRight className="h-4 w-4" />
              </MotionButton>
              <MotionButton
                onClick={closeCelebration}
                className="rounded-xl border border-slate-700 bg-slate-800/80 py-3 px-4 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all min-h-[44px] cursor-pointer"
              >
                Continue
              </MotionButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

