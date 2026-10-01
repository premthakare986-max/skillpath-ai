import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Sidebar } from './components/common/Sidebar.js';
import { BottomNav } from './components/common/BottomNav.js';
import { Footer } from './components/common/Footer.js';
import { CelebrationModal } from './components/common/CelebrationModal.js';
import { AmbientBackground } from './components/common/AmbientBackground.js';

// Public Pages
import { HomePage } from './pages/public/HomePage.js';
import { AboutPage } from './pages/public/AboutPage.js';
import { HowItWorksPage } from './pages/public/HowItWorksPage.js';
import { FeaturesPage } from './pages/public/FeaturesPage.js';
import { CareersPage } from './pages/public/CareersPage.js';
import { ContactPage } from './pages/public/ContactPage.js';
import { LoginPage } from './pages/public/LoginPage.js';
import { SignupPage } from './pages/public/SignupPage.js';

// Student Pages
import { DashboardPage } from './pages/student/DashboardPage.js';
import { OnboardingPage } from './pages/student/OnboardingPage.js';
import { RoadmapPage } from './pages/student/RoadmapPage.js';
import { SkillsPage } from './pages/student/SkillsPage.js';
import { AssessmentsPage } from './pages/student/AssessmentsPage.js';
import { ResourcesPage } from './pages/student/ResourcesPage.js';
import { ProjectsPage } from './pages/student/ProjectsPage.js';
import { OpportunitiesPage } from './pages/student/OpportunitiesPage.js';
import { ApplicationsPage } from './pages/student/ApplicationsPage.js';
import { ProgressPage } from './pages/student/ProgressPage.js';
import { MentorPage } from './pages/student/MentorPage.js';
import { ProfilePage } from './pages/student/ProfilePage.js';
import { SettingsPage } from './pages/student/SettingsPage.js';
import { PrivacyPage } from './pages/student/PrivacyPage.js';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminInquiriesPage } from './pages/admin/AdminInquiriesPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminCareersPage } from './pages/admin/AdminCareersPage.js';
import { AdminSkillsPage } from './pages/admin/AdminSkillsPage.js';
import { AdminDependenciesPage } from './pages/admin/AdminDependenciesPage.js';
import { AdminResourcesPage } from './pages/admin/AdminResourcesPage.js';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage.js';
import { AdminOpportunitiesPage } from './pages/admin/AdminOpportunitiesPage.js';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage.js';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const basePath = currentPath.split('?')[0];

  const isPublic = [
    '/', '/about', '/how-it-works', '/features', '/careers', '/contact', '/login', '/signup'
  ].includes(basePath);

  const isAdminRoute = basePath.startsWith('/admin');

  // Handle protected route redirection
  useEffect(() => {
    if (!loading) {
      if (!user && !isPublic) {
        navigate('/login');
      } else if (user && isAdminRoute && user.role !== 'admin') {
        navigate('/dashboard');
      } else if (user && (basePath === '/login' || basePath === '/signup')) {
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (!user.onboardingCompleted) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [user, loading, basePath, isPublic, isAdminRoute]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Render Page Content
  const renderPage = () => {
    switch (basePath) {
      // Public
      case '/':
        return <HomePage onNavigate={navigate} />;
      case '/about':
        return <AboutPage onNavigate={navigate} />;
      case '/how-it-works':
        return <HowItWorksPage onNavigate={navigate} />;
      case '/features':
        return <FeaturesPage onNavigate={navigate} />;
      case '/careers':
        return <CareersPage onNavigate={navigate} />;
      case '/contact':
        return <ContactPage />;
      case '/login':
        return <LoginPage onNavigate={navigate} />;
      case '/signup':
        return <SignupPage onNavigate={navigate} />;

      // Student
      case '/onboarding':
        return <OnboardingPage onNavigate={navigate} />;
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case '/roadmap':
        return <RoadmapPage onNavigate={navigate} />;
      case '/skills':
        return <SkillsPage onNavigate={navigate} />;
      case '/assessments':
        return <AssessmentsPage onNavigate={navigate} />;
      case '/resources':
        return <ResourcesPage onNavigate={navigate} />;
      case '/projects':
        return <ProjectsPage onNavigate={navigate} />;
      case '/opportunities':
        return <OpportunitiesPage onNavigate={navigate} />;
      case '/applications':
        return <ApplicationsPage onNavigate={navigate} />;
      case '/progress':
        return <ProgressPage onNavigate={navigate} />;
      case '/mentor':
        return <MentorPage onNavigate={navigate} />;
      case '/profile':
        return <ProfilePage onNavigate={navigate} />;
      case '/settings':
        return <SettingsPage />;
      case '/privacy':
        return <PrivacyPage onNavigate={navigate} />;

      // Admin
      case '/admin':
        return <AdminDashboardPage onNavigate={navigate} />;
      case '/admin/inquiries':
        return <AdminInquiriesPage onNavigate={navigate} />;
      case '/admin/users':
        return <AdminUsersPage onNavigate={navigate} />;
      case '/admin/careers':
        return <AdminCareersPage onNavigate={navigate} />;
      case '/admin/skills':
        return <AdminSkillsPage onNavigate={navigate} />;
      case '/admin/dependencies':
        return <AdminDependenciesPage onNavigate={navigate} />;
      case '/admin/resources':
        return <AdminResourcesPage onNavigate={navigate} />;
      case '/admin/projects':
        return <AdminProjectsPage onNavigate={navigate} />;
      case '/admin/opportunities':
        return <AdminOpportunitiesPage onNavigate={navigate} />;
      case '/admin/analytics':
        return <AdminAnalyticsPage onNavigate={navigate} />;
      case '/admin/reports':
        return <AdminReportsPage onNavigate={navigate} />;
      case '/admin/settings':
        return <AdminSettingsPage onNavigate={navigate} />;

      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  const showAppShell = user && !isPublic && currentPath !== '/onboarding';

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Premium Subtle Ambient Glowing Background */}
      <AmbientBackground />

      {/* Top Navigation */}
      <div className="relative z-20">
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
        />
      </div>

      {/* Main Body */}
      {showAppShell ? (
        <div className="relative z-10 flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            currentPath={currentPath}
            onNavigate={navigate}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          {/* Main Workspace with mobile bottom padding */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-10">
            {renderPage()}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav
            currentPath={currentPath}
            onNavigate={navigate}
            onOpenMoreMenu={() => setMobileSidebarOpen(true)}
          />
        </div>
      ) : (
        <div className="relative z-10 flex-1">
          {renderPage()}
          {isPublic && <Footer onNavigate={navigate} />}
        </div>
      )}

      {/* Pop-in Celebration Modal */}
      <CelebrationModal onViewRoadmap={() => navigate('/roadmap')} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
