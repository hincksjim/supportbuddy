
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
import { SourceConversation, SourceDocument, TextNoteSchema, MeetingNoteSchema } from './types';


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

const MedicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.string(),
  dose: z.string(),
  issuedBy: z.string(),
  issuedDate: z.string(),
});

const DiaryEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  mood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable(),
  diagnosisMood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable(),
  treatmentMood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable(),
  painScore: z.number().nullable(),
  painLocation: z.string().nullable().optional(),
  painRemarks: z.string().optional(),
  symptomAnalysis: z.string().optional(),
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


const GeneratePersonalSummaryInputSchema = z.object({
    userName: z.string().describe("The user's first name."),
    initialDiagnosis: z.string().optional().describe("The user's primary diagnosis selected at signup."),
    age: z.string().describe("The user's age."),
    gender: z.string().describe("The user's gender."),
    postcode: z.string().describe("The user's postcode."),
    address1: z.string().optional().describe("The user's street address (line 1)."),
    address2: z.string().optional().describe("The user's street address (line 2)."),
    townCity: z.string().optional().describe("The user's town or city."),
    countyState: z.string().optional().describe("The user's county or state."),
    country: z.string().optional().describe("The user's country."),
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
    textNotes: z.array(TextNoteSchema.omit({ type: true })).optional().describe('An array of general text notes saved by the user.'),
    meetingNotes: z.array(MeetingNoteSchema.omit({ type: true })).optional().describe('An array of meeting notes saved by the user.'),
    diaryData: z.array(DiaryEntrySchema).describe('An array of the user\'s diary entries.'),
    medicationData: z.array(MedicationSchema).describe('An array of the user\'s prescribed medications.'),
    locationInfo: z.object({
        city: z.string(),
        nhs_ha: z.string(),
    }).describe("The pre-fetched location information based on the user's postcode."),
    potentialBenefitsText: z.string().describe("A pre-formatted, Markdown-ready string listing potential benefits."),
});
export type GeneratePersonalSummaryInput = z.infer<
  typeof GeneratePersonalSummaryInputSchema
>;

const GeneratePersonalSummaryOutputSchema = z.object({
  report: z.string().describe('A comprehensive summary report formatted in Markdown.'),
  updatedDiagnosis: z.string().describe("The latest, most specific diagnosis found in the source documents or conversations."),
});
export type GeneratePersonalSummaryOutput = z.infer<
  typeof GeneratePersonalSummaryOutputSchema
>;

const EnrichedGeneratePersonalSummaryInputSchema = GeneratePersonalSummaryInputSchema.extend({
    currentDate: z.string().describe("The current date in 'Weekday, Day Month Year' format. For calculating dates from relative terms like 'tomorrow'."),
});


export async function generatePersonalSummary(
  input: GeneratePersonalSummaryInput
): Promise<GeneratePersonalSummaryOutput> {

  const currentDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const sortedDiaryData = [...input.diaryData].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const extendedInput = { 
    ...input, 
    diaryData: sortedDiaryData,
    currentDate,
  };
  
  return generatePersonalSummaryFlow(extendedInput);
}


const prompt = ai.definePrompt({
  name: 'generatePersonalSummaryPrompt',
  input: {schema: EnrichedGeneratePersonalSummaryInputSchema},
  output: {schema: GeneratePersonalSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with creating a comprehensive "Personal Summary Report" for a user navigating their health journey.

**TASK:**
Your primary goal is to synthesize ALL information provided into a clear, organized, factual Markdown report and to identify the user's most current diagnosis. The report must contain all sections as specified in the template.

**CRITICAL INSTRUCTIONS:**
1.  **IDENTIFY THE LATEST DIAGNOSIS (Most Important Task):**
    *   Review all provided source documents and conversations chronologically.
    *   Identify the most specific and recent diagnosis mentioned. For example, if the user's initial diagnosis is "Cancer (All Types)" but a recent document [D1] specifies "Renal Cell Carcinoma, 7cm", then "Renal Cell Carcinoma, 7cm" is the latest diagnosis.
    *   You **MUST** populate the \`updatedDiagnosis\` field in the output JSON with this single, most specific diagnosis string.

2.  **GENERATE DIARY SUMMARIES (Second Most Important Task):**
    *   Review the user's \`diaryData\`.
    *   You **MUST** generate insightful weekly or monthly summaries for the "Wellness & Diary Insights" section.
    *   Group entries by month. For the most recent month, generate weekly summaries. For all previous months, generate a single monthly summary.
    *   Each summary should be 2-3 paragraphs, identifying trends in mood, pain, and key themes from their worries and positive notes. Use an observational tone ("It seems like...", "The entries suggest...").
    *   You MUST format these summaries inside Markdown blockquotes. Example: \`> **Summary for Week of Aug 05:** This week's entries suggest... \`

3.  **USE ALL PROVIDED DATA:** You MUST use the user's personal details and all available data sources (Documents, Conversations, Meeting Notes, Diary, Medications, Timeline, Financials) to build the report. The saved conversation transcripts are a primary source of truth for the user's narrative.
4.  **CITE YOUR SOURCES:** When you extract a specific piece of information (like a doctor's name, a test result, a date, or a feeling), you **MUST** cite where you found it using a reference marker, like **[D0]** for the first document, **[C1]** for the second conversation, or **[M2]** for the third meeting note. The letter indicates the type (D for Document, C for Conversation, N for Note, M for Meeting) and the number is the index from the source list.
5.  **FORMAT WITH MARKDOWN:** The entire report output must be a single Markdown string. Use headings, bold text, bullet points, and blockquotes as defined in the template. The section headings must be exactly as written in the template (e.g., \`### Financial Summary\`).
6.  **BE FACTUAL AND OBJECTIVE:** Extract and present information as it is given. Do not invent details or make medical predictions.
7.  **INFER DATES CAREFULLY:** The current date is **{{{currentDate}}}**. When a user mentions a relative date like "tomorrow," you MUST calculate the specific date. If a timeframe is ambiguous (e.g., "in two weeks"), state it exactly as provided.
8.  **PRIVACY DISCLAIMER:** Start the report with the exact disclaimer provided in the template.
9.  **EXTRACT CONTACTS & NUMBERS:** Scour all available data sources for any mention of doctor names, nurse names, hospital names, contact details, **NHS Numbers**, and **Hospital Numbers**. Synthesize this into the appropriate sections. When you find a phone number, you **MUST** format it in bold text (e.g., **01234 567890**).
10. **CREATE A NUMBERED SOURCE LIST:** At the end of the report, create a section called "### Sources". List all the source documents, conversations, and notes you were provided, using the title, date, and ID for each, along with their citation marker. You MUST format these as Markdown links where appropriate.
11. **INJECT BENEFITS TEXT:** The "Potential Additional Benefits" section MUST be populated *only* by inserting the exact pre-formatted text provided in the \`potentialBenefitsText\` input field.
12. **FORMAT ADDRESS CORRECTLY**: When creating the address line, you MUST only include fields that have a value. Join them with a comma and a space, but do not add a comma if a field is missing or for the last item in the address.
13. **USE UPDATED DIAGNOSIS IN REPORT**: In the "Primary Health Condition" field of the report, you MUST use the value you determined for \`updatedDiagnosis\`.

---
**FIRST, REVIEW ALL AVAILABLE INFORMATION SOURCES TO USE:**

**1. Initial Diagnosis (from user profile):**
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

**4. Meeting Notes (For recent decisions and actions):**
{{#each meetingNotes}}
*   **Source ID (for citation):** M{{@index}}
*   **Meeting Subject:** "{{subject}}" ({{date}})
*   **Attendees:** {{attendees}}
*   **Notes:**
    {{{notes}}}
*   **Actions:**
    {{#each actions}}
    - {{description}} (Due: {{dueDate}}, Assigned to: {{assignedTo}})
    {{/each}}
---
{{/each}}


**5. General Text Notes (For additional context):**
{{#each textNotes}}
*   **Source ID (for citation):** N{{@index}}
*   **Note Title:** "{{title}}" ({{date}})
*   **Content:**
    {{{content}}}
---
{{/each}}

**6. Diary Entries (For Wellness Summaries and Daily Log):**
{{#each diaryData}}
- **Date:** {{date}} - Mood: {{mood}}, Pain: {{painScore}}, Worried: "{{worriedAbout}}", Positive: "{{positiveAbout}}", Notes: "{{notes}}"
{{/each}}
---

**7. Other Data Sources:**
*   Medication Lists and Timelines are available for context.
---

**NOW, POPULATE THE REPORT TEMPLATE BELOW:**

### **Personal Summary for {{{userName}}} on {{{currentDate}}}**
> **Disclaimer:** This report is a summary of the information you have provided. It is for personal reference only and should not be considered a medical document. Always consult with your healthcare provider for official information and advice.

### **Personal Details**
*   **Name:** {{{userName}}}
*   **Age:** {{{age}}}
*   **Gender:** {{{gender}}}
*   **Address:** {{#if address1}}{{{address1}}}{{/if}}{{#if address2}}, {{{address2}}}{{/if}}{{#if townCity}}, {{{townCity}}}{{/if}}{{#if countyState}}, {{{countyState}}}{{/if}}{{#if postcode}}, {{{postcode}}}{{/if}}{{#if country}}, {{{country}}}{{/if}}
*   **Primary Health Condition:** {{{updatedDiagnosis}}}
*   **Local Health Authority:** {{{locationInfo.nhs_ha}}}
*   **NHS Number:** [Extract from sources, e.g., 123 456 7890] [C1]
*   **Hospital Number:** [Extract from sources] [D0]

### **Medical Team & Contacts**
*(This section should be a bulleted list of any and all medical contacts found in the data sources. Extract any mentioned doctors, specialist teams, nurses, or hospitals, along with their contact details. Remember to bold any phone numbers. If none are mentioned, state "No information provided yet.")*

### **Diagnosis & Condition Summary**
*(Synthesize the key medical details from ALL data sources into a concise summary. Start with the user's most specific diagnosis and then add details from documents and conversations. Include cancer type, stage, dates, and key test results. Cite your sources for each key finding using a reference marker like [D0] or [C1].)*

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
*(This section should contain the AI-generated diary summaries first, followed by the detailed daily log. Generate the summaries based on the provided diaryData as per the instructions at the start of this prompt.)*

**AI-Generated Summaries:**
*(Here is where you will generate the weekly/monthly summaries in blockquotes based on the diary data)*

---

**Daily Log (Most Recent First):**
{{#if diaryData}}
{{#each diaryData}}
*   **{{date}}**: Mood: {{mood}}; Pain: {{painScore}}/10{{#if painLocation}} in the **{{painLocation}}** (Remarks: *{{painRemarks}}*){{/if}}; Worried about: "{{worriedAbout}}"; Positive about: "{{positiveAbout}}".
{{#if symptomAnalysis}}
> **AI Analysis:** {{symptomAnalysis}}
{{/if}}
{{/each}}
{{else}}
*   (No diary entries provided)
{{/if}}

### **Timeline & Milestones**
**Completed Milestones:**
*(Review ALL data sources to identify completed events. List them here with dates if available and cite the source.)*
*   [Example: Initial Diagnosis Confirmed (Renal Cell Carcinoma)] [D0]

**Next Expected Milestone(s):**
*(Based on all available information, identify the next logical step. Use the current date ({{{currentDate}}}) to calculate specific dates where possible. Cite the source.)*
*   [Example: Surgical Procedure at Wrexham Maelor Hospital on Friday, 9 August 2024] [C3]

### **Financial Summary**
*   **Employment Status:** {{{employmentStatus}}}
*   **Annual Income:** {{{income}}}
*   **Savings:** {{{savings}}}
*   **Existing Benefits:** {{#if existingBenefits}}{{#each existingBenefits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None listed{{/if}}

### **Potential Additional Benefits**
{{{potentialBenefitsText}}}

---
### **Sources**
*(List all the source documents and conversations as a numbered list with their citation marker.)*
{{#each sourceDocuments as |doc|}}
*   [D{{@index}}] Document: [**{{doc.title}}**](/document-analysis?id={{doc.id}}) (Analyzed: {{doc.date}})
{{/each}}
{{#each sourceConversations as |convo|}}
*   [C{{@index}}] Conversation: [**{{convo.title}}**](/support-chat?id={{convo.id}}) (Summarized: {{convo.date}})
{{/each}}
{{#each meetingNotes as |note|}}
*   [M{{@index}}] Meeting Note: **{{note.subject}}** ({{note.date}}, ID: {{note.id}})
{{/each}}
{{#each textNotes as |note|}}
*   [N{{@index}}] Note: **{{note.title}}** ({{note.date}}, ID: {{note.id}})
{{/each}}
`,
});


const generatePersonalSummaryFlow = ai.defineFlow(
  {
    name: 'generatePersonalSummaryFlow',
    inputSchema: EnrichedGeneratePersonalSummaryInputSchema,
    outputSchema: GeneratePersonalSummaryOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('The AI model returned an empty response.');
      }
      
      const diagnosisToUse = output.updatedDiagnosis || input.initialDiagnosis || 'Not specified';

      const finalReport = output.report.replace(
          /{{{updatedDiagnosis}}}/g,
          diagnosisToUse
      );
      
      return {
          report: finalReport,
          updatedDiagnosis: diagnosisToUse,
      };

    } catch (e: any) {
      console.error("Error in generatePersonalSummaryFlow:", e);
      throw new Error("Failed to generate personal summary. The AI model may have returned an unexpected response. Please try again.");
    }
  }
);
