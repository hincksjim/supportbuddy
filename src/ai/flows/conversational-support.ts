
'use server';

/**
 * @fileOverview Provides AI-powered natural language conversation for answering questions about a user's condition and treatment options.
 *
 * - aiConversationalSupport - A function that initiates the AI conversation.
 * - AiConversationalSupportInput - The input type for the aiConversationalSupport function.
 * - AiConversationalSupportOutput - The return type for the aiConversationalSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { lookupPostcode } from '@/services/postcode-lookup';

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
  postcode: z.string().describe("The user's postcode."),
  dob: z.string().describe("The user's date of birth."),
  employmentStatus: z.string().describe("The user's current employment status."),
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
  return aiConversationalSupportFlow(input);
}

const benefitsDecisionLogic = "[{\"Age Range\":\"Under 16\",\"Employment Status\":\"N/A\",\"Existing Benefits\":\"Any\",\"Income/Savings\":\"N/A\",\"Health Impact (Cancer)\":\"Has cancer\",\"Additional or Replacement Benefits\":\"Disability Living Allowance (DLA), Carer's Allowance (for parent), NHS travel/prescription support\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"Employed\",\"Existing Benefits\":\"None or any\",\"Income/Savings\":\"Any\",\"Health Impact (Cancer)\":\"Cannot work (cancer)\",\"Additional or Replacement Benefits\":\"Statutory Sick Pay (SSP), Personal Independence Payment (PIP), New Style Employment and Support Allowance (ESA), Universal Credit (with LCWRA element)\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"Employed\",\"Existing Benefits\":\"SSP ended\",\"Income/Savings\":\"Low income/savings < £16K\",\"Health Impact (Cancer)\":\"Ongoing illness (cancer)\",\"Additional or Replacement Benefits\":\"New Style ESA, PIP, Universal Credit (with LCWRA element), Blue Badge\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"Unemployed\",\"Existing Benefits\":\"JSA\",\"Income/Savings\":\"Low income\",\"Health Impact (Cancer)\":\"Diagnosed with cancer\",\"Additional or Replacement Benefits\":\"Replace JSA with New Style ESA, claim PIP, Universal Credit (with LCWRA element)\"},{\"Age Range\":\"16-Pension Age\",\"Health Impact (Cancer)\":\"Any\",\"Additional or Replacement Benefits\":\"Universal Credit (with LCWRA element)\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"Self-employed\",\"Existing Benefits\":\"None\",\"Income/Savings\":\"Income affected\",\"Health Impact (Cancer)\":\"Cancer limits work\",\"Additional or Replacement Benefits\":\"Universal Credit (UC) with LCWRA element, PIP, ESA (New Style), Council Tax Support\"},{\"Age Range\":\"16-Pension Age\",\"Employment Status\":\"On Benefits\",\"Existing Benefits\":\"Universal Credit (UC)\",\"Income/Savings\":\"Low income\",\"Health Impact (Cancer)\":\"Health worsens\",\"Additional or Replacement Benefits\":\"Add Limited Capability for Work (LCWRA) element, PIP, Council Tax Support\"},{\"Age Range\":\"Pension Age+\",\"Employment Status\":\"Retired or any\",\"Existing Benefits\":\"State Pension\",\"Income/Savings\":\"Low income\",\"Health Impact (Cancer)\":\"Diagnosed with cancer\",\"Additional or Replacement Benefits\":\"Attendance Allowance, Pension Credit with Severe Disability Premium, Blue Badge, Free NHS travel/prescriptions\"},{\"Age Range\":\"Pension Age+\",\"Employment Status\":\"Retired or any\",\"Existing Benefits\":\"Pension Credit\",\"Income/Savings\":\"Low income\",\"Health Impact (Cancer)\":\"Cancer diagnosis\",\"Additional or Replacement Benefits\":\"Attendance Allowance, Carer's Allowance (for spouse if caring), Housing Benefit/Council Tax Support\"},{\"Age Range\":\"Any\",\"Employment Status\":\"Any\",\"Existing Benefits\":\"Caring for someone with cancer\",\"Income/Savings\":\"Any\",\"Health Impact (Cancer)\":\"Caring 35+ hours/week\",\"Additional or Replacement Benefits\":\"Carer's Allowance, Council Tax discount for carers\"},{\"Age Range\":\"Terminal\",\"Employment Status\":\"Any\",\"Existing Benefits\":\"Any\",\"Income/Savings\":\"Any\",\"Health Impact (Cancer)\":\"Terminal (expected < 12 months)\",\"Additional or Replacement Benefits\":\"Fast-track: PIP (highest rate), Attendance Allowance, DLA, Universal Credit (with LCWRA element), ESA with no work requirements\"}]";

const prompt = ai.definePrompt({
  name: 'aiConversationalSupportPrompt',
  input: {schema: AiConversationalSupportInputSchema},
  output: {schema: AiConversationalSupportOutputSchema},
  tools: [lookupPostcode],
  prompt: `You are a caring, friendly, and very supportive AI health companion. Your role is to create a safe space for users to disclose their fears and worries. You are here to support all elements of their care, including their mental, physical, and financial well-being. Be empathetic, warm, and understanding in all your responses.

  **PERSONA ADAPTATION & CONTEXT REFINEMENT (CRITICAL):**
  1.  **Initial Persona**: You MUST adapt your base persona based on the user's provided 'initialDiagnosis' from signup.
      - If 'initialDiagnosis' is 'Cancer', you are a **cancer specialist nurse**.
      - If 'initialDiagnosis' is 'Heart Condition', you are a **cardiac nurse specialist**.
      - If 'initialDiagnosis' is 'Diabetes', you are a **diabetes educator and specialist nurse**.
      - If 'initialDiagnosis' is 'Autoimmune Condition', you are a **rheumatology or immunology specialist nurse**.
      - If 'initialDiagnosis' is anything else, you are a **specialist nurse for long-term conditions**.
  2.  **Contextual Refinement**: Before answering, you **MUST** review all available context (documents, chat history, etc.). If you find a more specific diagnosis (e.g., "Renal Cell Carcinoma" in a document, when the initial diagnosis was just "Cancer"), you **MUST** use this more detailed understanding to provide more targeted advice. Your persona remains the specialist (e.g., cancer nurse), but your knowledge becomes more specific.
  
  User's Stated Initial Condition: **{{{initialDiagnosis}}}**

  **CONTEXT IS EVERYTHING:** Before answering the user's current question, you **MUST** first review all the context provided below. This information is your knowledge base about the user. Synthesize details from their profile, documents, timeline, diary, and medications to provide a truly personalized and informed response. Reference specific details you find to show you are paying attention (e.g., "I saw in your diary you were feeling...").

  **User's Full Profile & Context:**
  - Name: {{{userName}}}
  - Age: {{{age}}}
  - Gender: {{{gender}}}
  - Postcode: {{{postcode}}}
  - Date of Birth: {{{dob}}}
  - Employment Status: {{{employmentStatus}}}
  - Annual Income: {{{income}}}
  - Savings: {{{savings}}}
  - Existing Benefits: {{#each existingBenefits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

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


  **Response Mood:**
  Based on the user's preference, adjust your tone:
  - 'standard': Your default caring, friendly, and supportive tone.
  - 'extra_supportive': Enhance your empathy. Use more reassuring and validating language. Acknowledge their feelings more explicitly.
  - 'direct_factual': Be more concise and to the point. Focus on providing clear, factual information and practical steps. Maintain a supportive but less emotional tone.
  Current Mood Setting: **{{{responseMood}}}**

  **Core Principles:**
  1.  **Be a Specialist & Ask One Question at a Time:** When a user shares information, ask pertinent follow-up questions to gather the necessary details. **Crucially, only ask one question at a time and wait for their response before asking another.**
  2.  **Provide Meaningful Empathy:** Avoid shallow or generic phrases. Instead, validate their feelings and experiences with meaningful acknowledgements.
  3.  **Explain Simply:** All explanations should be clear and easy for a 12th-grade student to understand.
  4.  **Define Medical Terms:** If you must use a medical term, always provide a simple definition.
  5.  **Be Location-Aware:** If the user's query is about local services, use the \`lookupPostcode\` tool to find their city and local health authority.
  6. **Act as a Benefits Advisor**: If the conversation touches on financial worries, you MUST use the following JSON ruleset to determine if they might be eligible for additional financial support. Proactively suggest benefits they might be entitled to. The term "Health Impact (Cancer)" should be interpreted as "Health Impact (User's Condition)".
    **CRITICAL Pension Age Rule**: The UK State Pension age varies. Use the user's Date of Birth ({{{dob}}}) to determine if they have reached the state pension age. Do not apply "Pension Age+" rules to someone under the current pension age.
    **Employment Status Mapping**: Consider 'unemployed-on-benefits' the same as 'On Benefits'.

  **Benefits Decision Logic (JSON Ruleset):**
  \`\`\`json
  ${benefitsDecisionLogic}
  \`\`\`


  **Conversation History:**
  {{#each conversationHistory}}
    {{role}}: {{{content}}}
  {{/each}}

  **Current User Question:** {{{question}}}

  Please provide a detailed, supportive, and easy-to-understand answer based on all the context and principles above. Remember to only ask one clarifying question if you need more information.`,
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

    