import { useState } from 'react';
import { Link, Outlet, NavLink, Navigate, useNavigate } from 'react-router';
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

export function Layout() {
  const { user, isAdmin, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { play } = useSound();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { to: paths.admin, icon: BarChart3, label: 'Analytics' },
    { to: paths.adminComplaints, icon: FileText, label: 'Complaints' },
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
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:border-r lg:border-sidebar-border ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
            <div className="flex items-center gap-3 p-3 mt-2 rounded-2xl bg-sidebar-accent">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm" style={{ fontWeight: 600 }}>
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-sidebar-foreground" style={{ fontWeight: 500 }}>{user.name}</p>
                <p className="text-[11px] text-sidebar-foreground/50 capitalize">{user.role}</p>
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
        <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-background/85 backdrop-blur-md border-b border-border/70 shrink-0">
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
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{isAdmin ? 'Admin Portal' : 'Student Portal'}</p>
              <p className="text-sm truncate" style={{ fontWeight: 600 }}>Welcome, {user.name}</p>
            </div>
            <p className="sm:hidden text-sm truncate" style={{ fontWeight: 600 }}>{isAdmin ? 'Admin' : 'Home'}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
          <div className="mx-auto w-full max-w-7xl">
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
