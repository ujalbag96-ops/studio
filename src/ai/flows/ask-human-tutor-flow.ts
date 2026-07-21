'use server';
/**
 * @fileOverview Universal Advance AI Human Tutor Node.
 * Provides friendly, senior professor-like explanations for ALL academic subjects.
 * Includes step-by-step solving for Math, Science, and complex logical subjects.
 * Supports auto-language detection and regional dialect adaptation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AskHumanTutorInputSchema = z.object({
  query: z.string().describe('The student\'s question or academic topic from any subject (Science, Math, History, etc.).'),
  context: z.string().optional().describe('Textbook or lesson context for the question.'),
  preferredLanguage: z.string().optional().default('en').describe('The language to respond in.'),
});
export type AskHumanTutorInput = z.infer<typeof AskHumanTutorInputSchema>;

const AskHumanTutorOutputSchema = z.object({
  explanation: z.string().describe('The tutor\'s response in a warm, expert professor tone with real-life analogies.'),
  steps: z.array(z.string()).optional().describe('Subject-specific step-by-step breakdown (calculations, historical timelines, or logical stages).'),
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
  prompt: `You are an elite, world-class Senior Professor specializing in all academic disciplines (STEM, Social Sciences, Languages, and Arts).

Your goal is to provide deep, advance tuition-style explanations for the student's query.

Guidelines:
- Language: Respond strictly in the language specified: {{{preferredLanguage}}}.
- Persona: Be a warm mentor. Use encouraging phrases. Start with a regional greeting like "Namaste", "Hello", or "Kemitichha".
- Depth: Do not give short answers. Provide context, real-life examples, and simple analogies that make complex topics easy.
- Subject Mastery:
  - If Math/Science: Provide a "Chalkboard Style" step-by-step calculation or logical derivation.
  - If Humanities/History: Provide a "Narrative Style" with key dates and cause-effect relationships.
  - If Language: Explain grammar or literature with emotional depth.
- Context: Use the provided textbook context if available: {{{context}}}.

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
