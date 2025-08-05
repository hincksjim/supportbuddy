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

const GenerateTreatmentTimelineInputSchema = z.object({
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .describe('The history of the conversation so far.'),
});
export type GenerateTreatmentTimelineInput = z.infer<
  typeof GenerateTreatmentTimelineInputSchema
>;

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

**CRITICAL SAFETY INSTRUCTIONS & GUIDELINES:**
1.  **GENERATE STRUCTURED JSON:** You MUST output a valid JSON object matching the provided output schema. Do NOT output Markdown or any other format.
2.  **DO NOT USE SPECIFIC DATES:** You must not invent or predict future dates. Use relative, general timeframes (e.g., "Shortly after your scan," "Within a few weeks of diagnosis"). Reference national guidelines where appropriate (e.g., "The NHS aims for this to happen within 62 days of your initial referral.").
3.  **CREATE A DISCLAIMER:** The \`disclaimer\` field is mandatory. It must clearly state that this is a general example, not a substitute for professional medical advice, and the user's actual journey may differ.
4.  **BE PERSONALIZED BUT GENERAL:** Base the timeline on the user's condition details from the conversation (e.g., "For a large renal mass like yours..."). Keep the steps general enough to be safe but tailored to the context.
5.  **FOCUS ON "WHAT" AND "WHY":** For each step, provide a simple \`description\` explaining what it is and why it's important. (e.g., "MDT Meeting: A team of specialists reviews your case to recommend the best treatment path.").
6.  **NEVER PREDICT OUTCOMES:** Do not make any predictions about prognosis, recovery, or treatment success.
7.  **DEFAULT STATUS:** All steps should have their \`status\` field set to "pending" and \`notes\` set to an empty string by default.

**Task:**
Analyze the provided conversation history. Identify the user's condition, stage, and other relevant details. Generate a structured JSON timeline that follows all the rules above.

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
