'use server';

/**
 * @fileOverview An AI agent to analyze a recurring symptom against a user's profile.
 *
 * - analyzeSymptomPattern - A function that handles the symptom analysis.
 * - AnalyzeSymptomPatternInput - The input type for the function.
 * - AnalyzeSymptomPatternOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AnalyzeSymptomPatternInputSchema = z.object({
  symptom: z.string().describe("The recurring symptom being experienced by the user (e.g., 'Headache', 'Nausea', 'Back (Lower) pain')."),
  diagnosis: z.string().describe("The user's primary diagnosis (e.g., 'Renal Cell Carcinoma')."),
  medications: z.array(z.object({ name: z.string() })).describe("A list of medications the user is currently taking."),
  treatments: z.array(z.string()).describe("A list of active or recent treatment step titles (e.g., 'Chemotherapy', 'Partial Nephrectomy')."),
});
export type AnalyzeSymptomPatternInput = z.infer<typeof AnalyzeSymptomPatternInputSchema>;

export const AnalyzeSymptomPatternOutputSchema = z.object({
  analysis: z.string().describe("A markdown-formatted string detailing potential links between the symptom and the user's profile. Should start with a summary, then bullet points for each potential link found."),
});
export type AnalyzeSymptomPatternOutput = z.infer<typeof AnalyzeSymptomPatternOutputSchema>;

export async function analyzeSymptomPattern(
  input: AnalyzeSymptomPatternInput
): Promise<AnalyzeSymptomPatternOutput> {
  return analyzeSymptomPatternFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSymptomPatternPrompt',
  input: {schema: AnalyzeSymptomPatternInputSchema},
  output: {schema: AnalyzeSymptomPatternOutputSchema},
  prompt: `You are an expert medical AI assistant. Your task is to analyze a user's recurring symptom and identify potential connections to their diagnosis, medications, or treatments. Your analysis should be informative but cautious, and always encourage consultation with a real doctor.

**User's Situation:**
*   **Recurring Symptom:** {{{symptom}}}
*   **Primary Diagnosis:** {{{diagnosis}}}
*   **Current Medications:** {{#each medications}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}
*   **Active/Recent Treatments:** {{#each treatments}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**Task:**
1.  **Analyze Connections:** Review the user's situation. Systematically check if the reported 'symptom' is a known side effect or common consequence of:
    a.  The 'diagnosis' itself.
    b.  Any of the 'medications' listed.
    c.  Any of the 'treatments' listed.
2.  **Construct Analysis:** Create a response in Markdown format for the \`analysis\` field.
    *   **Summary First:** Begin with a brief, one-sentence summary of your findings. For example: "Based on your profile, the symptom might be related to your medication or diagnosis." or "No direct common link was found, but it's important to monitor."
    *   **Bulleted List:** Follow the summary with a bulleted list. Each bullet point should detail a specific potential connection you found.
        *   Example (Medication): "**Medication (Lisinopril):** A dry cough is a well-known side effect of ACE inhibitors like Lisinopril."
        *   Example (Diagnosis): "**Diagnosis (Renal Cell Carcinoma):** Lower back pain can sometimes be associated with kidney conditions."
        *   Example (Treatment): "**Treatment (Chemotherapy):** Nausea and fatigue are very common side effects of most chemotherapy regimens."
    *   **No Link Found:** If you find no common or direct links, the analysis should state that clearly. For example: "No common links between '{{{symptom}}}' and your listed profile details were identified. However, new symptoms should always be discussed with your care team."
3.  **Maintain Safety:**
    *   Do NOT present your analysis as a diagnosis.
    *   Use cautious language like "could be related to," "is a known side effect of," or "is sometimes associated with."
    *   Do NOT provide medical advice or suggest any actions (e.g., "stop taking your medication").

Your final output must be a valid JSON object.`,
});

const analyzeSymptomPatternFlow = ai.defineFlow(
  {
    name: 'analyzeSymptomPatternFlow',
    inputSchema: AnalyzeSymptomPatternInputSchema,
    outputSchema: AnalyzeSymptomPatternOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
