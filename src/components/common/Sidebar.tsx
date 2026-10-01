import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Map, Award, CheckSquare, BookOpen,
  Briefcase, Send, TrendingUp, Bot, User,
  Shield, Users, Network, FolderGit2, BarChart2,
  FileText, Sliders, X, Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Personalized Roadmap', path: '/roadmap', icon: Map },
    { label: 'Skills & Gaps', path: '/skills', icon: Award },
    { label: 'Assessments', path: '/assessments', icon: CheckSquare },
    { label: 'Learning Resources', path: '/resources', icon: BookOpen },
    { label: 'Recommended Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Internships & Matches', path: '/opportunities', icon: Briefcase },
    { label: 'Application Tracker', path: '/applications', icon: Send },
    { label: 'DSA & Progress', path: '/progress', icon: TrendingUp },
    { label: 'AI Career Mentor', path: '/mentor', icon: Bot, highlight: true },
    { label: 'Student Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Sliders },
    { label: 'Privacy Center', path: '/privacy', icon: Shield },
  ];

  const adminNavItems: NavItem[] = [
    { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Contact Inquiries', path: '/admin/inquiries', icon: Mail },
    { label: 'Manage Users', path: '/admin/users', icon: Users },
    { label: 'Career Templates', path: '/admin/careers', icon: Briefcase },
    { label: 'Skills Catalog', path: '/admin/skills', icon: Award },
    { label: 'Skill Dependencies', path: '/admin/dependencies', icon: Network },
    { label: 'Verified Resources', path: '/admin/resources', icon: BookOpen },
    { label: 'Project Templates', path: '/admin/projects', icon: FolderGit2 },
    { label: 'Internship Listings', path: '/admin/opportunities', icon: Send },
    { label: 'Platform Analytics', path: '/admin/analytics', icon: BarChart2 },
    { label: 'Audit Reports', path: '/admin/reports', icon: FileText },
    { label: 'Admin Settings', path: '/admin/settings', icon: Sliders },
  ];

  const navItems = isAdmin && currentPath.startsWith('/admin') ? adminNavItems : studentNavItems;

  const handleNavClick = (path: string) => {
    onNavigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex h-full flex-col justify-between py-4">
      <div>
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 pb-4 md:hidden border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {isAdmin && currentPath.startsWith('/admin') ? 'Admin Navigation' : 'SkillPath Menu'}
          </span>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section title */}
        <div className="px-4 py-2 hidden md:block">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {isAdmin && currentPath.startsWith('/admin') ? 'Administration' : 'Career Progression'}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="mt-2 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span className="truncate">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[9px] uppercase tracking-wider font-semibold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info in sidebar */}
      <div className="px-4 pt-4 border-t border-slate-800/60">
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Career Engine</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Continuous Closed-Loop State
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 border-r border-slate-800/80 bg-slate-950/50 backdrop-blur-sm">
        {content}
      </aside>

      {/* Mobile Drawer with smooth slide-in */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onCloseMobile}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-slate-950 border-r border-slate-800 shadow-2xl z-10 overflow-y-auto"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
