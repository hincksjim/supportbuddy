
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
import { SourceConversation, SourceDocument, TextNoteSchema, MeetingNoteSchema, PersonalSummaryOutputSchema, DiaryEntrySchemaForAI } from './types';
import type { PersonalSummaryOutput } from './types';


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
  issuedBy: z.string().optional(),
  issuedDate: z.string(),
});

const SectionsToGenerateSchema = z.object({
    personalDetails: z.boolean().optional(),
    medicalTeam: z.boolean().optional(),
    diagnosisSummary: z.boolean().optional(),
    currentMedications: z.boolean().optional(),
    wellnessInsights: z.boolean().optional(),
    timelineMilestones: z.boolean().optional(),
    financialSummary: z.boolean().optional(),
    potentialBenefits: z.boolean().optional(),
    sources: z.boolean().optional(),
}).describe("An object where keys are the report sections to be generated and values are true.");


const GeneratePersonalSummaryInputSchema = z.object({
    sectionsToGenerate: SectionsToGenerateSchema,
    userName: z.string().describe("The user's first name."),
    initialDiagnosis: z.string().optional().describe("The user's primary diagnosis selected at signup. This may contain multiple conditions separated by commas."),
    age: z.string().describe("The user's age."),
    gender: z.string().describe("The user's gender."),
    postcode: z.string().describe("The user's postcode."),
    address1: z.string().optional().describe("The user's street address (line 1)."),
    address2: z.string().optional().describe("The user's street address (line 2)."),
    townCity: z.string().optional().describe("The user's town or city."),
    countyState: z.string().optional().describe("The user's county or state."),
    country: z.string().optional().describe("The user's country."),
    employmentStatus: z.string().optional().describe("The user's current employment status."),
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
    diaryData: z.array(DiaryEntrySchemaForAI).describe('An array of the user\'s diary entries.'),
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


const EnrichedGeneratePersonalSummaryInputSchema = GeneratePersonalSummaryInputSchema.extend({
    currentDate: z.string().describe("The current date in 'Weekday, Day Month Year' format. For calculating dates from relative terms like 'tomorrow'."),
});


export async function generatePersonalSummary(
  input: GeneratePersonalSummaryInput
): Promise<PersonalSummaryOutput> {

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
  output: {schema: PersonalSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with creating sections of a comprehensive "Personal Summary Report" for a user navigating their health journey.

**TASK:**
Your primary goal is to synthesize ALL information provided into clear, organized, factual Markdown and to identify the user's most current diagnosis. You will only generate the sections specified in the 'sectionsToGenerate' object.

**CRITICAL INSTRUCTIONS:**
1.  **IDENTIFY THE LATEST DIAGNOSIS (Most Important Task):**
    *   Review all provided source documents and conversations chronologically.
    *   The user's initial diagnosis may contain a comma-separated list. Your job is to find the most up-to-date and specific diagnosis from the provided documents. For example, if the initial diagnosis is "Cancer (All Types), Hypertension" but a recent document [D1] specifies "Renal Cell Carcinoma, 7cm", then "Renal Cell Carcinoma, 7cm" is the latest primary diagnosis.
    *   You **MUST** populate the \`updatedDiagnosis\` field in the output JSON with this single, most specific diagnosis string.

2.  **USE ALL PROVIDED DATA:** You MUST use the user's personal details and all available data sources (Documents, Conversations, Meeting Notes, Diary, Medications, Timeline, Financials) to build the report. The saved conversation transcripts are a primary source of truth for the user's narrative.
3.  **CITE YOUR SOURCES:** When you extract a specific piece of information (like a doctor's name, a test result, a date, or a feeling), you **MUST** cite where you found it using a reference marker, like **[D0]** for the first document or **[C1]** for the second conversation. The letter indicates the type (D for Document, C for Conversation, N for Note, M for Meeting) and the number is the index from the source list.
4.  **FORMAT WITH MARKDOWN:** Each generated section must be a single Markdown string. Use headings, bold text, bullet points, and blockquotes as defined in the template.
5.  **BE FACTUAL AND OBJECTIVE:** Extract and present information as it is given. Do not invent details or make medical predictions.
6.  **INFER DATES CAREFULLY:** The current date is **{{{currentDate}}}**. When a user mentions a relative date like "tomorrow," you MUST calculate the specific date. If a timeframe is ambiguous (e.g., "in two weeks"), state it exactly as provided.
7.  **EXTRACT CONTACTS & NUMBERS:** Scour all available data sources for any mention of doctor names, nurse names, hospital names, contact details, **NHS Numbers**, and **Hospital Numbers**. Synthesize this into the appropriate sections. When you find a phone number, you **MUST** format it in bold text (e.g., **01234 567890**).

---
**CONTEXT DATA (Review all available information sources):**

*   **User Profile:**
    - Name: {{{userName}}}, Age: {{{age}}}, Gender: {{{gender}}}
    - Address: {{#if address1}}{{{address1}}}{{/if}}{{#if address2}}, {{{address2}}}{{/if}}{{#if townCity}}, {{{townCity}}}{{/if}}{{#if countyState}}, {{{countyState}}}{{/if}}{{#if postcode}}, {{{postcode}}}{{/if}}{{#if country}}, {{{country}}}{{/if}}
    - Initial Diagnosis/Conditions: {{{initialDiagnosis}}} (Note: This may be a comma-separated list. Look for a more specific diagnosis in the documents below).
    - Financials: Employment: {{{employmentStatus}}}, Income: {{{income}}}, Savings: {{{savings}}}, Benefits: {{#if existingBenefits}}{{#each existingBenefits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None listed{{/if}}
*   **Location Info:** Local Health Authority: {{{locationInfo.nhs_ha}}}
*   **Source Documents:**
    {{#each sourceDocuments}}
    - **[D{{@index}}] {{title}} ({{date}}):** {{{analysis}}}
    {{else}}
    - No documents.
    {{/each}}
*   **Source Conversations:**
    {{#each sourceConversations}}
    - **[C{{@index}}] {{title}} ({{date}}):** {{{summary}}}
    - Full Transcript: {{{fullConversation}}}
    {{else}}
    - No conversations.
    {{/each}}
*   **Meeting Notes:**
    {{#each meetingNotes}}
    - **[M{{@index}}] {{subject}} ({{date}}):** {{{notes}}}
    {{else}}
    - No meeting notes.
    {{/each}}
*   **Text Notes:**
    {{#each textNotes}}
    - **[N{{@index}}] {{title}} ({{date}}):** {{{content}}}
    {{else}}
    - No text notes.
    {{/each}}
*   **Medications:**
    {{#each medicationData}}
    - {{name}} ({{strength}}), {{dose}}
    {{/each}}
*   **Diary Entries (sorted recent first):**
    {{#each diaryData}}
    - **{{date}}:** Mood:{{mood}}, Pain:{{painScore}}, Worried:{{worriedAbout}}, Positive:{{positiveAbout}}, Food: {{#if foodIntake}} {{#each foodIntake}} {{title}} (~{{calories}} cal); {{/each}} {{else if food}} {{food}} {{/if}}
    {{/each}}
*   **Timeline:** Available in context.
---

**NOW, GENERATE THE CONTENT FOR THE REQUESTED SECTIONS:**

{{#if sectionsToGenerate.personalDetails}}
    **Personal Details Section:**
    *   **Name:** {{{userName}}}
    *   **Age:** {{{age}}}
    *   **Gender:** {{{gender}}}
    *   **Address:** {{#if address1}}{{{address1}}}{{/if}}{{#if address2}}, {{{address2}}}{{/if}}{{#if townCity}}, {{{townCity}}}{{/if}}{{#if countyState}}, {{{countyState}}}{{/if}}{{#if postcode}}, {{{postcode}}}{{/if}}{{#if country}}, {{{country}}}{{/if}}
    *   **Primary Health Condition:** [You MUST use the value you determined for \`updatedDiagnosis\` here]
    *   **Local Health Authority:** {{{locationInfo.nhs_ha}}}
    *   **NHS Number:** [Extract from sources, e.g., 123 456 7890] [C1]
    *   **Hospital Number:** [Extract from sources] [D0]
{{/if}}

{{#if sectionsToGenerate.medicalTeam}}
    **Medical Team Section:**
    *(This section should be a bulleted list of any and all medical contacts found in the data sources. Extract any mentioned doctors, specialist teams, nurses, or hospitals, along with their contact details. Remember to bold any phone numbers. If none are mentioned, state "No information provided yet.")*
{{/if}}

{{#if sectionsToGenerate.diagnosisSummary}}
    **Diagnosis Summary Section:**
    *(Synthesize the key medical details from ALL data sources into a concise summary. Start with the user's most specific diagnosis and then add details from documents and conversations. Include cancer type, stage, dates, and key test results. Cite your sources for each key finding using a reference marker like [D0] or [C1].)*
{{/if}}

{{#if sectionsToGenerate.currentMedications}}
    **Current Medications Section:**
    *(List all medications from the 'medicationData' source. If none, state "No medications listed.")*
    {{#if medicationData}}
    {{#each medicationData}}
    *   **{{name}} ({{strength}}):** {{dose}} - *Prescribed by {{issuedBy}} on {{issuedDate}}*
    {{/each}}
    {{else}}
    *   No medications listed.
    {{/if}}
{{/if}}

{{#if sectionsToGenerate.wellnessInsights}}
    **Wellness Insights Section:**
    *(This section should contain AI-generated diary summaries first, followed by the detailed daily log. Generate the summaries based on the provided diaryData.)*
    **AI-Generated Summaries:**
    *(Generate weekly/monthly summaries in blockquotes based on the diary data)*
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
{{/if}}

{{#if sectionsToGenerate.timelineMilestones}}
    **Timeline & Milestones Section:**
    **Completed Milestones:**
    *(Review ALL data sources to identify completed events. List them here with dates if available and cite the source.)*
    *   [Example: Initial Diagnosis Confirmed (Renal Cell Carcinoma)] [D0]
    **Next Expected Milestone(s):**
    *(Based on all available information, identify the next logical step. Use the current date ({{{currentDate}}}) to calculate specific dates where possible. Cite the source.)*
    *   [Example: Surgical Procedure at Wrexham Maelor Hospital on Friday, 9 August 2024] [C3]
{{/if}}

{{#if sectionsToGenerate.financialSummary}}
    **Financial Summary Section:**
    *   **Employment Status:** {{{employmentStatus}}}
    *   **Annual Income:** {{{income}}}
    *   **Savings:** {{{savings}}}
    *   **Existing Benefits:** {{#if existingBenefits}}{{#each existingBenefits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None listed{{/if}}
{{/if}}

{{#if sectionsToGenerate.potentialBenefits}}
    **Potential Benefits Section:**
    {{{potentialBenefitsText}}}
{{/if}}

{{#if sectionsToGenerate.sources}}
    **Sources Section:**
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
{{/if}}
`,
});


const generatePersonalSummaryFlow = ai.defineFlow(
  {
    name: 'generatePersonalSummaryFlow',
    inputSchema: EnrichedGeneratePersonalSummaryInputSchema,
    outputSchema: PersonalSummaryOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('The AI model returned an empty response.');
      }
      
      const diagnosisToUse = output.updatedDiagnosis || input.initialDiagnosis || 'Not specified';
      
      // Replace the placeholder in the personal details section if it was generated
      if (output.personalDetails) {
          output.personalDetails = output.personalDetails.replace(
              /\[You MUST use the value you determined for `updatedDiagnosis` here\]/g,
              diagnosisToUse
          );
      }
      
      return {
          ...output,
          updatedDiagnosis: diagnosisToUse,
      };

    } catch (e: any) {
      console.error("Error in generatePersonalSummaryFlow:", e);
      throw new Error("Failed to generate personal summary. The AI model may have returned an unexpected response. Please try again.");
    }
  }
);


