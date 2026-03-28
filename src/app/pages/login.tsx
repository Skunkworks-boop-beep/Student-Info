import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuth } from '../components/auth-context';
import { useTheme } from '../components/theme-provider';
import { motion } from 'motion/react';
import { paths } from '../paths';
import { useSound } from '../audio/sound-context';
import { DEMO_EMAIL_ADMIN, DEMO_EMAIL_STUDENT, EMAIL_PLACEHOLDER } from '../config/app';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { play } = useSound();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={paths.app} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      play('error');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      play('error');
      return;
    }
    login(email, password);
    play('success');
    navigate(paths.app);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,0.22),transparent_42%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.10),transparent_38%)] pointer-events-none" />
      <div className="fixed top-4 left-4 right-4 z-10 flex items-center justify-between gap-3">
        <Link
          to={paths.landing}
          onClick={() => play('nav')}
          className="text-sm text-muted-foreground transition hover:text-foreground"
          style={{ fontWeight: 600 }}
        >
          ← Home
        </Link>
        <button
          type="button"
          onClick={() => {
            play('theme');
            toggleTheme();
          }}
          className="ml-auto p-2.5 rounded-xl bg-card/90 backdrop-blur-sm border border-border hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_16px_30px_rgba(245,196,81,0.35)]">
            <span className="text-primary-foreground text-3xl" style={{ fontWeight: 700 }}>S</span>
          </div>
          <h1 className="text-3xl" style={{ fontWeight: 700 }}>Student.Info</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to browse thoughts, the campus map, leaderboards, and (with an admin account) analytics and triage.
          </p>
        </div>

        {/* Card */}
        <div className="premium-panel premium-hover-lift p-6 shadow-none">
          <h2 className="text-lg mb-1" style={{ fontWeight: 600 }}>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isRegister ? 'Sign up to get started' : 'Sign in to your account'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none transition"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder={EMAIL_PLACEHOLDER}
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none transition"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none transition pr-10"
                />
                <button
                type="button"
                onClick={() => {
                  play('tap');
                  setShowPw(!showPw);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  play('tap');
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-primary hover:underline"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-center text-muted-foreground mb-3">Instant sample accounts</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  login(DEMO_EMAIL_STUDENT, 'demo');
                  play('success');
                  navigate(paths.app);
                }}
                className="py-2 px-3 rounded-xl border border-border hover:bg-accent text-sm transition-colors"
              >
                Student account
              </button>
              <button
                type="button"
                onClick={() => {
                  login(DEMO_EMAIL_ADMIN, 'demo');
                  play('success');
                  navigate(paths.app);
                }}
                className="py-2 px-3 rounded-xl border border-border hover:bg-accent text-sm transition-colors"
              >
                Admin account
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 max-w-sm mx-auto leading-relaxed">
          Password is not checked in this build. Use Student account or Admin account for the right sidebar and routes,
          or type any email—if it contains “admin”, you get the admin profile; otherwise the student profile.
        </p>
      </motion.div>
    </div>
  );
}
