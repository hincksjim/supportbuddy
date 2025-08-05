
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
  
  // Get the current date to help the AI infer dates from relative terms.
  const currentDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const extendedInput = { ...input, locationInfo, currentDate };
  return generatePersonalSummaryFlow(extendedInput);
}

const EnrichedGeneratePersonalSummaryInputSchema = GeneratePersonalSummaryInputSchema.extend({
    locationInfo: z.object({
        city: z.string(),
        nhs_ha: z.string(),
    }),
    currentDate: z.string().describe("The current date in 'Weekday, Day Month Year' format. For calculating dates from relative terms like 'tomorrow'."),
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
5.  **INFER DATES CAREFULLY:** The current date is **{{{currentDate}}}**. When a user mentions a relative date like "tomorrow" or "on Thursday," you MUST calculate the specific date and include it. For example, if today is "Wednesday, 7 August 2024" and the user says their appointment is "tomorrow," you should write "Appointment on Thursday, 8 August 2024." **SAFETY:** If a timeframe is ambiguous (e.g., "in two weeks," "next month"), DO NOT invent a date. State the information exactly as it was provided.
6.  **PRIVACY DISCLAIMER:** Start the report with the exact disclaimer provided in the template.
7.  **EXTRACT CONTACTS & NUMBERS:** Scour all available data sources for any mention of doctor names, nurse names, hospital names, contact details (phone numbers, etc.), **NHS Numbers**, and **Hospital Numbers**. Synthesize this information into the appropriate sections ("Personal Details" or "Medical Team & Contacts").
8.  **CREATE A NUMBERED SOURCE LIST:** At the end of the report, create a section called "### Sources". In this section, you will list all the source documents and conversations you were provided. Each one should be a numbered item. You MUST use the title, date, and ID provided for each source.

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
**4. Timeline Data (For user-curated milestone tracking):**
*   The user's interactive timeline is available in the input. Use it as one of the sources for the "Timeline & Milestones" section, but also look for implied milestones in other sources.
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
*   **NHS Number:** [Extract from sources, e.g., 123 456 7890] [1]
*   **Hospital Number:** [Extract from sources] [1]

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
*(Carefully review ALL data sources—documents, chats, and the user's interactive timeline—to identify completed events. A discharge summary implies a hospital stay is complete. A chat message saying "My scan was yesterday" is a completed milestone. List them here with dates if available.)*
*   **Initial Diagnosis Confirmed:** (e.g., Renal Cell Carcinoma) [1]
*   **MDT Meeting Held:** (e.g., Discussed treatment options) [2]

**Next Expected Milestone(s):**
*(Based on all available information, identify the next logical step in the user's journey. This might be from their interactive timeline, or it might be implied from a document (e.g., "Follow-up appointment scheduled for...") or a chat. Use the current date ({{{currentDate}}}) to calculate specific dates where possible. Cite the source.)*
*   **Surgical Procedure:** (e.g., at Wrexham Maelor Hospital on Friday, 9 August 2024) [3]
*   **Follow-up Consultation:** (e.g., with Dr. Smith in two weeks) [1]

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
