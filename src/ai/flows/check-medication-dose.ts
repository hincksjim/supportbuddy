
'use server';

/**
 * @fileOverview An AI agent to check if a medication dose exceeds the recommended daily limit.
 *
 * - checkMedicationDose - A function that handles the dose checking.
 * - CheckMedicationDoseInput - The input type for the function.
 * - CheckMedicationDoseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DoseTakenSchema = z.object({
  time: z.string().describe("The time the dose was taken (e.g., '09:00')."),
  quantity: z.number().describe("The number of units (e.g., tablets, ml) taken in this dose."),
});

const CheckMedicationDoseInputSchema = z.object({
  medicationName: z.string().describe("The name of the medication."),
  dosesTakenToday: z.array(DoseTakenSchema).describe("A list of all doses of this medication taken so far today."),
  newDoseQuantity: z.number().describe("The quantity of the new dose being added."),
});
export type CheckMedicationDoseInput = z.infer<typeof CheckMedicationDoseInputSchema>;

const CheckMedicationDoseOutputSchema = z.object({
  isOverdose: z.boolean().describe("Whether the total dose for the day is considered an overdose."),
  warning: z.string().optional().describe("A warning message if an overdose is detected."),
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
  model: 'gemini-1.5-flash',
  prompt: `You are an AI pharmacy assistant. Your task is to determine if a new medication dose, when added to the doses already taken today, exceeds the standard recommended daily limit for that medication.

**TASK:**
1.  Review the provided medication name: **{{{medicationName}}}**.
2.  Use your knowledge of standard medical guidelines to find the maximum recommended daily dose for an adult for this medication.
3.  Calculate the total quantity of the medication already taken today by summing the quantities from the \`dosesTakenToday\` list.
4.  Add the \`newDoseQuantity\` to this total.
5.  Compare the final total against the recommended maximum daily dose.
6.  Set \`isOverdose\` to \`true\` if the total exceeds the maximum, and \`false\` otherwise.
7.  If \`isOverdose\` is \`true\`, you MUST construct a clear warning message in the \`warning\` field. The message should state the medication name and the recommended maximum dose. For example: "Warning: Taking this dose would exceed the recommended daily maximum of [max dose] for {{{medicationName}}}. Please consult your doctor."
8.  If \`isOverdose\` is \`false\`, you MUST omit the \`warning\` field.

**DATA:**
*   **Medication Name:** "{{{medicationName}}}"
*   **Doses Already Taken Today:**
    {{#each dosesTakenToday}}
    - {{quantity}} units at {{time}}
    {{else}}
    - None
    {{/each}}
*   **New Dose Being Added:** {{newDoseQuantity}} units

Your final output MUST be a valid JSON object matching the provided schema. Do not include any other explanatory text.
`,
});

const checkMedicationDoseFlow = ai.defineFlow(
  {
    name: 'checkMedicationDoseFlow',
    inputSchema: CheckMedicationDoseInputSchema,
    outputSchema: CheckMedicationDoseOutputSchema,
  },
  async input => {
    // A real implementation might have more complex logic here,
    // but for now, we rely on the prompt to do the core work.
    const {output} = await prompt(input);
    return output!;
  }
);
