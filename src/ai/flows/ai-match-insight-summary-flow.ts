'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating match insights.
 *
 * - aiMatchInsightSummary - A function that analyzes match data and provides a concise summary.
 * - AiMatchInsightSummaryInput - The input type for the aiMatchInsightSummary function.
 * - AiMatchInsightSummaryOutput - The return type for the aiMatchInsightSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiMatchInsightSummaryInputSchema = z.object({
  matchDescription: z
    .string()
    .describe('A brief description or context of the match.'),
  currentScore: z
    .string()
    .describe(
      'The current score or state of the match (e.g., "Team A: 3, Team B: 1", "Game 2, map control favoring red team").'
    ),
  playerStats: z
    .string()
    .describe(
      'Key player statistics (e.g., "Player X has 10 kills", "Player Y leads in assists").'
    ),
  userVotes: z
    .string()
    .describe(
      'Summary of user predictions or votes (e.g., "70% of users predict Team A will win").'
    ),
});
export type AiMatchInsightSummaryInput = z.infer<
  typeof AiMatchInsightSummaryInputSchema
>;

const AiMatchInsightSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise and engaging summary of the match.'),
});
export type AiMatchInsightSummaryOutput = z.infer<
  typeof AiMatchInsightSummaryOutputSchema
>;

export async function aiMatchInsightSummary(
  input: AiMatchInsightSummaryInput
): Promise<AiMatchInsightSummaryOutput> {
  return aiMatchInsightSummaryFlow(input);
}

const aiMatchInsightSummaryPrompt = ai.definePrompt({
  name: 'aiMatchInsightSummaryPrompt',
  input: { schema: AiMatchInsightSummaryInputSchema },
  output: { schema: AiMatchInsightSummaryOutputSchema },
  prompt: `You are an expert esports commentator and analyst. Your goal is to provide concise, engaging summaries of match progress and highlight potential game-changing moments based on the provided real-time data.

Here's the current match information:
Match Description: {{{matchDescription}}}
Current Score: {{{currentScore}}}
Player Statistics: {{{playerStats}}}
User Votes: {{{userVotes}}}

Analyze the data above and generate a summary that is:
- Concise (1-3 sentences)
- Engaging
- Highlights key developments or potential turning points.

Return the summary in a JSON object with a single field named 'summary'.`,
});

const aiMatchInsightSummaryFlow = ai.defineFlow(
  {
    name: 'aiMatchInsightSummaryFlow',
    inputSchema: AiMatchInsightSummaryInputSchema,
    outputSchema: AiMatchInsightSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await aiMatchInsightSummaryPrompt(input);
    return output!;
  }
);
