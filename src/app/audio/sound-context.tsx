import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { playSound, type SoundId } from './sound-engine';

const noopPlay = (_id: SoundId) => {};

const STORAGE_KEY = 'student-info-sfx-enabled';

type SoundContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  play: (id: SoundId) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
  }, []);

  const play = useCallback(
    (id: SoundId) => {
      if (!enabled) return;
      void playSound(id);
    },
    [enabled]
  );

  const value = useMemo(() => ({ enabled, setEnabled, play }), [enabled, setEnabled, play]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      enabled: false,
      setEnabled: () => {},
      play: noopPlay,
    };
  }
  return ctx;
}

/** Sidebar control — always plays a tiny click so the toggle itself gives feedback. */
export function SoundToggleButton() {
  const { enabled, setEnabled } = useSound();

  return (
    <button
      type="button"
      onClick={() => {
        void playSound('tap');
        setEnabled(!enabled);
      }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full transition-colors"
    >
      {enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      {enabled ? 'Sound effects on' : 'Sound effects off'}
    </button>
  );
}

/** Compact control for headers (e.g. landing). */
export function SoundToggleIconButton({ className = '' }: { className?: string }) {
  const { enabled, setEnabled } = useSound();

  return (
    <button
      type="button"
      onClick={() => {
        void playSound('tap');
        setEnabled(!enabled);
      }}
      className={`rounded-xl border border-border/80 bg-card/90 p-2.5 transition hover:bg-accent ${className}`}
      aria-label={enabled ? 'Mute interface sounds' : 'Enable interface sounds'}
    >
      {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
    </button>
  );
}
