import { useState } from 'react';
import { Link, Outlet, NavLink, Navigate, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, FileText, PlusCircle, Trophy, Map, Heart,
  LogOut, Menu, X, Sun, Moon, Shield, Sparkles,
  BarChart3, Users, Workflow, Building2
} from 'lucide-react';
import { useAuth } from './auth-context';
import { useTheme } from './theme-provider';
import { NotificationBell } from './notification-bell';
import { AIChatWidget } from './ai-chat';
import { paths } from '../paths';
import { useSound, SoundToggleButton } from '../audio/sound-context';
import { APP_TAGLINE } from '../config/app';
import { firstNameOnly } from '../utils/display-name';

export function Layout() {
  const { user, isAdmin, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { play } = useSound();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inAdminSection = pathname === paths.admin || pathname.startsWith(`${paths.admin}/`);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const studentLinks = [
    { to: paths.app, icon: LayoutDashboard, label: 'Dashboard' },
    { to: paths.complaints, icon: FileText, label: 'Thoughts' },
    { to: paths.submit, icon: PlusCircle, label: 'New Thought' },
    { to: paths.leaderboard, icon: Trophy, label: 'Leaderboard' },
    { to: paths.map, icon: Map, label: 'Campus Map' },
    { to: paths.assistant, icon: Sparkles, label: 'AI Assistant' },
    { to: paths.support, icon: Heart, label: 'Dev Support' },
  ];

  const adminLinks = [
    { to: paths.app, icon: LayoutDashboard, label: 'Dashboard' },
    { to: paths.admin, icon: BarChart3, label: 'Analytics' },
    { to: paths.adminComplaints, icon: FileText, label: 'Thoughts' },
    { to: paths.adminUsers, icon: Users, label: 'Users' },
    { to: paths.adminHeatmap, icon: Building2, label: 'Heat Map' },
    { to: paths.adminRules, icon: Workflow, label: 'Workflow Rules' },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="h-screen bg-background lg:p-4">
      <div className="flex h-full overflow-hidden lg:rounded-[1.75rem] lg:border lg:border-border/70 lg:shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:border-r lg:border-sidebar-border ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isAdmin
            ? 'bg-sidebar border-l-4 border-l-[#5c6b4a] dark:border-l-[#6f7a5e] ring-1 ring-[#6f7a5e]/15 dark:ring-[#3d4a38]/40'
            : 'bg-sidebar border-l-4 border-l-primary/40 dark:border-l-primary/30'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
            <Link
              to={paths.landing}
              onClick={() => {
                play('nav');
                setSidebarOpen(false);
              }}
              className="flex items-center gap-2.5 min-w-0 rounded-xl -m-1 p-1 hover:bg-sidebar-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-foreground text-sm" style={{ fontWeight: 700 }}>S</span>
              </div>
              <div className="min-w-0 text-left">
                <h1 className="text-sm text-sidebar-foreground" style={{ fontWeight: 800 }}>Student.Info</h1>
                <p className="text-[10px] text-sidebar-foreground/60">{APP_TAGLINE}</p>
              </div>
            </Link>
            <button
              type="button"
              className="lg:hidden p-1 hover:bg-sidebar-accent rounded-lg"
              onClick={() => {
                play('tap');
                setSidebarOpen(false);
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isAdmin ? (
            <div className="mx-3 mb-1 rounded-xl border border-[#6f7a5e]/45 bg-[#1c2218]/40 dark:bg-[#0d120b]/90 px-3 py-2.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#b8c4a8] dark:text-[#9faa8c]">
                Staff · Operations console
              </p>
              <p className="text-[11px] text-sidebar-foreground/65 mt-1 leading-snug">
                Admin routes and tools. Switch below for the student experience.
              </p>
            </div>
          ) : (
            <div className="mx-3 mb-1 rounded-xl border border-primary/25 bg-primary/[0.07] px-3 py-2.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-primary">Student · Campus app</p>
              <p className="text-[11px] text-sidebar-foreground/65 mt-1 leading-snug">
                Thoughts, map, leaderboard, and your profile.
              </p>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {isAdmin && (
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 px-3 pt-2 pb-1">Admin Portal</p>
            )}
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === paths.app || link.to === paths.admin}
                onClick={() => {
                  play('nav');
                  setSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`
                }
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User & Actions */}
          <div className="p-3 space-y-1 border-t border-sidebar-border">
            <button
              onClick={() => {
                play('role');
                switchRole();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full transition-colors"
            >
              <Shield className="w-5 h-5" />
              {isAdmin ? 'Student View' : 'Admin View'}
            </button>
            <button
              onClick={() => {
                play('theme');
                toggleTheme();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <SoundToggleButton />
            <button
              onClick={() => {
                play('logout');
                logout();
                navigate(paths.login);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>

            {/* User card */}
            <div
              className={`flex items-center gap-3 p-3 mt-2 rounded-2xl border ${
                isAdmin
                  ? 'bg-[#1c2218]/55 dark:bg-[#0f140d] border-[#6f7a5e]/35'
                  : 'bg-sidebar-accent border-transparent'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                  isAdmin
                    ? 'bg-[#3d4a38] text-[#e8ebe3] ring-2 ring-[#6f7a5e]/40'
                    : 'bg-primary text-primary-foreground'
                }`}
                style={{ fontWeight: 600 }}
              >
                {firstNameOnly(user.name).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-sidebar-foreground" style={{ fontWeight: 500 }}>{firstNameOnly(user.name)}</p>
                <p className="text-[11px] text-sidebar-foreground/50 uppercase tracking-wide">
                  {isAdmin ? 'Administrator' : 'Student'}
                </p>
              </div>
              {!isAdmin && (
                <span className="text-xs text-primary" style={{ fontWeight: 600 }}>{user.uni_xp} XP</span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => {
            play('tap');
            setSidebarOpen(false);
          }}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Top bar */}
        <header
          className={`sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-md shrink-0 ${
            isAdmin
              ? 'border-b-2 border-[#6f7a5e]/40 bg-[#9faa8c]/[0.14] dark:bg-[#141a12]/95 dark:border-[#4a5c46]/55'
              : 'border-b border-border/70 bg-background/85'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 hover:bg-accent rounded-xl"
              onClick={() => {
                play('panel');
                setSidebarOpen(true);
              }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p
                className={`text-xs uppercase tracking-[0.18em] ${
                  isAdmin ? 'text-[#3d4a38] dark:text-[#9faa8c]' : 'text-muted-foreground'
                }`}
              >
                {isAdmin ? 'Staff · Admin portal' : 'Student · Campus portal'}
              </p>
              <p className="text-sm truncate" style={{ fontWeight: 600 }}>Welcome, {firstNameOnly(user.name)}</p>
            </div>
            <p className="sm:hidden text-sm truncate" style={{ fontWeight: 600 }}>{isAdmin ? 'Staff' : 'Home'}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
          <div
            className={`mx-auto w-full max-w-7xl ${
              inAdminSection && isAdmin
                ? 'rounded-xl border border-[#6f7a5e]/30 dark:border-[#4a5c46]/50 bg-[#9faa8c]/[0.03] dark:bg-[#0f120d]/40 p-3 sm:p-5 min-h-[min(100%,480px)]'
                : ''
            }`}
          >
            {inAdminSection && isAdmin && (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5c6b4a] dark:text-[#9faa8c] mb-3 sm:mb-4">
                Admin workspace · student routes unchanged
              </p>
            )}
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Chat */}
      {!isAdmin && <AIChatWidget />}
      </div>
    </div>
  );
}
