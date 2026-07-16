
'use server';
/**
 * @fileOverview Hyper-Local Notification Translation Engine.
 * Translates and adapts notification messages based on user's specific city/region.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LocalizeNotificationInputSchema = z.object({
  message: z.string().describe('The standard English notification message.'),
  city: z.string().describe('The user\'s city.'),
  region: z.string().describe('The user\'s state or region.'),
  country: z.string().describe('The user\'s country.'),
});
export type LocalizeNotificationInput = z.infer<typeof LocalizeNotificationInputSchema>;

const LocalizeNotificationOutputSchema = z.object({
  localizedMessage: z.string().describe('The message rewritten in a natural, local dialect/language.'),
  detectedNearLanguage: z.string().describe('The language name identified as most appropriate.'),
});
export type LocalizeNotificationOutput = z.infer<typeof LocalizeNotificationOutputSchema>;

export async function localizeNotification(input: LocalizeNotificationInput): Promise<LocalizeNotificationOutput> {
  return localizeNotificationFlow(input);
}

const localizeNotificationPrompt = ai.definePrompt({
  name: 'localizeNotificationPrompt',
  input: { schema: LocalizeNotificationInputSchema },
  output: { schema: LocalizeNotificationOutputSchema },
  prompt: `You are a regional communication expert for a mobile gaming arena. 

Goal: Rewrite the given notification message in a "Near Language" or local dialect that feels personal and natural for someone living in {{{city}}}, {{{region}}}, {{{country}}}.

Guidelines:
- If the city is in India (e.g., Sambalpur, Mumbai, Ludhiana), use a mix of Hindi and the prominent regional language (Odia, Marathi, Punjabi, etc.) that sounds like a local friend talking.
- If it's a "Weather Win", mention the city explicitly to increase trust.
- Keep it concise (max 2 sentences).
- Use local slang or inflections if appropriate (e.g., "Ki haal aa" for Punjab, "Namaskar" for Maharashtra).

Input Message: {{{message}}}
User Context: {{{city}}}, {{{region}}}

Return a JSON object with 'localizedMessage' and 'detectedNearLanguage'.`,
});

const localizeNotificationFlow = ai.defineFlow(
  {
    name: 'localizeNotificationFlow',
    inputSchema: LocalizeNotificationInputSchema,
    outputSchema: LocalizeNotificationOutputSchema,
  },
  async (input) => {
    const { output } = await localizeNotificationPrompt(input);
    return output!;
  }
);
