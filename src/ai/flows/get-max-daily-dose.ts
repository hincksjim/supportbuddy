
'use server';

/**
 * @fileOverview An AI agent to parse a prescription dose string and return the maximum daily dose and frequency.
 *
 * - getMaxDailyDose - A function that handles parsing the prescription.
 * - GetMaxDailyDoseInput - The input type for the function.
 * - GetMaxDailyDoseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetMaxDailyDoseInputSchema = z.object({
  prescriptionDose: z.string().describe('The prescribed dose instructions (e.g., "One tablet twice a day").'),
});
export type GetMaxDailyDoseInput = z.infer<typeof GetMaxDailyDoseInputSchema>;


const GetMaxDailyDoseOutputSchema = z.object({
  maxDose: z.number().describe('The maximum number of tablets/units to be taken in a 24-hour period. Returns 0 if unable to determine.'),
  frequency: z.string().describe('The frequency the medication can be taken (e.g., "Twice a day", "Every 4-6 hours"). Returns "As needed" if not specified.'),
});
export type GetMaxDailyDoseOutput = z.infer<typeof GetMaxDailyDoseOutputSchema>;


export async function getMaxDailyDose(
  input: GetMaxDailyDoseInput
): Promise<GetMaxDailyDoseOutput> {
  return getMaxDailyDoseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMaxDailyDosePrompt',
  input: {schema: GetMaxDailyDoseInputSchema},
  output: {schema: GetMaxDailyDoseOutputSchema},
  prompt: `You are an expert at parsing medical prescription instructions. Your task is to analyze the following instruction and determine two things:
1. The maximum number of tablets/units allowed in a 24-hour period.
2. The frequency at which the medication can be taken.

**Instruction:** "{{{prescriptionDose}}}"

**Tasks:**
- **maxDose**: Read the instruction carefully. Identify words like "once", "twice", "three times a day" to calculate the total. Pay attention to explicit maximums, like "no more than 6 in 24 hours". If the instruction is ambiguous (e.g., "as needed") or you cannot determine a number, return 0. If a range is given (e.g., "1-2 tablets up to four times a day"), use the highest possible value (e.g., 8).
- **frequency**: Extract the frequency text. Examples: "once daily", "twice a day", "every 4 hours", "every 6-8 hours". If no frequency is mentioned and it seems to be taken as needed, return "As needed".

Examples:
- "One tablet twice a day" -> maxDose: 2, frequency: "Twice a day"
- "Two pills every 4 hours, no more than 6 in 24 hours" -> maxDose: 6, frequency: "Every 4 hours"
- "One 50mg tablet once daily" -> maxDose: 1, frequency: "Once daily"
- "Take as required for pain" -> maxDose: 0, frequency: "As needed"
- "1-2 tablets up to four times a day" -> maxDose: 8, frequency: "Up to four times a day"
`,
});

const getMaxDailyDoseFlow = ai.defineFlow(
  {
    name: 'getMaxDailyDoseFlow',
    inputSchema: GetMaxDailyDoseInputSchema,
    outputSchema: GetMaxDailyDoseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
