
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
  medicationName: z.string().describe('The name of the medication being checked.'),
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
  prompt: `You are an AI pharmacy assistant. Your task is to analyze if a user has taken more of a specific medication than prescribed for a single day.

**CRITICAL INSTRUCTION:** Your analysis MUST only concern the medication named "{{{medicationName}}}". Do NOT consider any other medications.

**Task:**
1.  **Identify the Medication:** The medication you are checking is "{{{medicationName}}}".
2.  **Analyze the Prescription:** Review the instruction "{{{prescriptionDose}}}" to determine the maximum number of pills/units of {{{medicationName}}} allowed in a 24-hour period.
    *   Examples: "One tablet twice a day" means a max of 2 tablets. "Two pills every 4 hours, no more than 6 in 24 hours" means a max of 6 pills. "One 50mg tablet once daily" means a max of 1 tablet.
3.  **Calculate Total Taken:** Sum the \`quantity\` of all doses for "{{{medicationName}}}" from the provided \`dosesTaken\` log.
4.  **Compare and Warn:**
    *   If the total calculated quantity taken is **greater than** the maximum daily dose you inferred from the prescription instruction, you MUST generate a polite warning message.
    *   The warning should be clear and encourage the user to double-check. For example: "It looks like you have taken more than the prescribed daily dose of [X] tablets for {{{medicationName}}}. Please double-check the instructions or consult your doctor."
    *   If the total taken is within the prescribed limit, you MUST return an empty response with no 'warning' field.

**Data:**
*   **Medication to Check:** "{{{medicationName}}}"
*   **Prescription Instruction:** "{{{prescriptionDose}}}"
*   **Log of Doses Taken Today for this Medication:**
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
