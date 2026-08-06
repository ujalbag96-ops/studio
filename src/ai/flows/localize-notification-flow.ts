/**
 * @fileOverview AI Localization Engine - Browser Optimized for Static Export.
 */
import { z } from 'genkit';

const LocalizeNotificationInputSchema = z.object({
  message: z.string().describe('The message.'),
  city: z.string().describe('City.'),
  region: z.string().describe('Region.'),
  country: z.string().describe('Country.'),
  preferredLanguage: z.enum(['en', 'or']).optional(),
});
export type LocalizeNotificationInput = z.infer<typeof LocalizeNotificationInputSchema>;

const LocalizeNotificationOutputSchema = z.object({
  localizedMessage: z.string().describe('Localized message.'),
  detectedNearLanguage: z.string().describe('Detected language.'),
});
export type LocalizeNotificationOutput = z.infer<typeof LocalizeNotificationOutputSchema>;

export async function localizeNotification(input: LocalizeNotificationInput): Promise<LocalizeNotificationOutput> {
  return {
    localizedMessage: input.message,
    detectedNearLanguage: input.preferredLanguage || "en"
  };
}
