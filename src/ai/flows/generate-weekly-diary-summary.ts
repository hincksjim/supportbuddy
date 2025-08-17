'use server';

/**
 * @fileOverview An AI agent to generate a weekly summary of diary entries.
 *
 * - generateWeeklyDiarySummary - A function that handles the summary generation.
 * - GenerateWeeklyDiarySummaryInput - The input type for the function.
 * - GenerateWeeklyDiarySummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { DiaryEntrySchemaForAI } from './types';


const GenerateWeeklyDiarySummaryInputSchema = z.object({
    diaryEntries: z.array(DiaryEntrySchemaForAI).describe("An array of diary entries for a single week, sorted chronologically."),
});
export type GenerateWeeklyDiarySummaryInput = z.infer<typeof GenerateWeeklyDiarySummaryInputSchema>;


const GenerateWeeklyDiarySummaryOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the week's diary entries, highlighting trends in mood, pain, and key themes from the user's notes."),
});
export type GenerateWeeklyDiarySummaryOutput = z.infer<typeof GenerateWeeklyDiarySummaryOutputSchema>;


export async function generateWeeklyDiarySummary(
  input: GenerateWeeklyDiarySummaryInput
): Promise<GenerateWeeklyDiarySummaryOutput> {
  return generateWeeklyDiarySummaryFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateWeeklyDiarySummaryPrompt',
  input: {schema: GenerateWeeklyDiarySummaryInputSchema},
  output: {schema: GenerateWeeklyDiarySummaryOutputSchema},
  prompt: `You are an expert AI assistant specializing in analyzing personal health diaries. Your task is to provide a concise, insightful summary of a user's week based on their diary entries.

**TASK:**
Review the provided list of diary entries for the week. Generate a summary of 2-3 short paragraphs that identifies key trends and patterns.

**ANALYSIS GUIDELINES (MUST FOLLOW):**
1.  **Mood Trends:** Analyze the 'mood', 'diagnosisMood', and 'treatmentMood' fields. Did the user's mood improve, decline, or fluctuate during the week? Mention any significant shifts.
2.  **Pain Patterns:** Look at the 'painScore'. Was pain a consistent issue? Did it get better or worse? Note any recurring 'painLocation'.
3.  **Key Themes:** Synthesize the 'worriedAbout' and 'positiveAbout' fields. What were the dominant concerns or sources of positivity for the user this week?
4.  **Be Observational:** Base your summary *only* on the data provided. Do not invent information or provide medical advice. Use phrases like "It seems like...", "The entries suggest...", or "A recurring theme this week was...".
5.  **Be Concise:** Keep the summary easy to read and to the point. Use bullet points if it helps to structure the information clearly.

**DIARY ENTRIES FOR THE WEEK:**
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


const generateWeeklyDiarySummaryFlow = ai.defineFlow(
  {
    name: 'generateWeeklyDiarySummaryFlow',
    inputSchema: GenerateWeeklyDiarySummaryInputSchema,
    outputSchema: GenerateWeeklyDiarySummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
