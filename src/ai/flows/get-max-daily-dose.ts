
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
  dosePerIntake: z.number().describe("The number of tablets/units to be taken at a single time (e.g., for '1-2 tablets', return 2). Returns 0 if not specified.").optional(),
  frequency: z.string().describe('The frequency the medication can be taken (e.g., "Twice a day", "Every 4-6 hours"). Returns "As needed" if not specified.').optional(),
  maxDosePerDay: z.number().describe('The maximum number of tablets/units to be taken in a 24-hour period. Returns 0 if unable to determine.').optional(),
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
  prompt: `You are an expert at parsing medical prescription instructions. Your task is to analyze the following instruction and extract three specific pieces of information.

**Instruction:** "{{{prescriptionDose}}}"

**Tasks:**
1.  **dosePerIntake**: How many tablets/units should be taken at a single time? If a range is given (e.g., "1-2 tablets"), use the highest number. If not specified, return 0.
2.  **frequency**: How often can the dose be taken? (e.g., "Twice a day", "Every 4 hours"). If not specified, return "As needed".
3.  **maxDosePerDay**: What is the maximum total number of tablets/units allowed in a 24-hour period? If an explicit maximum is given, use that. If it can be calculated (e.g., "2 tablets three times a day" = 6), calculate it. If it's ambiguous, return 0.

**Examples:**
- "One tablet twice a day" -> dosePerIntake: 1, frequency: "Twice a day", maxDosePerDay: 2
- "Two pills every 4 hours, no more than 6 in 24 hours" -> dosePerIntake: 2, frequency: "Every 4 hours", maxDosePerDay: 6
- "1-2 tablets up to four times a day" -> dosePerIntake: 2, frequency: "Up to four times a day", maxDosePerDay: 8
- "One 50mg tablet once daily" -> dosePerIntake: 1, frequency: "Once daily", maxDosePerDay: 1
- "Take as required for pain" -> dosePerIntake: 0, frequency: "As needed", maxDosePerDay: 0
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
