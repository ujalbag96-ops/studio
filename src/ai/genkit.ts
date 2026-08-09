/**
 * Browser-Safe Genkit Initializer v3.0
 * Completely isolates Node.js dependencies to prevent static export crashes.
 */
import { z } from 'zod';

// We export a dummy object if genkit is requested in the browser
let ai: any = {
  defineFlow: (cfg: any, fn: any) => fn,
  definePrompt: (cfg: any) => (input: any) => Promise.resolve({ output: null }),
  defineTool: (cfg: any, fn: any) => fn,
  generate: () => Promise.resolve({ text: "Browser mock active" }),
  defineSchema: (name: string, schema: any) => schema,
};

// CRITICAL: We only use require() inside this check to hide dependencies from the Webpack client tracer
if (typeof window === 'undefined') {
  try {
    // Dynamic require prevents the bundler from following these paths on the client
    const genkitModule = require('genkit');
    const googleAIModule = require('@genkit-ai/google-genai');
    
    if (genkitModule && genkitModule.genkit) {
      ai = genkitModule.genkit({
        plugins: [googleAIModule.googleAI()],
        model: 'googleai/gemini-2.5-flash',
      });
    }
  } catch (e) {
    // Fail silently during build-time tracing
  }
}

export { ai, z };
