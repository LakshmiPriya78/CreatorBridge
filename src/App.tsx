import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ToastAlert } from './components/common/ToastAlert';
import { LandingPage } from './pages/LandingPage';
import { CreatorLogin } from './pages/auth/CreatorLogin';
import { CreatorRegister } from './pages/auth/CreatorRegister';
import { AgencyLogin } from './pages/auth/AgencyLogin';
import { AgencyRegister } from './pages/auth/AgencyRegister';
import { TermsPage } from './pages/terms/TermsPage';

// Creator Views
import { CreatorDashboard } from './pages/creator/CreatorDashboard';
import { PortfolioManager } from './pages/creator/PortfolioManager';
import { CreatorInvitations } from './pages/creator/CreatorInvitations';
import { CreatorProjects } from './pages/creator/CreatorProjects';
import { CreatorEarnings } from './pages/creator/CreatorEarnings';
import { CreatorReviews } from './pages/creator/CreatorReviews';

// Agency Views
import { AgencyDashboard } from './pages/agency/AgencyDashboard';
import { CreatorDiscovery } from './pages/agency/CreatorDiscovery';
import { AgencyInvitations } from './pages/agency/AgencyInvitations';
import { AgencyProjects } from './pages/agency/AgencyProjects';
import { AgencyPayments } from './pages/agency/AgencyPayments';
import { AgencyReviews } from './pages/agency/AgencyReviews';
import { AgencyProfilePage } from './pages/agency/AgencyProfilePage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');

  // Role guarding and routing sync
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // If user logs out or is unauthenticated, allow public views
      if (
        !['landing', 'creator-login', 'creator-register', 'agency-login', 'agency-register'].includes(
          currentView
        )
      ) {
        setCurrentView('landing');
      }
    } else {
      // User is authenticated
      if (!user.hasAcceptedTerms) {
        setCurrentView('terms');
      } else {
        // Enforce role separation
        if (user.role === 'creator') {
          if (currentView.startsWith('agency-') || currentView === 'landing' || currentView.includes('login') || currentView.includes('register')) {
            setCurrentView('creator-dashboard');
          }
        } else if (user.role === 'agency') {
          if (currentView.startsWith('creator-') || currentView === 'landing' || currentView.includes('login') || currentView.includes('register')) {
            setCurrentView('agency-dashboard');
          }
        }
      }
    }
  }, [user, isLoading, currentView]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs">
        Initializing CreatorBridge...
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      // Public & Auth
      case 'landing':
        return <LandingPage onNavigate={setCurrentView} />;
      case 'creator-login':
        return <CreatorLogin onNavigate={setCurrentView} />;
      case 'creator-register':
        return <CreatorRegister onNavigate={setCurrentView} />;
      case 'agency-login':
        return <AgencyLogin onNavigate={setCurrentView} />;
      case 'agency-register':
        return <AgencyRegister onNavigate={setCurrentView} />;
      case 'terms':
        return <TermsPage onNavigate={setCurrentView} />;

      // Creator
      case 'creator-dashboard':
        return <CreatorDashboard onNavigate={setCurrentView} />;
      case 'creator-portfolio':
        return <PortfolioManager onNavigate={setCurrentView} />;
      case 'creator-invitations':
        return <CreatorInvitations onNavigate={setCurrentView} />;
      case 'creator-projects':
        return <CreatorProjects onNavigate={setCurrentView} />;
      case 'creator-payments':
        return <CreatorEarnings onNavigate={setCurrentView} />;
      case 'creator-reviews':
        return <CreatorReviews />;

      // Agency
      case 'agency-dashboard':
        return <AgencyDashboard onNavigate={setCurrentView} />;
      case 'agency-discovery':
        return <CreatorDiscovery onNavigate={setCurrentView} />;
      case 'agency-invitations':
        return <AgencyInvitations onNavigate={setCurrentView} />;
      case 'agency-projects':
        return <AgencyProjects onNavigate={setCurrentView} />;
      case 'agency-payments':
        return <AgencyPayments onNavigate={setCurrentView} />;
      case 'agency-reviews':
        return <AgencyReviews />;
      case 'agency-profile':
        return <AgencyProfilePage />;

      default:
        return <LandingPage onNavigate={setCurrentView} />;
    }
  };

  const isAuthOrLanding = [
    'landing',
    'creator-login',
    'creator-register',
    'agency-login',
    'agency-register',
    'terms',
  ].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      <Navbar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1">{renderView()}</main>
      <Footer />
      <ToastAlert onNavigate={setCurrentView} />
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
