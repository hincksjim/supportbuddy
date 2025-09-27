'use server';

/**
 * @fileOverview Summarizes a text transcript from a voice note.
 *
 * - summarizeVoiceNote - A function that generates the voice note summary.
 * - SummarizeVoiceNoteInput - The input type for the summarizeVoiceNote function.
 * - SummarizeVoiceNoteOutput - The return type for the summarizeVoiceNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeVoiceNoteInputSchema = z.object({
  transcript: z.string().describe('The text transcript of the voice note.'),
});
export type SummarizeVoiceNoteInput = z.infer<typeof SummarizeVoiceNoteInputSchema>;

const SummarizeVoiceNoteOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the voice note (around 100 words).'),
});
export type SummarizeVoiceNoteOutput = z.infer<typeof SummarizeVoiceNoteOutputSchema>;

export async function summarizeVoiceNote(
  input: SummarizeVoiceNoteInput
): Promise<SummarizeVoiceNoteOutput> {
  return summarizeVoiceNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeVoiceNotePrompt',
  input: {schema: SummarizeVoiceNoteInputSchema},
  output: {schema: SummarizeVoiceNoteOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an AI assistant tasked with summarizing a voice note transcript. Your summary should be concise, informative, and capture the key points of the discussion.

Based on the transcript provided, generate a summary of around 100 words.

Transcript:
{{{transcript}}}
`,
  config: {
    apiVersion: 'v1',
    location: 'europe-west1',
  },
});

const summarizeVoiceNoteFlow = ai.defineFlow(
  {
    name: 'summarizeVoiceNoteFlow',
    inputSchema: SummarizeVoiceNoteInputSchema,
    outputSchema: SummarizeVoiceNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
