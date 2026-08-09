/**
 * Browser-Safe Genkit Initializer
 * Prevents build crashes during Static Export by checking environment and using dynamic requires.
 */
import { z } from 'zod'; // Use vanilla zod for build stability in browser

let ai: any = null;

if (typeof window === 'undefined') {
  // We are on server-side (build time)
  try {
    const { genkit } = require('genkit');
    const { googleAI } = require('@genkit-ai/google-genai');
    
    ai = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  } catch (e) {
    console.warn("Genkit initialization bypassed for static build.");
  }
}

export { ai, z };
