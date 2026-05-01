import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  CalendarDays,
  LogOut,
  Timer,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import LessonTracker from './components/LessonTracker.jsx';
import ExamCountdown from './components/ExamCountdown.jsx';
import Timetable from './components/Timetable.jsx';
import CourseManagement from './components/CourseManagement.jsx';
import Pomodoro from './components/Pomodoro.jsx';
import Settings from './components/Settings.jsx';
import TimetableNotificationScheduler from './components/TimetableNotificationScheduler.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import Onboarding from './components/Onboarding.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import { useAuth } from './context/AuthContext.jsx';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tracker', label: 'Tracker', icon: BookOpen },
  { path: '/countdown', label: 'Exams', icon: Clock },
  { path: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { path: '/timetable', label: 'Timetable', icon: CalendarDays },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function App() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { loading, isAuthenticated, onboardingComplete, signOut, user, setupError } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  const sidebarWidth = sidebarCollapsed ? 64 : 220;

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY || 0;
      const delta = currentY - lastScrollYRef.current;
      if (currentY < 8) {
        setMobileHeaderVisible(true);
      } else if (delta > 6) {
        setMobileHeaderVisible(false);
      } else if (delta < -6) {
        setMobileHeaderVisible(true);
      }
      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileHeaderVisible(true);
    lastScrollYRef.current = window.scrollY || 0;
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="app-loading-screen">
        <span className="app-loading-mark">FocusPoint</span>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;
  if (!onboardingComplete) return <Onboarding />;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-primary)' }}>
      <TimetableNotificationScheduler />

      {/* ===== Desktop Sidebar (collapsible) ===== */}
      <aside
        className="sidebar hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30"
        style={{ width: sidebarWidth, transition: 'width 0.2s ease' }}
      >
        {/* Logo row */}
        <div className="flex items-center justify-evenly h-14 shrink-0 px-4 gap-2.5 overflow-hidden m-1">
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
              FocusPoint
            </span>
          )}
          <button
            className="ml-auto p-1.5 rounded-md shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ color: 'var(--text-muted)' }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 mt-1 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              id={`nav-${item.path.replace('/', '') || 'dashboard'}`}
              className={({ isActive }) =>
                `sidebar-link w-full ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: theme toggle */}
        <div className="space-y-2 px-2 py-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          {!sidebarCollapsed && (
            <div className="sidebar-user-chip">
              <strong>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}</strong>
              <span>{user?.email}</span>
            </div>
          )}
          <button
            id="theme-toggle-desktop"
            type="button"
            className={`theme-shortcut theme-shortcut--desktop w-full ${sidebarCollapsed ? 'is-collapsed' : ''}`}
            title={sidebarCollapsed ? `Switch to ${isDark ? 'light' : 'dark'} mode` : undefined}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
          >
            <span className="theme-shortcut-icon" aria-hidden="true">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </span>
            {!sidebarCollapsed && (
              <span className="theme-shortcut-copy">
                <strong>{isDark ? 'Light mode' : 'Dark mode'}</strong>
                <small>Switch appearance</small>
              </span>
            )}
          </button>
          <button
            type="button"
            className={`theme-shortcut theme-shortcut--desktop w-full ${sidebarCollapsed ? 'is-collapsed' : ''}`}
            title={sidebarCollapsed ? 'Sign out' : undefined}
            aria-label="Sign out"
            onClick={signOut}
          >
            <span className="theme-shortcut-icon" aria-hidden="true">
              <LogOut className="w-4 h-4" />
            </span>
            {!sidebarCollapsed && (
              <span className="theme-shortcut-copy">
                <strong>Sign out</strong>
                <small>Leave this device</small>
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ===== Mobile Top Bar ===== */}
      <header
        className={`mobile-top-header lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-12 border-b transition-transform duration-200 ${
          mobileHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ background: 'var(--surface-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>FocusPoint</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="theme-toggle-mobile"
            className="theme-shortcut theme-shortcut--mobile"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            className="theme-shortcut theme-shortcut--mobile"
            aria-label="Sign out"
            title="Sign out"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main
        className="app-main flex-1 min-h-screen transition-[padding-top] duration-200"
        style={{
          '--sidebar-w': `${sidebarWidth}px`,
          '--mobile-header-offset': mobileHeaderVisible ? '48px' : '8px',
        }}
      >
        <div className="page-wrapper">
          {setupError && (
            <div className="supabase-setup-alert" role="alert">
              Supabase setup needs attention: {setupError}
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tracker" element={<LessonTracker />} />
            <Route path="/courses" element={<CourseManagement />} />
            <Route path="/countdown" element={<ExamCountdown />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* ===== Mobile Bottom Nav ===== */}
      <div className="bottom-nav lg:hidden flex items-center justify-around">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            id={`bottom-nav-${item.path.replace('/', '') || 'dashboard'}`}
            className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            title={item.label}
          >
            <item.icon className="w-[21px] h-[21px]" />
            <span className="sr-only">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
