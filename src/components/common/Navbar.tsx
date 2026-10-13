import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  LogOut,
  Sparkles,
  Compass,
  FolderKanban,
  FileText,
  DollarSign,
  Star,
  Building,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, profile, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCreatorNavItems = () => [
    { id: 'creator-dashboard', label: 'Dashboard', icon: FolderKanban },
    { id: 'creator-portfolio', label: 'Portfolio & Rates', icon: Sparkles },
    { id: 'creator-invitations', label: 'Invitations', icon: FileText },
    { id: 'creator-projects', label: 'Projects', icon: FolderKanban },
    { id: 'creator-payments', label: 'Earnings', icon: DollarSign },
    { id: 'creator-reviews', label: 'Reviews', icon: Star },
  ];

  const getAgencyNavItems = () => [
    { id: 'agency-discovery', label: 'Find Creators', icon: Compass },
    { id: 'agency-dashboard', label: 'Dashboard', icon: FolderKanban },
    { id: 'agency-invitations', label: 'Invitations', icon: FileText },
    { id: 'agency-projects', label: 'Projects', icon: FolderKanban },
    { id: 'agency-payments', label: 'Payments', icon: DollarSign },
    { id: 'agency-reviews', label: 'Reviews', icon: Star },
    { id: 'agency-profile', label: 'Profile & Verification', icon: Building },
  ];

  const navItems = user
    ? user.role === 'creator'
      ? getCreatorNavItems()
      : getAgencyNavItems()
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate(user ? `${user.role}-dashboard` : 'landing')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              CB
            </div>
            <div>
              <span className="font-semibold text-base text-slate-950 tracking-tight block">
                CreatorBridge
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                AI Commercial Marketplace
              </span>
            </div>
          </button>

          {/* Desktop Nav Items */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 stroke-[1.75]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <span className="text-xs font-semibold text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) {
                                // Extract route
                                const path = n.link.split('?')[0].replace('/', '');
                                const viewMap: Record<string, string> = {
                                  'creator/invitations': 'creator-invitations',
                                  'agency/invitations': 'agency-invitations',
                                  'creator/projects': 'creator-projects',
                                  'agency/projects': 'agency-projects',
                                  'creator/payments': 'creator-payments',
                                  'agency/payments': 'agency-payments',
                                  'creator/reviews': 'creator-reviews',
                                  'agency/reviews': 'agency-reviews',
                                };
                                const target = viewMap[path] || currentView;
                                onNavigate(target);
                                setShowNotifications(false);
                              }
                            }}
                            className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                              !n.is_read ? 'bg-indigo-50/40' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                                {n.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-medium flex items-center justify-center">
                  {user.email.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-slate-900 block line-clamp-1 max-w-[120px]">
                    {(profile as any)?.full_name || (profile as any)?.agency_name || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    {user.role === 'creator' ? 'AI Creator' : 'Agency'}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={async () => {
                  await logout();
                  onNavigate('landing');
                }}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4 stroke-[1.75]" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('creator-login')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                Creator Login
              </button>
              <button
                onClick={() => onNavigate('agency-login')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-sm cursor-pointer"
              >
                Agency Login
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md text-left ${
                currentView === item.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
