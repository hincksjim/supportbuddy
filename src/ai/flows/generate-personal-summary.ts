
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
    id: z.string().describe("The unique ID of the document analysis."),
    title: z.string().describe("The user-provided title for the document analysis."),
    date: z.string().describe("The date the analysis was performed."),
    analysis: z.string().describe("The AI-generated analysis of the document."),
});
export type SourceDocument = z.infer<typeof SourceDocumentSchema>;


const SourceConversationSchema = z.object({
    id: z.string().describe("The unique ID of the conversation summary."),
    title: z.string().describe("The AI-generated title for the conversation summary."),
    date: z.string().describe("The date the conversation was summarized."),
    summary: z.string().describe("The AI-generated summary of the conversation."), 
});
export type SourceConversation = z.infer<typeof SourceConversationSchema>;


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
2.  **CITE YOUR SOURCES:** When you extract a specific piece of information (like a doctor's name, a test result, or a date), you **MUST** cite where you found it using a numbered reference marker in square brackets, like **[1]**. The number should correspond to an entry in the "Sources" section at the end of the report.
3.  **FORMAT WITH MARKDOWN:** The entire output must be a single Markdown string. Use headings, bold text, bullet points, and blockquotes as defined in the template.
4.  **BE FACTUAL AND OBJECTIVE:** Extract and present information as it is given. Do not invent details, infer medical information you aren't given, or make predictions.
5.  **PRIVACY DISCLAIMER:** Start the report with the exact disclaimer provided in the template.
6.  **EXTRACT CONTACTS:** Scour all available data sources for any mention of doctor names, nurse names, hospital names, or contact details (phone numbers, etc.). Synthesize this information into a single list under the "Medical Team & Contacts" section.
7.  **CREATE A NUMBERED SOURCE LIST:** At the end of the report, create a section called "### Sources". In this section, you will list all the source documents and conversations you were provided. Each one should be a numbered item. You MUST use the title, date, and ID provided for each source.

---
**FIRST, REVIEW ALL AVAILABLE INFORMATION SOURCES TO USE:**

**1. Source Documents (High Importance for Factual Data):**
{{#each sourceDocuments}}
*   **Source ID (for citation):** {{@index}}
*   **Document Title:** "{{title}}"
*   **Analysis Date:** {{date}}
*   **Analysis ID:** {{id}}
*   **Analysis Content:**
    > {{{analysis}}}
---
{{/each}}

**2. Source Conversations (High Importance for Context & Feelings):**
{{#each sourceConversations}}
*   **Source ID (for citation):** {{@index}}
*   **Conversation Title:** "{{title}}"
*   **Summary Date:** {{date}}
*   **Summary ID:** {{id}}
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

**NOW, POPULATE THE REPORT TEMPLATE BELOW:**

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
*   **Primary Consultant:** [Name, Contact Details] [1]
*   **Specialist Nurse:** [Name, Contact Details] [2]
*   **Hospital/Clinic for Diagnosis:** [Name] [1]
*   **Hospital/Clinic for Treatment/Surgery:** [Name] [3]

### **Diagnosis & Condition Summary**
*(Synthesize the key medical details from ALL available data sources into a concise summary. Include cancer type, stage, grade, dates, and key test results mentioned. Cite your sources for each key finding using a numbered marker like [1].)*

### **Timeline & Milestones**

**Completed Milestones:**
*(List all steps from the timelineData where status is 'completed'. For each, include the title, and any user notes. If none, state "No milestones marked as complete yet.")*
*   **[Step Title]:** Notes: *[User Notes]*

**Next Expected Milestone(s):**
*(List the next 1-2 steps from the timelineData where status is 'pending'. If none, state "All timeline steps are marked complete.")*
*   **[Step Title]:** ([Target Timeframe]) - [Description]

---
### **Sources**
*(List all the source documents and conversations as a numbered list. Use the title, date, and ID provided for each.)*
1.  Document: "{{sourceDocuments.[0].title}}" (Analyzed: {{sourceDocuments.[0].date}}, ID: {{sourceDocuments.[0].id}})
2.  Conversation: "{{sourceConversations.[0].title}}" (Summarized: {{sourceConversations.[0].date}}, ID: {{sourceConversations.[0].id}})
3.  Conversation: "{{sourceConversations.[1].title}}" (Summarized: {{sourceConversations.[1].date}}, ID: {{sourceConversations.[1].id}})
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
