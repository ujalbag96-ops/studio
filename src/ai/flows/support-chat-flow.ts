/**
 * @fileOverview AI Support Chat Flow - Browser Optimized for Static Export.
 */
import { z } from 'zod';

const SupportChatInputSchema = z.object({
  message: z.string().describe("The user's message."),
  userHistory: z.array(z.string()).optional().describe('Brief context of previous messages.'),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

const SupportChatOutputSchema = z.object({
  response: z.string().describe('The AI generated response.'),
  shouldFlag: z.boolean().describe('Whether the admin needs to intervene.'),
});
export type SupportChatOutput = z.infer<typeof SupportChatOutputSchema>;

// Static Export Mock Handler - No Genkit imports allowed here
export async function supportChat(input: SupportChatInput): Promise<SupportChatOutput> {
  // In static export (WebView), we use a fallback mock or remote API call
  return {
    response: "Bhai, welcome to CampusHub! Main aapki help ke liye ready hu. (Signal optimized for Mobile)",
    shouldFlag: false
  };
}
