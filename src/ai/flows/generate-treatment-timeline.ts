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
1.  **DO NOT USE SPECIFIC DATES:** You must not invent or predict specific future dates. Instead, use relative timeframes based on the information provided (e.g., "Shortly after your scan on [Date]," "Within a few weeks of your diagnosis"). If dates are mentioned in the conversation, you can use them as reference points.
2.  **REFERENCE NATIONAL GUIDELINES:** Structure the timeline around known national guidelines (e.g., the 62-day referral-to-treatment target for NHS). This provides a useful, generic framework.
3.  **USE STRONG DISCLAIMERS:** Start and end the timeline with a clear disclaimer that this is a general example based on national targets, not a substitute for professional medical advice, and the user's actual journey may differ.
4.  **BE PERSONALIZED BUT GENERAL:** Base the timeline on the type of condition, stage, and key details mentioned in the conversation (e.g., "For a large renal mass like yours..."). Keep the steps general but tailored to the context provided.
5.  **FOCUS ON "WHAT" AND "WHY":** Explain what each step is for (e.g., "MDT Meeting: This is where a team of specialists, including oncologists and surgeons, reviews your case to recommend the best treatment path for you.")
6.  **EMPOWER THE USER:** Include a section on "Questions you could ask" or "What you can do" to help the user be proactive in their own care.
7.  **NEVER PREDICT OUTCOMES:** Do not make any predictions about prognosis, recovery, or the success of treatment.

**Output Formatting Rules (MUST FOLLOW):**
*   Use Markdown for formatting.
*   Use headings (e.g., \`## Stage 1: Diagnosis\`, \`### Key Milestones\`) for each major stage.
*   Use bullet points (\`*\`) for steps within each stage.
*   Use bold (\`**text**\`) for key terms and to highlight important factors from the user's conversation.
*   Structure the output logically, following a path from diagnosis to treatment and recovery.

**Example Structure:**
---
**Disclaimer:** This is an illustrative timeline based on national guidelines and is not a substitute for professional medical advice. Your personal journey will be unique and your medical team is the only source for accurate information about your care plan.

### Stage 1: Diagnosis & Staging (Target: first 31 days)
*   **Initial Discovery:** For you, this was the **CT scan on 27th July** which found a **71mm mass**.
*   **Urgent Referral:** Following a discovery like this, an urgent referral to a urology specialist is standard. The national target is often within 2 weeks.
*   **Staging Scans:** To determine if the cancer has spread, you will likely have further scans (e.g., a chest CT).
*   **MDT Meeting:** A team of experts will review all your results to confirm the **stage and grade** of the cancer and recommend a treatment plan.

### Stage 2: Treatment (Target: within 62 days of referral)
*   **Treatment Options:** Based on the MDT, for a **large kidney mass**, surgery is the most common primary treatment.
*   **Pre-treatment Checks:** Tests to ensure you are fit for the recommended treatment.

### What You Can Do
*   Keep a diary of your symptoms and any questions you have.
*   Ask about the results from the MDT meeting.
*   Enquire about support services available at the hospital.

---
**Final Reminder:** Timelines can vary greatly depending on many factors. Your medical team is the best source for information about your specific care plan.

**Task:**
Analyze the provided conversation history. Identify the user's condition, stage, key dates, and any other relevant details. Generate a timeline that follows all the rules and the structure above.

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
