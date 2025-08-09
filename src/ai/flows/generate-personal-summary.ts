
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
import { generateBenefitsSuggestion } from '@/ai/flows/generate-benefits-suggestion';
import { SourceConversation, SourceDocument } from './types';


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
    initialDiagnosis: z.string().optional().describe("The user's primary diagnosis selected at signup."),
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
    sourceDocuments: z.array(SourceDocument).describe('An array of previously analyzed documents, including their titles and analysis content.'),
    sourceConversations: z.array(SourceConversation).describe('An array of summaries and full transcripts from previous conversations.'),
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
  // Step 1: Call dependent flows first
  const locationInfo = await lookupPostcode({ postcode: input.postcode });
  const benefitsResult = await generateBenefitsSuggestion({
      age: input.age,
      employmentStatus: input.employmentStatus,
      income: input.income,
      savings: input.savings,
      existingBenefits: input.existingBenefits || [],
  });

  const currentDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // Step 2: Pre-format the benefits list into a simple string.
  let potentialBenefitsText = "*   No additional benefits were identified at this time.";
  if (benefitsResult.suggestions && benefitsResult.suggestions.length > 0) {
      potentialBenefitsText = benefitsResult.suggestions
          .map(b => `*   **${b.name}:** ${b.reason}`)
          .join('\n');
  }


  // Step 3: Prepare the input for the main summary prompt
  const extendedInput = { 
    ...input, 
    locationInfo, 
    currentDate,
    potentialBenefitsText, // Pass the pre-formatted string
  };
  
  // Step 4: Call the main summarization flow
  return generatePersonalSummaryFlow(extendedInput);
}

const EnrichedGeneratePersonalSummaryInputSchema = GeneratePersonalSummaryInputSchema.extend({
    locationInfo: z.object({
        city: z.string(),
        nhs_ha: z.string(),
    }),
    currentDate: z.string().describe("The current date in 'Weekday, Day Month Year' format. For calculating dates from relative terms like 'tomorrow'."),
    potentialBenefitsText: z.string().describe("A pre-formatted, Markdown-ready string listing potential benefits."),
});


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
9.  **INJECT BENEFITS TEXT:** The "Potential Additional Benefits" section MUST be populated *only* by inserting the exact pre-formatted text provided in the \`potentialBenefitsText\` input field. Do not modify, re-calculate, or summarize it.

---
**FIRST, REVIEW ALL AVAILABLE INFORMATION SOURCES TO USE:**

**1. Primary Diagnosis (from user profile):**
*   {{{initialDiagnosis}}}

---

**2. Source Documents (High Importance for Factual Data):**
{{#each sourceDocuments}}
*   **Source ID (for citation):** D{{@index}}
*   **Document Title:** "{{title}}" (Analyzed: {{date}})
*   **Analysis:**
    {{{analysis}}}
---
{{/each}}

**3. Source Conversations (Primary Source of Narrative and Details):**
{{#each sourceConversations}}
*   **Source ID (for citation):** C{{@index}}
*   **Conversation Title:** "{{title}}" (Summarized: {{date}})
*   **Full Conversation Transcript (Review carefully for details):**
    {{#each fullConversation}}
        {{role}}: {{{content}}}
    {{/each}}
---
{{/each}}

**4. Diary Entries (For Wellness Trends, Symptoms, and Daily Feelings):**
{{#each diaryData}}
*   **Source Date (for citation):** Diary - {{date}}
*   **Content:** Mood: {{mood}}, Pain: {{painScore}}, Worried About: "{{worriedAbout}}", Positive About: "{{positiveAbout}}", Notes: "{{notes}}"
---
{{/each}}

**5. Medication List (For Current Prescriptions):**
{{#each medicationData}}
*   **Medication:** {{name}} {{strength}}, Dose: {{dose}}
---
{{/each}}

**6. User's Timeline (For Milestones):**
*   Use the timeline data to understand planned and completed steps.
---

**7. Pre-Formatted Potential Benefits (MUST USE THIS TEXT EXACTLY):**
{{{potentialBenefitsText}}}
---

**NOW, POPULATE THE REPORT TEMPLATE BELOW:**

### **Personal Summary Report**
> **Disclaimer:** This report is a summary of the information you have provided. It is for personal reference only and should not be considered a medical document. Always consult with your healthcare provider for official information and advice.

### **Personal Details**
*   **Name:** {{{userName}}}
*   **Age:** {{{age}}}
*   **Gender:** {{{gender}}}
*   **Primary Health Condition:** {{{initialDiagnosis}}}
*   **Location:** {{{locationInfo.city}}} (Postcode: {{{postcode}}})
*   **Local Health Authority:** {{{locationInfo.nhs_ha}}}
*   **NHS Number:** [Extract from sources, e.g., 123 456 7890] [C1]
*   **Hospital Number:** [Extract from sources] [D0]

### **Medical Team & Contacts**
*(This section should be a bulleted list of any and all medical contacts found in the data sources. Extract any mentioned doctors, specialist teams (e.g., "urology cancer team"), nurses, or hospitals, along with their contact details. If none are mentioned, state "No information provided yet.")*
*   [Example: Urology Cancer Team at Wrexham Maelor Hospital - Phone: 03000857868] [C0]
*   [Example: Dr. Smith, Consultant Oncologist] [D1]

### **Diagnosis & Condition Summary**
*(Synthesize the key medical details from ALL data sources into a concise summary. Start with the user's self-reported primary diagnosis and then add details from documents and conversations. Include cancer type, stage, dates, and key test results. Cite your sources for each key finding using a reference marker like [D0] or [C1].)*

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
(This section is now populated from the pre-formatted string. You MUST Insert the exact text from potentialBenefitsText here.)
{{{potentialBenefitsText}}}

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
