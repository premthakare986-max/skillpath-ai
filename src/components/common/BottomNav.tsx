import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Map, Award, Bot, Menu } from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenMoreMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate, onOpenMoreMenu }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Roadmap', path: '/roadmap', icon: Map },
    { label: 'Skills', path: '/skills', icon: Award },
    { label: 'AI Mentor', path: '/mentor', icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-2 md:hidden pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;

        return (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate(item.path)}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px] touch-manipulation ${
              isActive ? 'text-blue-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -top-2.5 h-1 w-8 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Icon className={`h-5 w-5 transition-transform ${isActive ? 'text-blue-400 scale-105' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </motion.button>
        );
      })}

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onOpenMoreMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-200 min-h-[48px] touch-manipulation"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10px] mt-1 tracking-tight">More</span>
      </motion.button>
    </nav>
  );
};

