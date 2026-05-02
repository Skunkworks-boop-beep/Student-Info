import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuth } from '../components/auth-context';
import { useTheme } from '../components/theme-provider';
import { motion } from 'motion/react';
import { paths } from '../paths';
import { useSound } from '../audio/sound-context';
import {
  DEMO_PASSWORD,
  DEMO_USERNAME_ADMIN,
  DEMO_USERNAME_STUDENT,
  USERNAME_PLACEHOLDER,
} from '../config/app';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isRegister, setIsRegister] = useState(() => searchParams.get('mode') === 'signup');
  const [error, setError] = useState('');
  const { login, signup, user, backendMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { play } = useSound();
  const navigate = useNavigate();
  const cloud = backendMode === 'supabase';

  if (user) {
    return <Navigate to={paths.app} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (cloud) {
      if (!email.trim() || !password) {
        setError('Please enter email and password.');
        play('error');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        play('error');
        return;
      }
      if (isRegister) {
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          play('error');
          return;
        }
        if (!universityName.trim()) {
          setError('Please enter your university name.');
          play('error');
          return;
        }
        if (!username.trim()) {
          setError('Please choose a username (handle).');
          play('error');
          return;
        }
        const res = await signup({
          email: email.trim(),
          username: username.trim(),
          password,
          name: fullName.trim(),
          university_name: universityName.trim(),
        });
        if (!res.ok) {
          setError(res.error);
          play('error');
          return;
        }
        play('success');
        navigate(paths.app);
        return;
      }
      const res = await login(email.trim().toLowerCase(), password);
      if (!res.ok) {
        setError(res.error);
        play('error');
        return;
      }
      play('success');
      navigate(paths.app);
      return;
    }

    if (!username.trim() || !password) {
      setError('Please enter username and password.');
      play('error');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      play('error');
      return;
    }

    if (isRegister) {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        play('error');
        return;
      }
      if (!universityName.trim()) {
        setError('Please enter your university name.');
        play('error');
        return;
      }
      const res = await signup({
        username: username.trim(),
        password,
        name: fullName.trim(),
        university_name: universityName.trim(),
      });
      if (!res.ok) {
        setError(res.error);
        play('error');
        return;
      }
      play('success');
      navigate(paths.app);
      return;
    }

    const res = await login(username.trim(), password);
    if (!res.ok) {
      setError(res.error);
      play('error');
      return;
    }
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_16px_30px_rgba(245,196,81,0.35)]">
            <span className="text-primary-foreground text-3xl" style={{ fontWeight: 700 }}>S</span>
          </div>
          <h1 className="text-3xl" style={{ fontWeight: 700 }}>Student.Info</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {cloud
              ? 'Sign in with email and password. Your handle and school live in your global student profile.'
              : 'Sign in with your username and password. On sign up, add your university — that name appears across your campus dashboards and shell.'}
          </p>
        </div>

        <div className="premium-panel premium-hover-lift p-6 shadow-none">
          <h2 className="text-lg mb-1" style={{ fontWeight: 600 }}>{isRegister ? 'Create account' : 'Welcome back'}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isRegister ? (cloud ? 'Email, handle, and school' : 'Choose a username and add your school') : 'Sign in to your account'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label htmlFor="full-name" className="text-sm text-muted-foreground mb-1.5 block">Full name</label>
                  <input
                    id="full-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError(''); }}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none transition"
                  />
                </div>
                <div>
                  <label htmlFor="university" className="text-sm text-muted-foreground mb-1.5 block">University name</label>
                  <input
                    id="university"
                    type="text"
                    autoComplete="organization"
                    value={universityName}
                    onChange={e => { setUniversityName(e.target.value); setError(''); }}
                    placeholder="e.g. University of Cape Town"
                    className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none transition"
                  />
                </div>
              </>
            )}
            {cloud && (
              <div>
                <label htmlFor="email" className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none transition"
                />
              </div>
            )}
            {(isRegister || !cloud) && (
              <div>
                <label htmlFor="username" className="text-sm text-muted-foreground mb-1.5 block">
                  {cloud ? 'Username (public handle)' : 'Username'}
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder={USERNAME_PLACEHOLDER}
                  className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none transition"
                />
              </div>
            )}
            <div>
              <label htmlFor="password" className="text-sm text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
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
              {isRegister ? 'Create account' : 'Sign in'}
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
                {isRegister ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {!cloud && (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-xs text-center text-muted-foreground mb-3">Sample accounts</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await login(DEMO_USERNAME_STUDENT, DEMO_PASSWORD);
                    if (!res.ok) return;
                    play('success');
                    navigate(paths.app);
                  }}
                  className="py-2 px-3 rounded-xl border border-border hover:bg-accent text-sm transition-colors"
                >
                  Student ({DEMO_USERNAME_STUDENT})
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await login(DEMO_USERNAME_ADMIN, DEMO_PASSWORD);
                    if (!res.ok) return;
                    play('success');
                    navigate(paths.app);
                  }}
                  className="py-2 px-3 rounded-xl border border-border hover:bg-accent text-sm transition-colors"
                >
                  Admin ({DEMO_USERNAME_ADMIN})
                </button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground mt-2">
                Password for both: <span className="font-mono">{DEMO_PASSWORD}</span>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 max-w-sm mx-auto leading-relaxed">
          {cloud
            ? 'Live mode: accounts and data are stored in your Supabase project. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY when deploying.'
            : 'Accounts are stored in this browser only (local demo). Sign up sets your university label for the in-app experience; it is not sent to a server.'}
        </p>
      </motion.div>
    </div>
  );
}
