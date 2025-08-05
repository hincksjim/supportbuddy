'use server';

/**
 * @fileOverview Summarizes past conversations with the support buddy.
 *
 * - generateConversationSummary - A function that generates the conversation summary.
 * - GenerateConversationSummaryInput - The input type for the generateConversationSummary function.
 * - GenerateConversationSummaryOutput - The return type for the generateConversationSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateConversationSummaryInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The complete conversation history between the user and the support buddy.'),
});
export type GenerateConversationSummaryInput =
  z.infer<typeof GenerateConversationSummaryInputSchema>;

const GenerateConversationSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the conversation.'),
});
export type GenerateConversationSummaryOutput =
  z.infer<typeof GenerateConversationSummaryOutputSchema>;

export async function generateConversationSummary(
  input: GenerateConversationSummaryInput
): Promise<GenerateConversationSummaryOutput> {
  return generateConversationSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConversationSummaryPrompt',
  input: {schema: GenerateConversationSummaryInputSchema},
  output: {schema: GenerateConversationSummaryOutputSchema},
  prompt: `You are an AI assistant summarizing a conversation between a user and a support buddy. Provide a concise and informative summary of the conversation, highlighting key topics discussed, insights shared, and any action items identified. The summary should be no more than 200 words.

Conversation History:
{{conversationHistory}}`,
});

const generateConversationSummaryFlow = ai.defineFlow(
  {
    name: 'generateConversationSummaryFlow',
    inputSchema: GenerateConversationSummaryInputSchema,
    outputSchema: GenerateConversationSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
