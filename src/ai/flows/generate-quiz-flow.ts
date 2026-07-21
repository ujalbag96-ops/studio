
'use server';
/**
 * @fileOverview AI Lesson Mastery Quiz Engine.
 * Generates MCQs based on curriculum content with scaling difficulty levels.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuizInputSchema = z.object({
  contentSummary: z.string().describe('The summary or context of the lesson/video content.'),
  difficulty: z.string().optional().default('Medium').describe('Difficulty level: Easy, Medium, High, or Very High.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The question text, based on specific details from the provided context.'),
  options: z.array(z.string()).length(4).describe('Four possible answers.'),
  correctIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer.'),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(5).describe('An array of 5 MCQ objects matching the specified difficulty.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an elite academic auditor for a global study-reward platform. 

Your goal is to generate 5 MULTIPLE CHOICE QUESTIONS based on the provided content context.

Difficulty Setting: {{{difficulty}}}

Guidelines:
- The questions must strictly follow the specified difficulty level ({{{difficulty}}}).
- High/Very High difficulty questions should focus on specific temporal, logical, or numerical details that are hard to guess.
- Avoid general knowledge; only ask about facts explicitly contained within the provided context.
- Ensure only one option is correct and options are plausible.
- Format: Professional, academic, and clear.

Content/Lesson Context: 
{{{contentSummary}}}

Return a JSON object with a 'questions' array containing exactly 5 question objects.`,
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
