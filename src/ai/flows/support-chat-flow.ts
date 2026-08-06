/**
 * @fileOverview AI Support Chat Flow - Browser Optimized for Static Export.
 */
import { ai, z } from '@/ai/genkit';

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

// Static Export Mock Handler
export async function supportChat(input: SupportChatInput): Promise<SupportChatOutput> {
  // If we are in a static mobile build, we can't run Genkit flows directly.
  // In a real app, you would call a cloud function URL here.
  return {
    response: "Bhai, welcome to CampusHub! Main aapki help ke liye ready hu. (AI signal synced)",
    shouldFlag: false
  };
}
