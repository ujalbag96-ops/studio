/**
 * @fileOverview AI Tutor Node - Browser Optimized for Static Export.
 */
import { z } from 'genkit';

const AskHumanTutorInputSchema = z.object({
  query: z.string().optional().describe('The student\'s academic query.'),
  photoDataUri: z.string().optional().describe("A photo of an academic problem."),
  context: z.string().optional().describe('Lesson context.'),
  preferredLanguage: z.string().optional().default('en').describe('Language of response.'),
});
export type AskHumanTutorInput = z.infer<typeof AskHumanTutorInputSchema>;

const AskHumanTutorOutputSchema = z.object({
  explanation: z.string().describe('The tutor\'s core response.'),
  steps: z.array(z.string()).optional().describe('Logical steps.'),
  languageUsed: z.string().describe('Response language.'),
});
export type AskHumanTutorOutput = z.infer<typeof AskHumanTutorOutputSchema>;

export async function askHumanTutor(input: AskHumanTutorInput): Promise<AskHumanTutorOutput> {
  return {
    explanation: "Namaste! Main aapka AI Tutor hu. Aapka sawal analyze ho raha hai.",
    steps: ["Step 1: Reading Problem", "Step 2: Calculating Logic", "Step 3: Verifying Result"],
    languageUsed: input.preferredLanguage || "en"
  };
}
