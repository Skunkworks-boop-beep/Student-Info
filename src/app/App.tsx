import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './components/auth-context';
import { SoundProvider } from './audio/sound-context';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </AuthProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}
