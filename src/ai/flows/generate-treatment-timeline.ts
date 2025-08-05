'use server';

/**
 * @fileOverview Generates an illustrative treatment timeline based on a conversation.
 *
 * - generateTreatmentTimeline - A function that generates the timeline.
 * - GenerateTreatmentTimelineInput - The input type for the function.
 * - GenerateTreatmentTimelineOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTreatmentTimelineInputSchema = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
});
export type GenerateTreatmentTimelineInput =
  z.infer<typeof GenerateTreatmentTimelineInputSchema>;

const GenerateTreatmentTimelineOutputSchema = z.object({
  timeline: z.string().describe('A detailed, illustrative timeline in Markdown format.'),
});
export type GenerateTreatmentTimelineOutput =
  z.infer<typeof GenerateTreatmentTimelineOutputSchema>;

export async function generateTreatmentTimeline(
  input: GenerateTreatmentTimelineInput
): Promise<GenerateTreatmentTimelineOutput> {
  return generateTreatmentTimelineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTreatmentTimelinePrompt',
  input: {schema: GenerateTreatmentTimelineInputSchema},
  output: {schema: GenerateTreatmentTimelineOutputSchema},
  prompt: `You are an AI assistant creating an illustrative, general treatment timeline for a user based on their conversation with a support buddy. Your role is to provide a helpful, high-level overview of what a typical journey might look like, NOT to give specific, actionable medical advice or concrete dates.

**CRITICAL SAFETY INSTRUCTIONS:**
1.  **DO NOT USE SPECIFIC DATES:** You must not invent or predict specific dates. Instead, use relative timeframes like "Shortly after your scan," "Within a few weeks," or "Step 1," "Step 2."
2.  **USE STRONG DISCLAIMERS:** Start and end the timeline with a clear disclaimer that this is a general example, not a substitute for professional medical advice, and the user's actual journey may differ.
3.  **BE GENERAL:** Base the timeline on the type of condition mentioned in the conversation, but keep the steps general. Refer to national health service guidelines (like the NHS) for typical pathways if possible, but do not promise specific waiting times for certain hospitals.
4.  **FOCUS ON "WHAT" AND "WHY":** Explain what each step is for (e.g., "MDT Meeting: This is where a team of specialists reviews your case to recommend the best treatment path.")
5.  **EMPOWER THE USER:** Include a section on "Questions you could ask" or "What you can do" to help the user be proactive.

**Output Formatting Rules (MUST FOLLOW):**
*   Use Markdown for formatting.
*   Use headings (\`##\` or \`###\`) for each major stage (e.g., \`## Diagnosis Stage\`, \`## Treatment Stage\`).
*   Use bullet points (\`*\`) or numbered lists (\`1.\`) for steps within each stage.
*   Use bold (\`**text**\`) for key terms.

**Example Structure:**
---
**Disclaimer:** This is an illustrative timeline and not a substitute for professional medical advice. Your personal journey will be unique. Please consult with your doctor to discuss your specific situation.

### Stage 1: Diagnosis & Staging
*   **Initial Tests:** This is where the process begins, often with scans or biopsies.
*   **Referral to Specialist:** Your GP or initial doctor will refer you to an oncologist or a specialized surgeon.
*   **MDT Meeting:** A team of experts will review your results.

### Stage 2: Treatment
*   **Treatment Options:** Depending on the diagnosis, options could include surgery, chemotherapy, etc.
*   **Pre-treatment Checks:** Further tests to ensure you are ready for treatment.

### What You Can Do
*   Keep a diary of your symptoms.
*   Write down questions before each appointment.

---
**Final Reminder:** Timelines can vary greatly. Your medical team is the best source for information about your specific care plan.

**Task:**
Analyze the provided conversation history and generate a timeline that follows all the rules and the structure above.

**Conversation History:**
{{#each conversationHistory}}
  {{role}}: {{{content}}}
{{/each}}
`,
});

const generateTreatmentTimelineFlow = ai.defineFlow(
  {
    name: 'generateTreatmentTimelineFlow',
    inputSchema: GenerateTreatmentTimelineInputSchema,
    outputSchema: GenerateTreatmentTimelineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
