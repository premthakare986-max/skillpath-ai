import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass, Bell, Menu, X, Check,
  ChevronDown, LogOut, User as UserIcon, Shield, Sparkles, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from '../../context/NotificationContext.js';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isPublicPage = ['/', '/about', '/how-it-works', '/features', '/careers', '/contact', '/login', '/signup'].includes(currentPath);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    onNavigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isPublicPage && onOpenMobileMenu && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onOpenMobileMenu}
              className="mr-1 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open sidebar navigation"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          )}

          <button
            onClick={() => onNavigate(user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/')}
            className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20"
            >
              <Compass className="h-5 w-5 transition-transform group-hover:rotate-12 duration-300" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SkillPath <span className="text-blue-400 font-semibold text-[10px] sm:text-xs tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/60">AI</span>
              </span>
            </div>
          </button>
        </div>

        {/* Public Navigation Links */}
        {isPublicPage && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => onNavigate('/')}
              className={`transition-colors hover:text-white ${currentPath === '/' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('/how-it-works')}
              className={`transition-colors hover:text-white ${currentPath === '/how-it-works' ? 'text-blue-400 font-semibold' : ''}`}
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('/features')}
              className={`transition-colors hover:text-white ${currentPath === '/features' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Features
            </button>
            <button
              onClick={() => onNavigate('/careers')}
              className={`transition-colors hover:text-white ${currentPath === '/careers' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Career Tracks
            </button>
            <button
              onClick={() => onNavigate('/about')}
              className={`transition-colors hover:text-white ${currentPath === '/about' ? 'text-blue-400 font-semibold' : ''}`}
            >
              About
            </button>
            <button
              onClick={() => onNavigate('/contact')}
              className={`transition-colors hover:text-white ${currentPath === '/contact' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Contact
            </button>
          </nav>
        )}

        {/* Right Section Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Notifications Dropdown */}
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="View notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-72 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl z-50"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-xs text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/40">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50 mt-2">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id)}
                              className={`py-3 px-2 rounded-lg cursor-pointer transition-colors ${n.read ? 'opacity-70 hover:bg-slate-800/30' : 'bg-blue-950/20 hover:bg-blue-950/40'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-white">{n.title}</span>
                                {!n.read && <span className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0 mt-1" />}
                              </div>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-500 mt-1.5 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Avatar & Menu */}
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-xl p-1 text-slate-300 hover:bg-slate-800/80 transition-colors focus:outline-none min-h-[44px]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900/60 text-blue-300 border border-blue-700/50 text-xs font-bold overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                    ) : (
                      user.fullName ? user.fullName[0].toUpperCase() : 'U'
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-slate-200 max-w-[100px] md:max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md py-2 shadow-2xl z-50 text-xs"
                    >
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="font-semibold text-slate-200 truncate">{user.fullName}</p>
                        <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                        <span className="mt-1 inline-block text-[10px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                          {user.role === 'admin' ? 'Administrator' : 'Student Account'}
                        </span>
                      </div>

                      <div className="py-1">
                        {user.role === 'admin' ? (
                          <>
                            <button
                              onClick={() => { setShowUserMenu(false); onNavigate('/admin'); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white text-left transition-colors"
                            >
                              <Shield className="h-4 w-4 text-purple-400" />
                              Admin Console
                            </button>
                            <button
                              onClick={() => { setShowUserMenu(false); onNavigate('/dashboard'); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white text-left transition-colors"
                            >
                              <Compass className="h-4 w-4 text-blue-400" />
                              Student View
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setShowUserMenu(false); onNavigate('/dashboard'); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white text-left transition-colors"
                            >
                              <Compass className="h-4 w-4 text-blue-400" />
                              Dashboard
                            </button>
                            <button
                              onClick={() => { setShowUserMenu(false); onNavigate('/profile'); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white text-left transition-colors"
                            >
                              <UserIcon className="h-4 w-4 text-slate-400" />
                              My Profile
                            </button>
                            <button
                              onClick={() => { setShowUserMenu(false); onNavigate('/privacy'); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white text-left transition-colors"
                            >
                              <Shield className="h-4 w-4 text-emerald-400" />
                              Privacy Center
                            </button>
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-800 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-950/20 text-left transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onNavigate('/login')}
                className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors min-h-[44px] flex items-center"
              >
                Log In
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/signup')}
                className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all min-h-[44px] flex items-center"
              >
                Build Roadmap
              </motion.button>
            </div>
          )}

          {/* Mobile public nav trigger */}
          {isPublicPage && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle mobile menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          )}
        </div>
      </div>

      {/* Mobile Public Navigation Drawer with smooth AnimatePresence */}
      <AnimatePresence>
        {isPublicPage && mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-lg px-4 py-4 md:hidden overflow-hidden"
          >
            <nav className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/'); }}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] flex items-center"
              >
                Home
              </button>
              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/how-it-works'); }}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] flex items-center"
              >
                How It Works
              </button>
              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/features'); }}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] flex items-center"
              >
                Features
              </button>
              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/careers'); }}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] flex items-center"
              >
                Career Tracks
              </button>
              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/about'); }}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] flex items-center"
              >
                About
              </button>
              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/contact'); }}
                className="text-left py-2.5 px-3 rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] flex items-center"
              >
                Contact
              </button>
              <div className="border-t border-slate-800 pt-3 mt-1 flex flex-col gap-2">
                <button
                  onClick={() => { setMobileNavOpen(false); onNavigate('/login'); }}
                  className="w-full py-3 text-center text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors min-h-[44px] flex items-center justify-center"
                >
                  Log In
                </button>
                <button
                  onClick={() => { setMobileNavOpen(false); onNavigate('/signup'); }}
                  className="w-full py-3 text-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow transition-colors min-h-[44px] flex items-center justify-center"
                >
                  Build My Roadmap
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

