'use server';
/**
 * @fileOverview AI Human Tutor Node.
 * Provides friendly, professor-like explanations with step-by-step math solving.
 * Supports auto-language detection based on user profile.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AskHumanTutorInputSchema = z.object({
  query: z.string().describe('The student\'s question or topic to explain.'),
  context: z.string().optional().describe('Textbook or lesson context for the question.'),
  preferredLanguage: z.string().optional().default('en').describe('The language to respond in.'),
});
export type AskHumanTutorInput = z.infer<typeof AskHumanTutorInputSchema>;

const AskHumanTutorOutputSchema = z.object({
  explanation: z.string().describe('The tutor\'s response in a friendly, professor-like tone.'),
  steps: z.array(z.string()).optional().describe('Step-by-step breakdown for math or complex logic.'),
  languageUsed: z.string().describe('The name of the language the response was provided in.'),
});
export type AskHumanTutorOutput = z.infer<typeof AskHumanTutorOutputSchema>;

export async function askHumanTutor(input: AskHumanTutorInput): Promise<AskHumanTutorOutput> {
  return askHumanTutorFlow(input);
}

const askHumanTutorPrompt = ai.definePrompt({
  name: 'askHumanTutorPrompt',
  input: { schema: AskHumanTutorInputSchema },
  output: { schema: AskHumanTutorOutputSchema },
  prompt: `You are an elite, friendly, and experienced Senior Professor. 

Your goal is to explain the provided student query in a way that is easy to understand, using real-life examples and a warm, encouraging tone.

Guidelines:
- Language: Respond strictly in the language specified: {{{preferredLanguage}}}.
- Persona: Be a mentor. Start with a warm greeting like "Namaste", "Hello", or a regional equivalent.
- Math/Logic: If the query is a mathematical or logical problem, provide a "Chalkboard Style" step-by-step breakdown.
- Context: Use the provided context if available: {{{context}}}.
- Conciseness: Be thorough but clear.

Student Query: {{{query}}}

Return a JSON object with 'explanation', 'steps' (if applicable), and 'languageUsed'.`,
});

const askHumanTutorFlow = ai.defineFlow(
  {
    name: 'askHumanTutorFlow',
    inputSchema: AskHumanTutorInputSchema,
    outputSchema: AskHumanTutorOutputSchema,
  },
  async (input) => {
    const { output } = await askHumanTutorPrompt(input);
    return output!;
  }
);
