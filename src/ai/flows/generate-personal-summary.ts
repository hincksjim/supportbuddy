
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

const SourceDocumentSchema = z.object({
    title: z.string().describe("The user-provided title for the document analysis."),
    date: z.string().describe("The date the analysis was performed."),
    analysis: z.string().describe("The AI-generated analysis of the document."),
});

const SourceConversationSchema = z.object({
    title: z.string().describe("The AI-generated title for the conversation summary."),
    date: z.string().describe("The date the conversation was summarized."),
    // Including the full message history might be too much, let's stick to the summary
    summary: z.string().describe("The AI-generated summary of the conversation."), 
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
        .describe('The history of the conversation so far. This is the primary source for the summary.'),
    timelineData: z.object({
        disclaimer: z.string(),
        timeline: z.array(TimelineStageSchema)
    }).nullable().describe('The user\'s current treatment timeline data, which includes completed steps and notes.'),
    sourceDocuments: z.array(SourceDocumentSchema).describe('An array of previously analyzed documents, including their titles and analysis content. Use this as a key source of factual information.'),
    sourceConversations: z.array(SourceConversationSchema).describe('An array of summaries from previous conversations. Use this for context and to identify trends or key discussions over time.'),
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
  prompt: `You are an AI assistant tasked with creating a comprehensive "Personal Summary Report" for a user navigating their cancer journey.

**TASK:**
Your primary goal is to synthesize all the information provided into a clear, organized, and factual Markdown report. You MUST populate the report template below using data from the **Source Documents**, **Source Conversations**, **Conversation History**, and **Timeline Data**.

**CRITICAL INSTRUCTIONS:**
1.  **USE ALL PROVIDED DATA:** You MUST use the user's personal details and all available data sources to build the report. The source documents and conversations are a critical source of factual information.
2.  **CITE YOUR SOURCES:** When you extract a specific piece of information (like a doctor's name, a test result, or a date), you **MUST** cite where you found it by referencing the source's title and date. For example: "The diagnosis of Renal Cell Carcinoma was confirmed in the 'CT Scan Results' document (from 15/07/2024)." or "The user expressed anxiety about the upcoming surgery in the conversation 'Chat about Scanxiety' (from 16/07/2024)."
3.  **FORMAT WITH MARKDOWN:** The entire output must be a single Markdown string. Use headings, bold text, bullet points, and blockquotes as defined in the template.
4.  **BE FACTUAL AND OBJECTIVE:** Extract and present information as it is given. Do not invent details, infer medical information you aren't given, or make predictions.
5.  **PRIVACY DISCLAIMER:** Start the report with the exact disclaimer provided in the template.
6.  **EXTRACT CONTACTS:** Scour all available data sources for any mention of doctor names, nurse names, hospital names, or contact details (phone numbers, etc.). Synthesize this information into a single list under the "Medical Team & Contacts" section, citing the source for each piece of contact information.

---
**AVAILABLE INFORMATION SOURCES TO USE:**

**1. Source Documents (High Importance for Factual Data):**
{{#each sourceDocuments}}
*   **Document Title:** "{{title}}"
*   **Analysis Date:** {{date}}
*   **Analysis Content:**
    > {{{analysis}}}
---
{{/each}}

**2. Source Conversations (High Importance for Context & Feelings):**
{{#each sourceConversations}}
*   **Conversation Title:** "{{title}}"
*   **Summary Date:** {{date}}
*   **Summary Content:**
    > {{{summary}}}
---
{{/each}}

**3. Full Conversation History (For detailed context):**
*   A full transcript is available in the input. Use it to find details not present in the summaries.
---
**4. Timeline Data (For milestone tracking):**
*   User's progress on their treatment plan is available in the input.
---

**REPORT TEMPLATE TO POPULATE:**

### **Personal Summary Report**
> **Disclaimer:** This report is a summary of the information you have provided from your chats and documents. It is for personal reference only and should not be considered a medical document. Always consult with your healthcare provider for official information and advice.

### **Personal Details**
*   **Name:** {{{userName}}}
*   **Age:** {{{age}}}
*   **Gender:** {{{gender}}}
*   **Location:** {{{locationInfo.city}}} (Postcode: {{{postcode}}})
*   **Local Health Authority:** {{{locationInfo.nhs_ha}}}

### **Medical Team & Contacts**
*(Extract any mentioned doctors, nurses, or hospitals from ALL available data sources. If none are mentioned, state "No information provided yet.")*
*   **Primary Consultant:** [Name, Contact Details] (Source: 'Document/Conversation Title', Date)
*   **Specialist Nurse:** [Name, Contact Details] (Source: 'Document/Conversation Title', Date)
*   **Hospital/Clinic for Diagnosis:** [Name] (Source: 'Document/Conversation Title', Date)
*   **Hospital/Clinic for Treatment/Surgery:** [Name] (Source: 'Document/Conversation Title', Date)

### **Diagnosis & Condition Summary**
*(Synthesize the key medical details from ALL available data sources into a concise summary. Include cancer type, stage, grade, dates, and key test results mentioned. Cite your sources for each key finding.)*

### **Timeline & Milestones**

**Completed Milestones:**
*(List all steps from the timelineData where status is 'completed'. For each, include the title, and any user notes. If none, state "No milestones marked as complete yet.")*
*   **[Step Title]:** Notes: *[User Notes]*

**Next Expected Milestone(s):**
*(List the next 1-2 steps from the timelineData where status is 'pending'. If none, state "All timeline steps are marked complete.")*
*   **[Step Title]:** ([Target Timeframe]) - [Description]
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
