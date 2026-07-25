'use server';
/**
 * @fileOverview AI Support Chat Flow for handling user queries in English.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SupportChatInputSchema = z.object({
  message: z.string().describe('The user\'s message.'),
  userHistory: z.array(z.string()).optional().describe('Brief context of previous messages.'),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

const SupportChatOutputSchema = z.object({
  response: z.string().describe('The AI generated response.'),
  shouldFlag: z.boolean().describe('Whether the admin needs to intervene.'),
});
export type SupportChatOutput = z.infer<typeof SupportChatOutputSchema>;

export async function supportChat(input: SupportChatInput): Promise<SupportChatOutput> {
  return supportChatFlow(input);
}

const supportChatPrompt = ai.definePrompt({
  name: 'supportChatPrompt',
  input: { schema: SupportChatInputSchema },
  output: { schema: SupportChatOutputSchema },
  prompt: `You are a helpful and professional customer support assistant for "CampusHub", an industrial education and reward platform. 

Your goals:
- Answer user questions clearly in English.
- Assist with accessing library books, tutorial nodes, or reward withdrawal issues.
- If the user is angry, has a complex technical error, or specifically asks for a human, set shouldFlag to true.
- Keep responses concise (max 3 sentences).

Context:
- We offer NCERT and Global textbooks for free.
- Users earn scholarship coins by completing academic tasks and missions.
- Payouts are verified by an industrial audit team within 2-6 hours.

User Message: {{{message}}}`,
});

const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: SupportChatOutputSchema,
  },
  async (input) => {
    const { output } = await supportChatPrompt(input);
    return output!;
  }
);