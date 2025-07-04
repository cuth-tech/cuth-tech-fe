import path from 'path';
import { fileURLToPath, URL } from 'url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // This will load your .env file variables, including GEMINI_API_KEY
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // This 'define' block makes the variable available in your app code
    define: {
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    // This 'resolve' block fixes path aliasing for modern JS/TS
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url))
      }
    }
  };
});