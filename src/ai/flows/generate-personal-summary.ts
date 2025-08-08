
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
    fullConversation: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })).describe("The full transcript of the conversation for detailed analysis.")
});
export type SourceConversation = z.infer<typeof SourceConversationSchema>;

const DiaryEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  mood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable(),
  diagnosisMood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable(),
  treatmentMood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable(),
  painScore: z.number().nullable(),
  weight: z.string(),
  sleep: z.string(),
  food: z.string(),
  worriedAbout: z.string(),
  positiveAbout: z.string(),
  notes: z.string(),
  medsTaken: z.array(z.object({
    id: z.string(),
    name: z.string(),
    time: z.string(),
    quantity: z.number(),
    isPrescribed: z.boolean(),
  })),
});

const MedicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.string(),
  dose: z.string(),
  issuedBy: z.string(),
  issuedDate: z.string(),
});

const GeneratePersonalSummaryInputSchema = z.object({
    userName: z.string().describe("The user's first name."),
    age: z.string().describe("The user's age."),
    gender: z.string().describe("The user's gender."),
    postcode: z.string().describe("The user's postcode."),
    employmentStatus: z.string().describe("The user's current employment status."),
    income: z.string().optional().describe("The user's annual income, if provided."),
    savings: z.string().optional().describe("The user's savings, if provided."),
    existingBenefits: z.array(z.string()).optional().describe("A list of benefits the user is already receiving."),
    timelineData: z.object({
        disclaimer: z.string(),
        timeline: z.array(TimelineStageSchema)
    }).nullable().describe('The user\'s current treatment timeline data, which includes completed steps and notes.'),
    sourceDocuments: z.array(SourceDocumentSchema).describe('An array of previously analyzed documents, including their titles and analysis content.'),
    sourceConversations: z.array(SourceConversationSchema).describe('An array of summaries and full transcripts from previous conversations.'),
    diaryData: z.array(DiaryEntrySchema).describe('An array of the user\'s diary entries.'),
    medicationData: z.array(MedicationSchema).describe('An array of the user\'s prescribed medications.'),
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
  const locationInfo = await lookupPostcode({ postcode: input.postcode });
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

const benefitsDecisionLogic = `
[
  {
    "Benefit": "Disability Living Allowance (DLA)", "Who its for": "For children under 16 to help with the extra costs of being disabled.",
    "Rule": "Age Range Under 16, Health Impact (Cancer) Has cancer"
  },
  {
    "Benefit": "Carer's Allowance", "Who its for": "For people who spend at least 35 hours a week caring for someone with substantial caring needs.",
    "Rule": "Age Range Any, Health Impact (Cancer) Caring 35+ hours/week for someone with cancer"
  },
  {
    "Benefit": "Statutory Sick Pay (SSP)", "Who its for": "Paid by your employer for up to 28 weeks if you're too ill to work.",
    "Rule": "Age Range 16-Pension Age, Employment Status Employed, Health Impact (Cancer) Cannot work (cancer)"
  },
  {
    "Benefit": "Personal Independence Payment (PIP)", "Who its for": "Helps with extra living costs if you have both a long-term physical or mental health condition and difficulty doing certain everyday tasks or getting around.",
    "Rule": "Age Range 16-Pension Age, Health Impact (Cancer) any"
  },
  {
    "Benefit": "New Style Employment and Support Allowance (ESA)", "Who its for": "For people who have a disability or health condition that affects how much they can work. It is based on your National Insurance contributions.",
    "Rule": "Age Range 16-Pension Age, Employment Status Employed or Self-employed or Unemployed or On Benefits"
  },
  {
    "Benefit": "Universal Credit (UC)", "Who its for": "A payment to help with your living costs. You may be able to get it if you’re on a low income, out of work or you cannot work.",
    "Rule": "Age Range 16-Pension Age, Income/Savings Low income/savings < £16K or Health Impact (Cancer) any"
  },
  {
    "Benefit": "Universal Credit (with LCWRA element)", "Who its for": "If you have a health condition that limits your ability to work, you can get an extra amount of Universal Credit. This is called the Limited Capability for Work and Work-Related Activity (LCWRA) element.",
    "Rule": "Age Range 16-Pension Age, Health Impact (Cancer) any"
  },
  {
    "Benefit": "Attendance Allowance", "Who its for": "For people over State Pension age who have a disability and need someone to help look after them.",
    "Rule": "Age Range Pension Age+, Health Impact (Cancer) any"
  },
  {
    "Benefit": "Pension Credit", "Who its for": "An income-related benefit to give you some extra money in retirement if you're on a low income.",
    "Rule": "Age Range Pension Age+, Employment Status Retired or any"
  },
  {
    "Benefit": "Blue Badge", "Who its for": "Helps people with disabilities or health conditions park closer to their destination.",
    "Rule": "Age Range Any, Health Impact (Cancer) any mobility issues"
  },
  {
    "Benefit": "Council Tax Support", "Who its for": "Helps people on low incomes pay their Council Tax bill. This is provided by your local council.",
    "Rule": "Age Range Any, Income/Savings Low income"
  }
]
`;


const prompt = ai.definePrompt({
  name: 'generatePersonalSummaryPrompt',
  input: {schema: EnrichedGeneratePersonalSummaryInputSchema},
  output: {schema: GeneratePersonalSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with creating a comprehensive "Personal Summary Report" for a user navigating their cancer journey.

**TASK:**
Your primary goal is to synthesize ALL information provided into a clear, organized, and factual Markdown report. You MUST populate the report template below. You are a meticulous personal health assistant; your job is to find and collate every relevant detail from all the sources provided.

**CRITICAL INSTRUCTIONS:**
1.  **USE ALL PROVIDED DATA:** You MUST use the user's personal details and all available data sources (Documents, Conversations, Diary, Medications, Timeline, Financials) to build the report. The saved conversation transcripts are a primary source of truth for the user's narrative.
2.  **CITE YOUR SOURCES:** When you extract a specific piece of information (like a doctor's name, a test result, a date, or a feeling), you **MUST** cite where you found it using a reference marker, like **[D0]** for the first document or **[C1]** for the second conversation. The letter indicates the type (D for Document, C for Conversation) and the number is the index from the source list.
3.  **FORMAT WITH MARKDOWN:** The entire output must be a single Markdown string. Use headings, bold text, bullet points, and blockquotes as defined in the template.
4.  **BE FACTUAL AND OBJECTIVE:** Extract and present information as it is given. Do not invent details or make medical predictions.
5.  **INFER DATES CAREFULLY:** The current date is **{{{currentDate}}}**. When a user mentions a relative date like "tomorrow," you MUST calculate the specific date. If a timeframe is ambiguous (e.g., "in two weeks"), state it exactly as provided.
6.  **PRIVACY DISCLAIMER:** Start the report with the exact disclaimer provided in the template.
7.  **EXTRACT CONTACTS & NUMBERS:** Scour all available data sources (especially conversations and documents) for any mention of doctor names, nurse names, hospital names, contact details (including phone numbers), **NHS Numbers**, and **Hospital Numbers**. Synthesize this into the appropriate sections.
8.  **CREATE A NUMBERED SOURCE LIST:** At the end of the report, create a section called "### Sources". List all the source documents and conversations you were provided, using the title, date, and ID for each, along with their citation marker.
9.  **ANALYZE BENEFITS:** You must analyze the user's financial situation using the provided Benefits JSON Ruleset to populate the "Potential Additional Benefits" section of the report.

---
**FIRST, REVIEW ALL AVAILABLE INFORMATION SOURCES TO USE:**

**1. Source Documents (High Importance for Factual Data):**
{{#each sourceDocuments}}
*   **Source ID (for citation):** D{{@index}}
*   **Document Title:** "{{title}}" (Analyzed: {{date}})
*   **Analysis:**
    {{{analysis}}}
---
{{/each}}

**2. Source Conversations (Primary Source of Narrative and Details):**
{{#each sourceConversations}}
*   **Source ID (for citation):** C{{@index}}
*   **Conversation Title:** "{{title}}" (Summarized: {{date}})
*   **Full Conversation Transcript (Review carefully for details):**
    {{#each fullConversation}}
        {{role}}: {{{content}}}
    {{/each}}
---
{{/each}}

**3. Diary Entries (For Wellness Trends, Symptoms, and Daily Feelings):**
{{#each diaryData}}
*   **Source Date (for citation):** Diary - {{date}}
*   **Content:** Mood: {{mood}}, Pain: {{painScore}}, Worried About: "{{worriedAbout}}", Positive About: "{{positiveAbout}}", Notes: "{{notes}}"
---
{{/each}}

**4. Medication List (For Current Prescriptions):**
{{#each medicationData}}
*   **Medication:** {{name}} {{strength}}, Dose: {{dose}}
---
{{/each}}

**5. User's Timeline (For Milestones):**
*   Use the timeline data to understand planned and completed steps.
---

**Benefits Definitions (JSON Ruleset):**
\`\`\`json
${benefitsDecisionLogic}
\`\`\`

---
**NOW, POPULATE THE REPORT TEMPLATE BELOW:**

### **Personal Summary Report**
> **Disclaimer:** This report is a summary of the information you have provided. It is for personal reference only and should not be considered a medical document. Always consult with your healthcare provider for official information and advice.

### **Personal Details**
*   **Name:** {{{userName}}}
*   **Age:** {{{age}}}
*   **Gender:** {{{gender}}}
*   **Location:** {{{locationInfo.city}}} (Postcode: {{{postcode}}})
*   **Local Health Authority:** {{{locationInfo.nhs_ha}}}
*   **NHS Number:** [Extract from sources, e.g., 123 456 7890] [C1]
*   **Hospital Number:** [Extract from sources] [D0]

### **Medical Team & Contacts**
*(This section should be a bulleted list of any and all medical contacts found in the data sources. Extract any mentioned doctors, specialist teams (e.g., "urology cancer team"), nurses, or hospitals, along with their contact details. If none are mentioned, state "No information provided yet.")*
*   [Example: Urology Cancer Team at Wrexham Maelor Hospital - Phone: 03000857868] [C0]
*   [Example: Dr. Smith, Consultant Oncologist] [D1]

### **Diagnosis & Condition Summary**
*(Synthesize the key medical details from ALL data sources into a concise summary. Include cancer type, stage, dates, and key test results. Cite your sources for each key finding using a reference marker like [D0] or [C1].)*

### **Current Medications**
*(List all medications from the 'medicationData' source. If none, state "No medications listed.")*
{{#if medicationData}}
{{#each medicationData}}
*   **{{name}} ({{strength}}):** {{dose}} - *Prescribed by {{issuedBy}} on {{issuedDate}}*
{{/each}}
{{else}}
*   No medications listed.
{{/if}}

### **Wellness & Diary Insights**
*(Review the last 5 diary entries. You MUST create a Markdown bulleted list. Each bullet point MUST represent one single day and start on a new line. For example: * August 5th, 2025: Mood: bad, Pain: 0, Worried about MDT outcome. [Diary])*

### **Timeline & Milestones**
**Completed Milestones:**
*(Review ALL data sources—documents, chats, and the user's timeline—to identify completed events. List them here with dates if available and cite the source.)*
*   [Example: Initial Diagnosis Confirmed (Renal Cell Carcinoma)] [D0]
*   [Example: MDT Meeting Held (Discussed treatment options)] [C2]

**Next Expected Milestone(s):**
*(Based on all available information, identify the next logical step. Use the current date ({{{currentDate}}}) to calculate specific dates where possible. Cite the source.)*
*   [Example: Surgical Procedure at Wrexham Maelor Hospital on Friday, 9 August 2024] [C3]

### **Financial Summary**
*   **Employment Status:** {{{employmentStatus}}}
*   **Annual Income:** {{{income}}}
*   **Savings:** {{{savings}}}
*   **Existing Benefits:** {{#if existingBenefits}}{{#each existingBenefits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None listed{{/if}}

### **Potential Additional Benefits**
*(Based on the user's profile and the Benefits JSON Ruleset, list any benefits they may be eligible for but are not currently receiving. For each, provide a brief description of what it is for. If none, state "No additional benefits were identified at this time.")*
*   [Example: **Personal Independence Payment (PIP):** For help with extra living costs due to a long-term health condition.]

---
### **Sources**
*(List all the source documents and conversations as a numbered list with their citation marker.)*
{{#each sourceDocuments as |doc|}}
*   [D{{@index}}] Document: "{{doc.title}}" (Analyzed: {{doc.date}}, ID: {{doc.id}})
{{/each}}
{{#each sourceConversations as |convo|}}
*   [C{{@index}}] Conversation: "{{convo.title}}" (Summarized: {{convo.date}}, ID: {{convo.id}})
{{/each}}
`,
  },
);

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
