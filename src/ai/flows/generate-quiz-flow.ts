'use server';
/**
 * @fileOverview AI Quiz Generation Engine.
 * Generates 5 Multiple Choice Questions based on provided book content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuizInputSchema = z.object({
  contentSummary: z.string().describe('The text content from the book or chapter to generate a quiz from.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).length(4).describe('Four possible answers.'),
  correctIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer.'),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(5).describe('An array of 5 MCQ objects.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an expert academic examiner. 

Based on the provided book content summary, generate a high-quality quiz consisting of 5 Multiple Choice Questions.

Guidelines:
- Each question must have exactly 4 options.
- The questions should test the user's understanding of the key concepts in the text.
- Ensure only one option is clearly correct.
- Keep the language academic yet easy to understand for students.

Content Summary: 
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
