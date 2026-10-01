import React from 'react';

/**
 * AmbientBackground
 * Premium, subtle AI-SaaS background with soft radial gradients,
 * slow-drifting ambient orbs, and a faint technical grid overlay.
 * Designed to be elegant, calm, non-gaming, readable, and mobile-optimized.
 */
export const AmbientBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Primary ambient glow orbs with slow CSS floating */}
      <div
        className="absolute -top-[10%] left-[15%] h-[500px] w-[500px] sm:h-[650px] sm:w-[650px] rounded-full bg-blue-600/[0.07] blur-[120px] will-change-transform animate-ambient-drift-1"
      />
      <div
        className="absolute top-[35%] -right-[10%] h-[400px] w-[400px] sm:h-[550px] sm:w-[550px] rounded-full bg-indigo-600/[0.06] blur-[130px] will-change-transform animate-ambient-drift-2"
      />
      <div
        className="absolute -bottom-[10%] left-[30%] h-[450px] w-[450px] sm:h-[600px] sm:w-[600px] rounded-full bg-sky-600/[0.05] blur-[140px] will-change-transform animate-ambient-drift-3"
      />

      {/* Very subtle technical grid / dot mesh overlay */}
      <div
        className="absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.25) 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Top subtle vignette to ground the navbar */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-slate-950 via-slate-950/60 to-transparent" />
    </div>
  );
};
