import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
// import '../config/aws'; // Temporarily disabled for development
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Any global initialization can go here
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}