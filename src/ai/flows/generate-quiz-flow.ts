
'use server';
/**
 * @fileOverview AI Anti-Cheat Video Quiz Generation Engine.
 * Generates 5 high-difficulty MCQs based on specific video content to prevent Google searching.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuizInputSchema = z.object({
  contentSummary: z.string().describe('The summary of the video content or context.'),
  difficulty: z.string().optional().default('High'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The question text, focused on visual or specific audio details from the video.'),
  options: z.array(z.string()).length(4).describe('Four possible answers.'),
  correctIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer.'),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(5).describe('An array of 5 high-difficulty MCQ objects.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an elite academic auditor for a global video quiz arena. 

Your goal is to generate 5 MULTIPLE CHOICE QUESTIONS that are impossible to answer via a standard Google search. 

Guidelines:
- Focus on specific TEMPORAL details (e.g., "What happened at 0:45 into the clip?") or VISUAL details (e.g., "What was the color of the jacket the speaker wore in the first scene?").
- The difficulty must be VERY HIGH.
- Avoid general knowledge. Only ask about things explicitly shown or said in the context provided below.
- Ensure only one option is correct.

Content/Video Context: 
{{{contentSummary}}}

Return a JSON object with a 'questions' array containing exactly 5 high-difficulty question objects.`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuizPrompt(input);
    return output!;
  }
);
