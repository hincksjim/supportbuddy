
'use server';

/**
 * @fileOverview An AI agent to check medication dosage against a log of doses taken.
 *
 * - checkMedicationDose - A function that handles the dose checking process.
 * - CheckMedicationDoseInput - The input type for the function.
 * - CheckMedicationDoseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// The MedDoseSchema is now defined in the Diary page component where it's used by the client.
// The flow's input schema will still validate against this structure.
const MedDoseSchema = z.object({
  time: z.string().describe("The time the dose was taken, in 'HH:mm' format."),
  quantity: z.number().describe('The number of pills/units taken at that time.'),
});
export type MedDose = z.infer<typeof MedDoseSchema>;


const CheckMedicationDoseInputSchema = z.object({
  prescriptionDose: z.string().describe('The prescribed dose instructions from the medication list (e.g., "One tablet twice a day").'),
  dosesTaken: z.array(MedDoseSchema).describe("A list of all doses of this specific medication taken by the user today."),
});
export type CheckMedicationDoseInput = z.infer<typeof CheckMedicationDoseInputSchema>;


const CheckMedicationDoseOutputSchema = z.object({
  warning: z.string().optional().describe('A warning message if the total dose taken appears to exceed the prescribed daily limit. The message should be polite and informative, e.g., "It looks like you have taken more than the prescribed dose. Please double-check the instructions or consult your doctor." If there is no issue, this field should be omitted.'),
});
export type CheckMedicationDoseOutput = z.infer<typeof CheckMedicationDoseOutputSchema>;


export async function checkMedicationDose(
  input: CheckMedicationDoseInput
): Promise<CheckMedicationDoseOutput> {
  return checkMedicationDoseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkMedicationDosePrompt',
  input: {schema: CheckMedicationDoseInputSchema},
  output: {schema: CheckMedicationDoseOutputSchema},
  prompt: `You are an AI pharmacy assistant. Your task is to analyze a prescribed medication dose and a log of doses taken today to see if the user might have taken too much.

**Task:**
1.  **Analyze the Prescription:** First, understand the prescribed daily limit from the instruction string.
    *   "One tablet twice a day" means a maximum of 2 tablets in 24 hours.
    *   "Two pills every 4-6 hours, no more than 8 in 24 hours" means a max of 8 pills in 24 hours.
    *   "One 50mg tablet once daily" means a max of 1 tablet in 24 hours.
    Pay close attention to phrases like "max," "no more than," "twice a day," "three times daily," etc.

2.  **Calculate Total Taken:** Sum the \`quantity\` of all doses taken from the \`dosesTaken\` array.

3.  **Compare and Warn:**
    *   If the total quantity taken is **greater than** the maximum daily dose you inferred from the prescription, you MUST generate a polite warning message.
    *   The warning should be clear and encourage the user to double-check. For example: "It looks like you have taken more than the prescribed daily dose of [X] tablets. Please double-check the instructions or consult your doctor."
    *   If the total taken is within the prescribed limit, you MUST return an empty response with no warning.

**Data:**
*   **Prescription Instruction:** "{{{prescriptionDose}}}"
*   **Log of Doses Taken Today:**
    {{#each dosesTaken}}
    - Quantity: {{quantity}} at {{time}}
    {{/each}}
`,
});

const checkMedicationDoseFlow = ai.defineFlow(
  {
    name: 'checkMedicationDoseFlow',
    inputSchema: CheckMedicationDoseInputSchema,
    outputSchema: CheckMedicationDoseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
