
'use server';

/**
 * @fileOverview An AI agent to analyze a medication.
 *
 * - analyzeMedication - A function that handles the medication analysis.
 * - AnalyzeMedicationInput - The input type for the function.
 * - AnalyzeMedicationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMedicationInputSchema = z.object({
  medicationName: z.string().describe('The name of the new medication to analyze.'),
  existingMedications: z.array(z.string()).describe('A list of names of existing medications the user is taking.'),
});
export type AnalyzeMedicationInput = z.infer<typeof AnalyzeMedicationInputSchema>;

const AnalyzeMedicationOutputSchema = z.object({
  summary: z.string().describe("A simple, two-line summary of what the medication is used for."),
  interactionWarning: z.string().optional().describe("A warning if there are potential interactions with the user's existing medications. If none, this is omitted."),
  sideEffects: z.string().describe("A bulleted list of common side effects."),
  disclaimer: z.string().describe("A standard disclaimer that this is not medical advice.")
});
export type AnalyzeMedicationOutput = z.infer<typeof AnalyzeMedicationOutputSchema>;

export async function analyzeMedication(
  input: AnalyzeMedicationInput
): Promise<AnalyzeMedicationOutput> {
  return analyzeMedicationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMedicationPrompt',
  input: {schema: AnalyzeMedicationInputSchema},
  output: {schema: AnalyzeMedicationOutputSchema},
  prompt: `You are an AI pharmacy assistant. Your task is to provide clear, simple information about a medication.

**TASK:**
Given the medication name and a list of existing medications, you MUST generate the following information:

1.  **Summary:** Provide a simple, two-line summary of what the medication is typically used for. Keep the language easy for a non-medical person to understand.
2.  **Interaction Warning:**
    *   Review the 'New Medication' in the context of the 'Existing Medications'.
    *   If you identify a potential moderate or major interaction, provide a brief, one-sentence warning. For example: "Taking {{{medicationName}}} with [Existing Med] may increase the risk of [effect]. You should consult your doctor."
    *   If there are no significant or common interactions, omit the 'interactionWarning' field from the output. Do not mention mild or theoretical interactions.
3.  **Side Effects:** List 3-5 of the most common side effects in a bulleted list format.
4.  **Disclaimer:** You MUST include the following disclaimer text exactly as written: "This is an AI-generated summary and not a substitute for professional medical advice. Please consult with your doctor or pharmacist to discuss your medications."

**DATA:**
*   **New Medication:** "{{{medicationName}}}"
*   **Existing Medications:** {{#each existingMedications}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}

Your final output MUST be a valid JSON object matching the provided schema.
`,
});

const analyzeMedicationFlow = ai.defineFlow(
  {
    name: 'analyzeMedicationFlow',
    inputSchema: AnalyzeMedicationInputSchema,
    outputSchema: AnalyzeMedicationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
