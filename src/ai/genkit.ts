/**
 * Browser-Safe Genkit Initializer v2.0
 * Ultra-hardened to prevent static export crashes by completely isolating Node.js imports.
 */
import { z } from 'zod';

// We export a dummy object if genkit is requested in the browser
let ai: any = {
  defineFlow: (cfg: any, fn: any) => fn,
  definePrompt: (cfg: any) => (input: any) => Promise.resolve({ output: null }),
  defineTool: (cfg: any, fn: any) => fn,
  generate: () => Promise.resolve({ text: "Browser mock active" }),
};

if (typeof window === 'undefined') {
  // Server-side / Build-time initialization
  try {
    const { genkit } = require('genkit');
    const { googleAI } = require('@genkit-ai/google-genai');
    
    ai = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  } catch (e) {
    console.warn("Genkit core could not be initialized during build, using fallback stubs.");
  }
}

export { ai, z };
