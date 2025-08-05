
'use server';

/**
 * @fileOverview Generates a comprehensive personal summary report for the user.
 *
 * - generatePersonalSummary - A function that generates the summary.
 * - GeneratePersonalSummaryInput - The input type for the function.
 * - GeneratePersonalSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { lookupPostcode } from '@/services/postcode-lookup';


const TimelineStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  target: z.string(),
  status: z.enum(['pending', 'completed']),
  notes: z.string(),
});

const TimelineStageSchema = z.object({
  title: z.string(),
  description: z.string(),
  steps: z.array(TimelineStepSchema),
});

const GeneratePersonalSummaryInputSchema = z.object({
    userName: z.string().describe("The user's first name."),
    age: z.string().describe("The user's age."),
    gender: z.string().describe("The user's gender."),
    postcode: z.string().describe("The user's postcode."),
    conversationHistory: z
        .array(
        z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
        })
        )
        .describe('The history of the conversation so far.'),
    timelineData: z.object({
        disclaimer: z.string(),
        timeline: z.array(TimelineStageSchema)
    }).nullable().describe('The user\'s current treatment timeline data, which includes completed steps and notes.'),
    documentAnalyses: z.array(z.string()).describe('An array of AI-generated analyses from previously uploaded documents.'),
});
export type GeneratePersonalSummaryInput = z.infer<
  typeof GeneratePersonalSummaryInputSchema
>;

const GeneratePersonalSummaryOutputSchema = z.object({
  report: z.string().describe('A comprehensive summary report formatted in Markdown.'),
});
export type GeneratePersonalSummaryOutput = z.infer<
  typeof GeneratePersonalSummaryOutputSchema
>;

export async function generatePersonalSummary(
  input: GeneratePersonalSummaryInput
): Promise<GeneratePersonalSummaryOutput> {
  // We can call the tool directly here to enrich the data available to the prompt.
  const locationInfo = await lookupPostcode({ postcode: input.postcode });
  const extendedInput = { ...input, locationInfo };
  return generatePersonalSummaryFlow(extendedInput);
}

const EnrichedGeneratePersonalSummaryInputSchema = GeneratePersonalSummaryInputSchema.extend({
    locationInfo: z.object({
        city: z.string(),
        nhs_ha: z.string(),
    })
});

const prompt = ai.definePrompt({
  name: 'generatePersonalSummaryPrompt',
  input: {schema: EnrichedGeneratePersonalSummaryInputSchema},
  output: {schema: GeneratePersonalSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with creating a comprehensive "Personal Summary Report" for a user navigating their cancer journey. Your role is to synthesize all available information into a clear, organized, and easy-to-read document formatted in Markdown.

**CRITICAL INSTRUCTIONS:**
1.  **USE ALL PROVIDED DATA:** You MUST use the user's personal details, the full conversation history, all document analyses, the location information, and the timeline data to build the report. The document analyses are a critical source of factual information.
2.  **FORMAT WITH MARKDOWN:** The entire output must be a single Markdown string. Use headings, bold text, bullet points, and blockquotes to structure the information logically.
3.  **BE FACTUAL AND OBJECTIVE:** Extract and present information as it is given. Do not invent details, infer medical information you aren't given, or make predictions.
4.  **PRIVACY DISCLAIMER:** Start the report with a clear disclaimer about privacy and accuracy.
5.  **EXTRACT CONTACTS:** Scour the conversation history AND the document analyses for any mention of doctor names, nurse names, hospital names, or contact details (phone numbers, etc.). Synthesize this information into a single list.

**REPORT STRUCTURE (Must follow this format):**

---

### **Personal Summary Report**
> **Disclaimer:** This report is a summary of the information you have provided from your chats and documents. It is for personal reference only and should not be considered a medical document. Always consult with your healthcare provider for official information and advice.

### **Personal Details**
*   **Name:** {{{userName}}}
*   **Age:** {{{age}}}
*   **Gender:** {{{gender}}}
*   **Location:** {{{locationInfo.city}}} (Postcode: {{{postcode}}})
*   **Local Health Authority:** {{{locationInfo.nhs_ha}}}

### **Medical Team & Contacts**
*(Extract any mentioned doctors, nurses, or hospitals from the conversation AND the document analyses. If none are mentioned, state "No information provided yet.")*
*   **Primary Consultant:** [Name, Contact Details]
*   **Specialist Nurse:** [Name, Contact Details]
*   **Hospital/Clinic for Diagnosis:** [Name]
*   **Hospital/Clinic for Treatment/Surgery:** [Name]

### **Diagnosis & Condition Summary**
*(Synthesize the key medical details from the conversation history AND the document analyses into a concise summary. Include cancer type, stage, grade, dates, and key test results mentioned.)*

### **Timeline & Milestones**

**Completed Milestones:**
*(List all steps from the timelineData where status is 'completed'. For each, include the title, and any user notes. If none, state "No milestones marked as complete yet.")*
*   **[Step Title]:** Notes: *[User Notes]*

**Next Expected Milestone(s):**
*(List the next 1-2 steps from the timelineData where status is 'pending'. If none, state "All timeline steps are marked complete.")*
*   **[Step Title]:** ([Target Timeframe]) - [Description]

---

**Source Document Analyses (for context):**
{{#each documentAnalyses}}
---
Analysis Result:
{{{this}}}
---
{{/each}}

**Source Conversation History (for context):**
{{#each conversationHistory}}
  {{role}}: {{{content}}}
{{/each}}

---

**Task:**
Analyze all the provided inputs and generate the report in a single Markdown string.
`,
});

const generatePersonalSummaryFlow = ai.defineFlow(
  {
    name: 'generatePersonalSummaryFlow',
    inputSchema: EnrichedGeneratePersonalSummaryInputSchema,
    outputSchema: GeneratePersonalSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
