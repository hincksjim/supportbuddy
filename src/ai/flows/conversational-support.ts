
'use server';

/**
 * @fileOverview Provides AI-powered natural language conversation for answering questions about a user's condition and treatment options.
 *
 * - aiConversationalSupport - A function that initiates the AI conversation.
 * - AiConversationalSupportInput - The input type for the aiConversationalSupport function.
 * - AiConversationalSupportOutput - The return type for the aiConversationalSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { lookupLocation } from '@/services/location-lookup';
import { findLocalHospitals } from '@/services/hospital-lookup';


// Schemas for external data sources
const SourceDocumentSchema = z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    analysis: z.string(),
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


const AiConversationalSupportInputSchema = z.object({
  userName: z.string().describe("The user's first name."),
  initialDiagnosis: z.string().optional().describe("The user's primary diagnosis selected at signup (e.g., 'Cancer', 'Heart Condition')."),
  age: z.string().describe("The user's age."),
  gender: z.string().describe("The user's gender."),
  address1: z.string().describe("The user's street address (line 1)."),
  address2: z.string().optional().describe("The user's street address (line 2)."),
  townCity: z.string().describe("The user's town or city."),
  countyState: z.string().describe("The user's county or state."),
  country: z.string().describe("The user's country of residence."),
  postcode: z.string().describe("The user's postcode or ZIP code."),
  dob: z.string().describe("The user's date of birth."),
  employmentStatus: z.string().describe("The user's current employmentStatus."),
  income: z.string().optional().describe("The user's annual income, if provided."),
  savings: z.string().optional().describe("The user's savings, if provided."),
  existingBenefits: z.array(z.string()).optional().describe("A list of benefits the user is already receiving."),
  responseMood: z.string().optional().describe("The desired mood for the AI's response. Can be 'standard', 'extra_supportive', or 'direct_factual'."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
  question: z.string().describe('The user question about their condition or treatment options.'),
  
  // New context fields
  sourceDocuments: z.array(SourceDocumentSchema).optional().describe('An array of previously analyzed documents.'),
  diaryData: z.array(DiaryEntrySchema).optional().describe('An array of the user\'s diary entries.'),
  medicationData: z.array(MedicationSchema).optional().describe('An array of the user\'s prescribed medications.'),
  timelineData: z.object({
      disclaimer: z.string(),
      timeline: z.array(TimelineStageSchema)
  }).nullable().optional().describe('The user\'s current treatment timeline data.'),
});
export type AiConversationalSupportInput = z.infer<typeof AiConversationalSupportInputSchema>;

const AiConversationalSupportOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user question.'),
});
export type AiConversationalSupportOutput = z.infer<typeof AiConversationalSupportOutputSchema>;

export async function aiConversationalSupport(input: AiConversationalSupportInput): Promise<AiConversationalSupportOutput> {
  // If the user is asking a location-based question but hasn't provided a postcode in their question,
  // we can look back in the conversation history to find one to use with our tools.
  const locationQuestion = /local|nearby|close to me|hospital|clinic|doctor|pharmacy/i.test(input.question);
  const postcodeInQuestion = /\b([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})\b/i.test(input.question);

  if (locationQuestion && !postcodeInQuestion && !input.postcode) {
    for (let i = input.conversationHistory.length - 1; i >= 0; i--) {
      const msg = input.conversationHistory[i].content;
      const match = msg.match(/\b([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})\b/i);
      if (match) {
        input.postcode = match[0];
        break;
      }
    }
  }
  
  return aiConversationalSupportFlow(input);
}

const benefitsDecisionLogic = "[{\"Age Range\":\"Under 16\",\"Employment Status\":\"N/A\",\"Existing Benefits\":\"Any\",\"Income/Savings\":\"N/A\",\"Health Impact (Cancer)\":\"Has cancer\",\"Additional or Replacement Benefits\":\"Disability Living Allowance (DLA), Carer's Allowance (for parent), NHS travel/prescription support\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"Employed\",\"Existing Benefits\":\"None or any\",\"Income/Savings\":\"Any\",\"Health Impact (Cancer)\":\"Cannot work (cancer)\",\"Additional or Replacement Benefits\":\"Statutory Sick Pay (SSP), Personal Independence Payment (PIP), New Style Employment and Support Allowance (ESA), Universal Credit (with LCWRA element)\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"Employed\",\"Existing Benefits\":\"SSP ended\",\"Income/Savings\":\"Low income/savings < £16K\",\"Health Impact (Cancer)\":\"Ongoing illness (cancer)\",\"Additional or Replacement Benefits\":\"New Style ESA, PIP, Universal Credit (with LCWRA element), Blue Badge\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"Unemployed\",\"Existing Benefits\":\"JSA\",\"Income/Savings\":\"Low income\",\"Health Impact (Cancer)\":\"Diagnosed with cancer\",\"Additional or Replacement Benefits\":\"Replace JSA with New Style ESA, claim PIP, Universal Credit (with LCWRA element)\"},{\"Age Range\":\"16-Pension Age\",\"Health Impact (Cancer)\":\"Any\",\"Additional or Replacement Benefits\":\"Universal Credit (with LCWRA element)\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"Self-employed\",\"Existing Benefits\":\"None\",\"Income/Savings\":\"Income affected\",\"Health Impact (Cancer)\":\"Cancer limits work\",\"Additional or Replacement Benefits\":\"Universal Credit (UC) with LCWRA element, PIP, ESA (New Style), Council Tax Support\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"On Benefits\",\"Existing Benefits\":\"Universal Credit (UC)\",\"Income/Savings\":\"Low income\",\"Health Impact (Cancer)\":\"Health worsens\",\"Additional or Replacement Benefits\":\"Add Limited Capability for Work (LCWRA) element, PIP, Council Tax Support\"},{\"Age Range\":\"Pension Age+\",\"Employment Status\":\"Retired or any\",\"Existing Benefits\":\"State Pension\",\"Income/Savings\":\"Low income\",\"Health Impact (Cancer)\":\"Diagnosed with cancer\",\"Additional or Replacement Benefits\":\"Attendance Allowance, Pension Credit with Severe Disability Premium, Blue Badge, Free NHS travel/prescriptions\"},{\"Age Range\":\"Pension Age+\",\"Employment Status\":\"Retired or any\",\"Existing Benefits\":\"Pension Credit\",\"Income/Savings\":\"Low income\",\"Health Impact (Cancer)\":\"Cancer diagnosis\",\"Additional or Replacement Benefits\":\"Attendance Allowance, Carer's Allowance (for spouse if caring), Housing Benefit/Council Tax Support\"},{\"Age Range\":\"Any\",\"Employment Status\":\"Any\",\"Existing Benefits\":\"Caring for someone with cancer\",\"Income/Savings\":\"Any\",\"Health Impact (Cancer)\":\"Caring 35+ hours/week\",\"Additional or Replacement Benefits\":\"Carer's Allowance, Council Tax discount for carers\"},{\"Age Range\":\"Terminal\",\"Employment Status\":\"Any\",\"Existing Benefits\":\"Any\",\"Income/Savings\":\"Any\",\"Health Impact (Cancer)\":\"Terminal (expected < 12 months)\",\"Additional or Replacement Benefits\":\"Fast-track: PIP (highest rate), Attendance Allowance, DLA, Universal Credit (with LCWRA element), ESA with no work requirements\"}]";

const prompt = ai.definePrompt({
  name: 'aiConversationalSupportPrompt',
  input: {schema: AiConversationalSupportInputSchema},
  output: {schema: AiConversationalSupportOutputSchema},
  tools: [lookupLocation, findLocalHospitals],
  prompt: `You are a caring, friendly, and very supportive AI health companion. Your role is to be a direct, factual, and helpful assistant. You are here to support all elements of their care, including their mental, physical, and financial well-being. Be empathetic, but prioritize providing clear, actionable information.

  **CORE INSTRUCTIONS (MUST FOLLOW):**
  1.  **Prioritize Tool Use for Location Questions:** If the user asks about local services, hospitals, clinics, or their health board, you **MUST** use the 'findLocalHospitals' or 'lookupLocation' tools. Use the postcode from their profile: **{{{postcode}}}**. Do not claim you cannot access this information. Provide the information from the tool directly.
  2.  **Synthesize All Provided Data:** Before answering, you **MUST** review all context provided below: Profile, Documents, Timeline, Diary, and Medications. Use this information to provide a truly personalized and informed response. Reference specific details you find to show you are paying attention (e.g., "I saw in your diary you were feeling...").
  3.  **Be a Specialist & Ask One Question at a Time:** Adapt your persona based on the user's 'initialDiagnosis'. If it's 'Cancer', you are a consultant oncologist. If 'Heart', a cardiologist, etc. When you need more information, ask only one clarifying question and wait for the response.
  4.  **Explain Simply & Define Terms:** All explanations should be clear and easy to understand. If you must use a medical term, define it simply.
  5.  **Act as a Benefits Advisor**: If the conversation touches on financial worries, you MUST use the provided JSON ruleset to determine if they might be eligible for additional financial support. The term "Health Impact (Cancer)" should be interpreted as "Health Impact (User's Condition)". Use the user's Date of Birth ({{{dob}}}) to determine if they have reached the state pension age.

  **CONTEXT IS EVERYTHING - User's Full Profile & Data:**
  - Name: {{{userName}}}
  - Age: {{{age}}}
  - Gender: {{{gender}}}
  - Full Address: {{{address1}}}{{#if address2}}, {{{address2}}}{{/if}}, {{{townCity}}}, {{{countyState}}}, {{{postcode}}}, {{{country}}}
  - Date of Birth: {{{dob}}}
  - Employment Status: {{{employmentStatus}}}
  - Annual Income: {{{income}}}
  - Savings: {{{savings}}}
  - Existing Benefits: {{#if existingBenefits}}{{#each existingBenefits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
  - Stated Initial Condition: **{{{initialDiagnosis}}}**

  **Analyzed Documents (Key Source of Medical Facts):**
  {{#each sourceDocuments}}
  - Document Title: "{{title}}" - Analysis: {{{analysis}}}
  {{else}}
  - No documents analyzed yet.
  {{/each}}

  **Treatment Timeline (For Understanding the Journey):**
  {{#if timelineData.timeline}}
    {{#each timelineData.timeline}}
    - Stage: {{title}}
      {{#each steps}}
      - Step: {{title}} (Status: {{status}}) - Notes: {{{notes}}}
      {{/each}}
    {{/each}}
  {{else}}
  - No timeline created yet.
  {{/if}}

  **Diary Entries (For Recent Feelings and Symptoms):**
  {{#each diaryData}}
  - Date: {{date}} - Mood: {{mood}}, Pain: {{painScore}}, Worried: "{{worriedAbout}}", Positive: "{{positiveAbout}}", Notes: "{{notes}}"
  {{else}}
  - No diary entries yet.
  {{/each}}

  **Current Medications:**
  {{#each medicationData}}
  - {{name}} ({{strength}}), Dose: "{{dose}}"
  {{else}}
  - No medications listed yet.
  {{/each}}

  **Benefits Decision Logic (JSON Ruleset):**
  \`\`\`json
  ${benefitsDecisionLogic}
  \`\`\`
  
  **Response Mood:**
  Adjust your tone based on user preference: 'standard' (default), 'extra_supportive', or 'direct_factual'. Current: **{{{responseMood}}}**

  **Conversation History:**
  {{#each conversationHistory}}
    {{role}}: {{{content}}}
  {{/each}}

  **Current User Question:** {{{question}}}

  Please provide a detailed, supportive, and easy-to-understand answer based on all the context and principles above.`,
});

const aiConversationalSupportFlow = ai.defineFlow(
  {
    name: 'aiConversationalSupportFlow',
    inputSchema: AiConversationalSupportInputSchema,
    outputSchema: AiConversationalSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
