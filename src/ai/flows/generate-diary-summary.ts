
'use server';

/**
 * @fileOverview An AI agent to generate a summary of diary entries.
 *
 * - generateDiarySummary - A function that handles the summary generation.
 * - GenerateDiarySummaryInput - The input type for the function.
 * - GenerateDiarySummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { DiaryEntrySchemaForAI } from './types';


const GenerateDiarySummaryInputSchema = z.object({
    diaryEntries: z.array(DiaryEntrySchemaForAI).describe("An array of diary entries for a single week or month, sorted chronologically."),
    timeframe: z.enum(['Weekly', 'Monthly']).describe("The timeframe the summary should cover."),
});
export type GenerateDiarySummaryInput = z.infer<typeof GenerateDiarySummaryInputSchema>;


const GenerateDiarySummaryOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the diary entries, highlighting trends in mood, pain, and key themes from the user's notes."),
});
export type GenerateDiarySummaryOutput = z.infer<typeof GenerateDiarySummaryOutputSchema>;


export async function generateDiarySummary(
  input: GenerateDiarySummaryInput
): Promise<GenerateDiarySummaryOutput> {
  return generateDiarySummaryFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateDiarySummaryPrompt',
  input: {schema: GenerateDiarySummaryInputSchema},
  output: {schema: GenerateDiarySummaryOutputSchema},
  model: 'gemini-2.5-flash-lite',
  prompt: `You are an expert AI assistant specializing in analyzing personal health diaries. Your task is to provide a concise, insightful summary of a user's week or month based on their diary entries.

**TASK:**
Review the provided list of diary entries for the specified timeframe. Generate a summary of 2-3 short paragraphs that identifies key trends and patterns.

**ANALYSIS GUIDELINES (MUST FOLLOW):**
1.  **Timeframe:** The user has specified a '{{{timeframe}}}' summary. Tailor your language accordingly (e.g., "This week...", "Over the past month...").
2.  **Mood Trends:** Analyze the 'mood', 'diagnosisMood', and 'treatmentMood' fields. Did the user's mood improve, decline, or fluctuate? Mention any significant shifts.
3.  **Pain Patterns:** Look at the 'painScore'. Was pain a consistent issue? Did it get better or worse? Note any recurring 'painLocation'.
4.  **Key Themes:** Synthesize the 'worriedAbout' and 'positiveAbout' fields. What were the dominant concerns or sources of positivity for the user?
5.  **Be Observational:** Base your summary *only* on the data provided. Do not invent information or provide medical advice. Use phrases like "It seems like...", "The entries suggest...", or "A recurring theme was...".
6.  **Be Concise:** Keep the summary easy to read and to the point. Use bullet points if it helps to structure the information clearly.

**DIARY ENTRIES:**
{{#each diaryEntries}}
- **Date:** {{date}}
  - **Overall Mood:** {{mood}} (Diagnosis: {{diagnosisMood}}, Treatment: {{treatmentMood}})
  - **Pain Score:** {{painScore}}/10 {{#if painLocation}} (Location: {{painLocation}}) {{/if}}
  - **Worried About:** "{{worriedAbout}}"
  - **Positive About:** "{{positiveAbout}}"
  - **Notes:** "{{notes}}"
{{/each}}

Your final output MUST be a valid JSON object matching the provided schema, with the summary in the 'summary' field.`,
});


const generateDiarySummaryFlow = ai.defineFlow(
  {
    name: 'generateDiarySummaryFlow',
    inputSchema: GenerateDiarySummaryInputSchema,
    outputSchema: GenerateDiarySummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
