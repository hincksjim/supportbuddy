
'use server';

/**
 * @fileOverview Generates an illustrative, interactive treatment timeline based on a conversation.
 *
 * - generateTreatmentTimeline - A function that generates the timeline.
 * - GenerateTreatmentTimelineInput - The input type for the function.
 * - GenerateTreatmentTimelineOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TimelineStepSchema = z.object({
  id: z.string().describe('A unique identifier for the step (e.g., "diagnosis-mri").'),
  title: z.string().describe('The title of the timeline step (e.g., "Staging Scans").'),
  description: z
    .string()
    .describe('A simple, one-sentence explanation of what this step is and why it is done.'),
  target: z
    .string()
    .describe(
      'The generic target timeframe for this step, based on national guidelines (e.g., "Within 2 weeks of referral").'
    ),
  status: z.enum(['pending', 'completed']).default('pending').describe('The current status of this step.'),
  notes: z.string().default('').describe('A field for the user to add their own notes.'),
});

const TimelineStageSchema = z.object({
  title: z.string().describe('The title of the stage (e.g., "Stage 1: Diagnosis & Staging").'),
  description: z.string().describe('A brief description of the goal of this stage.'),
  steps: z.array(TimelineStepSchema),
});

const GenerateTreatmentTimelineOutputSchema = z.object({
  disclaimer: z.string().describe('A mandatory disclaimer explaining that this is an illustrative, non-medical timeline.'),
  timeline: z.array(TimelineStageSchema),
});
export type GenerateTreatmentTimelineOutput = z.infer<
  typeof GenerateTreatmentTimelineOutputSchema
>;

const GenerateTreatmentTimelineInputSchema = z.object({
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .describe('The history of the conversation so far.'),
  existingTimeline: GenerateTreatmentTimelineOutputSchema.nullable().describe("The user's current timeline data, including their notes and completion statuses. Use this as a base to update from.")
});
export type GenerateTreatmentTimelineInput = z.infer<
  typeof GenerateTreatmentTimelineInputSchema
>;


export async function generateTreatmentTimeline(
  input: GenerateTreatmentTimelineInput
): Promise<GenerateTreatmentTimelineOutput> {
  return generateTreatmentTimelineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTreatmentTimelinePrompt',
  input: {schema: GenerateTreatmentTimelineInputSchema},
  output: {schema: GenerateTreatmentTimelineOutputSchema},
  model: 'googleai/gemini-pro',
  prompt: `You are an AI assistant creating an illustrative, general treatment timeline for a user based on their conversation with a support buddy. Your role is to provide a helpful, high-level overview of what a typical journey might look like, NOT to give specific, actionable medical advice or concrete dates.

**CRITICAL SAFETY INSTRUCTIONS & GUIDELINES:**
1.  **GENERATE STRUCTURED JSON:** You MUST output a valid JSON object matching the provided output schema. Do NOT output Markdown or any other format.
2.  **PRESERVE USER DATA:** The user may provide an \`existingTimeline\`. If they do, you MUST use it as a base.
    *   For any step that already exists (matched by its \`id\`), you **MUST preserve the user's existing \`status\` and \`notes\`**. Do not overwrite their data.
    *   Your task is to update the timeline with any *new* steps or stages mentioned in the latest conversation, or adjust the order if necessary, while keeping existing data intact.
3.  **INCLUDE SPECIFIC TREATMENTS:** If the conversation mentions treatments like Chemotherapy, Radiotherapy, or Immunotherapy, you MUST include a dedicated stage for them.
4.  **DO NOT USE SPECIFIC DATES:** You must not invent or predict future dates. Use relative, general timeframes (e.g., "Shortly after your scan," "Within a few weeks of diagnosis"). Reference national guidelines where appropriate (e.g., "The NHS aims for this to happen within 62 days of your initial referral.").
5.  **CREATE A DISCLAIMER:** The \`disclaimer\` field is mandatory. It must clearly state that this is a general example, not a substitute for professional medical advice, and the user's actual journey may differ.
6.  **BE PERSONALIZED BUT GENERAL:** Base the timeline on the user's condition details from the conversation (e.g., "For a large renal mass like yours..."). Keep the steps general enough to be safe but tailored to the context.
7.  **FOCUS ON "WHAT" AND "WHY":** For each step, provide a simple \`description\` explaining what it is and why it's important. (e.g., "MDT Meeting: A team of specialists reviews your case to recommend the best treatment path.").
8.  **ADD POST-MDT CONSULTATION:** After the "MDT Meeting" step, you MUST include a step for the face-to-face meeting. Title it "Post-MDT Consultation" and describe it as: "A face-to-face meeting with your consultant to discuss the MDT's findings and agree on a treatment plan. This is a key opportunity to ask questions."
9.  **NEVER PREDICT OUTCOMES:** Do not make any predictions about prognosis, recovery, or treatment success.
10. **DEFAULT STATUS:** For any *new* steps you add, the \`status\` must be "pending" and \`notes\` must be an empty string.

**Task:**
Analyze the provided conversation history. If an \`existingTimeline\` is provided, update it. If not, create a new one from scratch. Generate a structured JSON timeline that follows all the rules above.

**Existing Timeline (if any):**
{{{json existingTimeline}}}

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
