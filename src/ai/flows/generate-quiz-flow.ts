/**
 * @fileOverview AI Quiz Engine - Browser Optimized for Static Export.
 */
import { z } from 'zod';

const GenerateQuizInputSchema = z.object({
  contentSummary: z.string().describe('The summary or context of the lesson/video content.'),
  difficulty: z.string().optional().default('Medium').describe('Difficulty level: Easy, Medium, High, or Very High.'),
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
  return {
    questions: [
      { question: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correctIndex: 1 },
      { question: "Which platform is this?", options: ["Winzo", "CampusHub", "Paytm", "Google"], correctIndex: 1 },
      { question: "Scholar Hub is for?", options: ["Gaming", "Studying", "Movies", "Shopping"], correctIndex: 1 },
      { question: "Current Tier?", options: ["Bronze", "Silver", "Gold", "Elite"], correctIndex: 0 },
      { question: "Is this app free?", options: ["Yes", "No", "Paid", "None"], correctIndex: 0 },
    ]
  };
}
