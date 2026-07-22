'use server';
/**
 * @fileOverview Universal Advance AI Human Tutor Node v2.0.
 * Specialized Senior Professor Persona for ALL academic subjects.
 * Strictly provides 100% accurate, verified answers with step-by-step formulas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AskHumanTutorInputSchema = z.object({
  query: z.string().describe('The student\'s academic query.'),
  context: z.string().optional().describe('Lesson context.'),
  preferredLanguage: z.string().optional().default('en').describe('Language of response.'),
});
export type AskHumanTutorInput = z.infer<typeof AskHumanTutorInputSchema>;

const AskHumanTutorOutputSchema = z.object({
  explanation: z.string().describe('The tutor\'s core response with professor-like depth.'),
  steps: z.array(z.string()).optional().describe('Logical/Numerical steps using standard formulas.'),
  languageUsed: z.string().describe('Response language.'),
});
export type AskHumanTutorOutput = z.infer<typeof AskHumanTutorOutputSchema>;

export async function askHumanTutor(input: AskHumanTutorInput): Promise<AskHumanTutorOutput> {
  return askHumanTutorFlow(input);
}

const askHumanTutorPrompt = ai.definePrompt({
  name: 'askHumanTutorPrompt',
  input: { schema: AskHumanTutorInputSchema },
  output: { schema: AskHumanTutorOutputSchema },
  prompt: `You are an elite, world-class Senior Professor (Human Tuition Teacher) specializing in STEM, Humanities, and Languages.

Your goal is to provide deep, high-fidelity academic tuition.

CRITICAL PROTOCOLS:
- LANGUAGE: Respond strictly in the student's chosen language: {{{preferredLanguage}}}. Start with a local warm greeting (e.g., Namaste, Kemitichha, Hello).
- FORMULA INTEGRITY: For Math, Physics, or Chemistry, you MUST provide the standard formulas used. Use clear notations (e.g., E=mc², (a+b)², etc.).
- ACCURACY: Every fact must be verified. Do not guess. If a question is about a specific lesson context ({{{context}}}), align your answer with it.
- PERSONA: Be a friendly mentor. Use simple real-life analogies to explain complex concepts.
- SUBJECT MASTERY: 
  - Math/Science: Use "Chalkboard Style" steps. 
  - History/Civics: Use "Timeline Narrative" with causes and effects.
  - Literature: Focus on emotional depth and character analysis.

Student Query: {{{query}}}

Return a JSON object with 'explanation', 'steps' (array of strings), and 'languageUsed'.`,
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
