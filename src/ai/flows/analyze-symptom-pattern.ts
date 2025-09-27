
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
import { AnalyzeSymptomPatternInputSchema, AnalyzeSymptomPatternOutputSchema } from './types';
import type { AnalyzeSymptomPatternInput, AnalyzeSymptomPatternOutput } from './types';

export async function analyzeSymptomPattern(
  input: AnalyzeSymptomPatternInput
): Promise<AnalyzeSymptomPatternOutput> {
  return analyzeSymptomPatternFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSymptomPatternPrompt',
  input: {schema: AnalyzeSymptomPatternInputSchema},
  output: {schema: AnalyzeSymptomPatternOutputSchema},
  model: 'gemini-2.5-flash-lite',
  prompt: `You are an expert medical AI assistant. Your task is to analyze a user's recurring symptom and identify potential connections to their diagnosis, medications, or treatments. Your analysis should be informative but cautious, and always encourage consultation with a real doctor.

**User's Situation:**
*   **Recurring Symptom:** {{{symptom}}}
*   **Primary Diagnosis/Conditions:** {{{diagnosis}}} (Note: This may contain multiple conditions separated by commas. Consider all of them.)
*   **Current Medications:** {{#each medications}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}
*   **Active/Recent Treatments:** {{#each treatments}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
*   **User's Remarks about the pain:**
    {{#each painRemarks}}
    - "{{this}}"
    {{/each}}


**Task:**
1.  **Analyze Connections:** Review the user's situation. Systematically check if the reported 'symptom' is a known side effect or common consequence of:
    a.  Any of the 'diagnosis' conditions listed.
    b.  Any of the 'medications' listed.
    c.  Any of the 'treatments' listed.
    d.  Also consider the user's 'painRemarks' for additional context.
2.  **Construct Analysis:** Create a response in Markdown format for the \`analysis\` field.
    *   **Summary First:** Begin with a brief, one-sentence summary of your findings. For example: "Based on your profile, the symptom might be related to your medication or one of your diagnosed conditions." or "No direct common link was found, but it's important to monitor."
    *   **Bulleted List:** Follow the summary with a bulleted list. Each bullet point should detail a specific potential connection you found.
        *   Example (Medication): "**Medication (Lisinopril):** A dry cough is a well-known side effect of ACE inhibitors like Lisinopril."
        *   Example (Diagnosis): "**Diagnosis (Hypertension):** Headaches can sometimes be associated with high blood pressure."
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
