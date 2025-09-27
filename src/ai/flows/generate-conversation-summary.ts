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
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
});
export type GenerateConversationSummaryInput =
  z.infer<typeof GenerateConversationSummaryInputSchema>;

const GenerateConversationSummaryOutputSchema = z.object({
  title: z.string().describe('A short, engaging title for the conversation summary (5-7 words).'),
  summary: z.string().describe('A concise summary of the conversation (around 100 words).'),
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
  model: 'gemini-2.5-flash-lite',
  prompt: `You are an AI assistant tasked with summarizing a conversation between a user and a cancer support buddy. Your summary should be concise, informative, and capture the essence of the discussion.

Based on the conversation history provided, generate a short, engaging title (5-7 words) and a summary of around 100 words. The summary should highlight the key topics discussed, the main concerns of the user, and any significant advice or support offered by the buddy.

Conversation History:
{{#each conversationHistory}}
  {{role}}: {{{content}}}
{{/each}}
`,
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
