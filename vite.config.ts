import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Safely expose the API_KEY to the client-side code
      // This allows 'API_KEY' set in Vercel/Netlify to work without the 'VITE_' prefix if needed
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill process.env for dependencies that might expect it, but keep it minimal
      'process.env': {}
    }
  };
});