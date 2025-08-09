
'use server';

/**
 * @fileOverview An AI agent to parse a prescription dose string and return the maximum daily dose as a number.
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
  prompt: `You are an expert at parsing medical prescription instructions. Your task is to analyze the following prescription instruction and determine the maximum number of tablets/units allowed in a 24-hour period.

**Instruction:** "{{{prescriptionDose}}}"

**Task:**
- Read the instruction carefully.
- Identify words like "once", "twice", "three times a day" to calculate the total.
- Pay attention to explicit maximums, like "no more than 6 in 24 hours".
- If you can determine a clear number, return it in the \`maxDose\` field.
- If the instruction is ambiguous (e.g., "as needed") or you cannot determine a number, return 0.

Examples:
- "One tablet twice a day" -> 2
- "Two pills every 4 hours, no more than 6 in 24 hours" -> 6
- "One 50mg tablet once daily" -> 1
- "Take as required for pain" -> 0
- "1-2 tablets up to four times a day" -> 8 (use the highest possible value)
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

    