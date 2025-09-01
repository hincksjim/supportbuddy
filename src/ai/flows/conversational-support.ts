
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
import { lookupPostcode } from '@/services/postcode-lookup';
import { TextNoteSchema, MeetingNoteSchema } from './types';


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
  specialist: z.enum(['medical', 'mental_health', 'financial']).describe("The specialist the user is addressing."),
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
  responseMood: z.string().optional().describe("The desired conversational tone for the AI (e.g. 'standard', or a custom persona ID)."),
  customPersona: z.string().optional().describe("A user-defined persona for the AI to adopt if responseMood is a custom one."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    metadata: z.object({ specialist: z.enum(['medical', 'mental_health', 'financial']) }).optional(),
  })).describe("The history of the conversation so far."),
  question: z.string().describe('The user question about their condition or treatment options.'),
  
  // New context fields
  sourceDocuments: z.array(SourceDocumentSchema).optional().describe('An array of previously analyzed documents.'),
  diaryData: z.array(DiaryEntrySchema).optional().describe('An array of the user\'s diary entries.'),
  medicationData: z.array(MedicationSchema).optional().describe('An array of the user\'s prescribed medications.'),
  textNotes: z.array(TextNoteSchema.omit({ type: true })).optional().describe('An array of general text notes saved by the user.'),
  meetingNotes: z.array(MeetingNoteSchema.omit({ type: true })).optional().describe('An array of meeting notes saved by the user.'),
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

// Extend the input schema for the prompt to include boolean flags
const EnrichedAiConversationalSupportInputSchema = AiConversationalSupportInputSchema.extend({
    isMedical: z.boolean().optional(),
    isMentalHealth: z.boolean().optional(),
    isFinancial: z.boolean().optional(),
});
type EnrichedAiConversationalSupportInput = z.infer<typeof EnrichedAiConversationalSupportInputSchema>;


export async function aiConversationalSupport(input: AiConversationalSupportInput): Promise<AiConversationalSupportOutput> {
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

  // Create the enriched input with boolean flags for the prompt
  const enrichedInput: EnrichedAiConversationalSupportInput = {
    ...input,
    isMedical: input.specialist === 'medical',
    isMentalHealth: input.specialist === 'mental_health',
    isFinancial: input.specialist === 'financial',
  };
  
  return aiConversationalSupportFlow(enrichedInput);
}

const prompt = ai.definePrompt({
  name: 'aiConversationalSupportPrompt',
  input: {schema: EnrichedAiConversationalSupportInputSchema},
  output: {schema: AiConversationalSupportOutputSchema},
  tools: [lookupPostcode],
  system: "You are a helpful AI assistant. Your final output MUST be a valid JSON object matching the provided schema, with your response contained within the 'answer' field.",
  prompt: `
{{#if customPersona}}
You are a helpful AI assistant. You MUST adopt the following persona for your response: "{{{customPersona}}}"
{{else}}
{{#if isMedical}}
You are Dr. Aris, a caring, professional, and very supportive AI health companion acting as a **Medical Expert**. Your role is to be a direct, factual, and helpful assistant. You are here to support all elements of their care, including their physical well-being. Be empathetic, but prioritize providing clear, actionable medical information. Your tone should be reassuring but grounded in evidence.
{{/if}}

{{#if isMentalHealth}}
You are Sarah, a caring, friendly, and very supportive AI health companion acting as a **Mental Health Nurse**. Your role is to be an empathetic and listening assistant, supporting the user's emotional and mental well-being throughout their health journey. You are warm, gentle, and incredibly patient.
{{/if}}

{{#if isFinancial}}
You are David, an expert **Financial Support Specialist**. Your role is to provide clear, factual, and actionable information to help a user manage their finances during a period of illness. You are knowledgeable, practical, and direct. You are NOT a registered financial advisor and must not give financial advice.
{{/if}}
{{/if}}


**CORE INSTRUCTIONS (MUST FOLLOW):**
1.  **Prioritize Tool Use for Location Questions:** If the user asks about local services, hospitals, clinics, or their health board, you **MUST** use the 'lookupPostcode' tool. Use the postcode from their profile: **{{{postcode}}}**. Do not claim you cannot access this information. Provide the information from the tool directly.
2.  **Synthesize All Data:** Before answering, you **MUST** review all context provided below. Use this information to provide a truly personalized and informed response.
3.  **Explain Simply & Define Terms:** All explanations should be clear and easy to understand. If you must use a medical term, define it simply.
4.  **Refer to Teammates (if not a custom persona):** If the conversation touches on topics outside your expertise, gently guide the user to talk to your teammates. A medical expert should refer financial/emotional questions to the others, and vice versa.

---
**SHARED CONTEXT - User's Full Profile & Data:**
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

**Meeting Notes (Key Source of Recent Decisions/Actions):**
{{#each meetingNotes}}
- Meeting: "{{subject}}" ({{date}}) with {{attendees}}. Notes: {{{notes}}}. Actions: {{#each actions}}'{{description}}' (Due: {{dueDate}}){{#unless @last}}, {{/unless}}{{/each}}
{{else}}
- No meeting notes saved yet.
{{/each}}

**General Text Notes:**
{{#each textNotes}}
- Note Title: "{{title}}" ({{date}}): {{{content}}}
{{else}}
- No text notes saved yet.
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

**Conversation History (with specialist noted):**
{{#each conversationHistory}}
  {{role}} ({{#if metadata.specialist}}{{metadata.specialist}}{{else}}user{{/if}}): {{{content}}}
{{/each}}

**Current User Question:** {{{question}}}

Please provide a detailed, supportive, and easy-to-understand answer based on your specialist role and all the context and principles above.
`,
});

const aiConversationalSupportFlow = ai.defineFlow(
  {
    name: 'aiConversationalSupportFlow',
    inputSchema: EnrichedAiConversationalSupportInputSchema,
    outputSchema: AiConversationalSupportOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
          throw new Error("The AI model returned an empty response.");
      }
      return output;
    } catch(e) {
       console.error("Error in aiConversationalSupportFlow:", e);
       // Return a user-friendly error message in the expected format.
       return {
           answer: "I'm sorry, I had trouble processing that request. Could you try rephrasing your question? If the problem continues, there might be a temporary issue with the AI service."
       };
    }
  }
);
