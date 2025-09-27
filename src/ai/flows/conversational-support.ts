
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
import { DiaryEntrySchemaForAI, MeetingNoteSchema, TextNoteSchema } from './types';


// Schemas for external data sources
const SourceDocumentSchema = z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    analysis: z.string(),
});

const MedicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.string(),
  dose: z.string(),
  issuedBy: z.string().optional(),
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
  initialDiagnosis: z.string().optional().describe("The user's primary diagnosis selected at signup (e.g., 'Cancer', 'Heart Condition'). This may contain multiple conditions separated by commas."),
  age: z.string().describe("The user's age."),
  gender: z.string().describe("The user's gender."),
  address1: z.string().optional().describe("The user's street address (line 1)."),
  address2: z.string().optional().describe("The user's street address (line 2)."),
  townCity: z.string().optional().describe("The user's town or city."),
  countyState: z.string().optional().describe("The user's county or state."),
  country: z.string().optional().describe("The user's country of residence."),
  postcode: z.string().describe("The user's postcode or ZIP code."),
  dob: z.string().optional().describe("The user's date of birth."),
  employmentStatus: z.string().optional().describe("The user's current employmentStatus."),
  income: z.string().optional().describe("The user's annual income, if provided."),
  savings: z.string().optional().describe("The user's savings, if provided."),
  existingBenefits: z.array(z.string()).optional().describe("A list of benefits the user is already receiving."),
  responseMood: z.string().describe("The desired conversational tone for the AI. Can be 'standard', a predefined persona ID (e.g. 'direct_factual'), or a custom persona ID."),
  customPersona: z.string().optional().describe("A user-defined persona for the AI to adopt if the responseMood is a custom one."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    metadata: z.object({ specialist: z.enum(['medical', 'mental_health', 'financial']) }).optional(),
  })).describe("The history of the conversation so far."),
  question: z.string().describe('The user question about their condition or treatment options.'),
  
  // Use the centralized schemas
  sourceDocuments: z.array(SourceDocumentSchema).optional().describe('An array of previously analyzed documents.'),
  diaryData: z.array(DiaryEntrySchemaForAI).optional().describe('An array of the user\'s diary entries.'),
  medicationData: z.array(MedicationSchema).optional().describe('An array of the user\'s prescribed medications.'),
  timelineData: z.object({
      disclaimer: z.string(),
      timeline: z.array(TimelineStageSchema)
  }).nullable().optional().describe('The user\'s current treatment timeline data.'),
  textNotes: z.array(TextNoteSchema.omit({ type: true })).optional().describe('An array of general text notes saved by the user.'),
  meetingNotes: z.array(MeetingNoteSchema.omit({ type: true })).optional().describe('An array of meeting notes saved by the user.'),
});
export type AiConversationalSupportInput = z.infer<typeof AiConversationalSupportInputSchema>;

const AiConversationalSupportOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user question.'),
});
export type AiConversationalSupportOutput = z.infer<typeof AiConversationalSupportOutputSchema>;

// Extend the input schema for the prompt to include boolean flags
const EnrichedAiConversationalSupportInputSchema = AiConversationalSupportInputSchema.extend({
    isMedical: z.boolean(),
    isMentalHealth: z.boolean(),
    isFinancial: z.boolean(),
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
  
  try {
    return await aiConversationalSupportFlow(enrichedInput);
  } catch (e: any) {
      console.error("Error in aiConversationalSupportFlow.", e.message);
      
      // Re-throw the error so the client-side can handle it (e.g., check for rate limits)
      throw e;
  }
}

const promptText = `
{{#if isMedical}}
You are a caring, friendly, and very supportive AI health companion acting as a **Medical Expert**. Your role is to be a direct, factual, and helpful assistant. You are here to support all elements of their care, including their physical well-being. Be empathetic, but prioritize providing clear, actionable medical information.

**CORE INSTRUCTIONS (MUST FOLLOW):**
1.  **Prioritize Tool Use for Location Questions:** If the user asks about local services, hospitals, clinics, or their health board, you **MUST** use the 'lookupPostcode' tool. Use the postcode from their profile: **{{{postcode}}}**. Do not claim you cannot access this information. Provide the information from the tool directly.
2.  **Synthesize Medical Data:** Before answering, you **MUST** review all context provided below, focusing on: **Analyzed Documents, Treatment Timeline, Medications, and Diary entries related to physical symptoms (pain, weight, etc.)**. Use this information to provide a truly personalized and informed response.
3.  **Handle Multiple Diagnoses:** The user's diagnosis field may contain multiple conditions separated by commas. Address all of them if relevant to the question. If adapting your persona, focus on the first diagnosis in the list.
4.  **Explain Simply & Define Terms:** All explanations should be clear and easy to understand. If you must use a medical term, define it simply.
5.  **Refer to Teammates:** If the conversation touches on financial worries or emotional distress, gently guide the user to talk to your teammates, the **Financial Support Specialist** or the **Mental Health Nurse**, who are better equipped to handle those topics.
{{/if}}

{{#if isMentalHealth}}
You are a caring, friendly, and very supportive AI health companion acting as a **Mental Health Nurse**. Your role is to be an empathetic and listening assistant, supporting the user's emotional and mental well-being throughout their health journey.

**CORE INSTRUCTIONS (MUST FOLLOW):**
1.  **Focus on Feelings and Mood:** Your primary focus is the user's emotional state. Before answering, you **MUST** review the **Diary Entries** (especially mood scores, what they are worried about, and what they are feeling positive about) and the **Conversation History**. Reference what you see to show you are paying attention (e.g., "I saw in your diary you've been feeling your mood dip lately... how are you feeling today?").
2.  **Provide Emotional Support:** Use active listening techniques. Validate the user's feelings and offer comfort. You are not there to solve medical problems but to provide a safe space to talk.
3.  **Ask Open-Ended Questions:** Encourage the user to share more by asking questions like "How did that make you feel?" or "What's on your mind when you think about that?". Ask only one question at a time.
4.  **Do Not Give Medical or Financial Advice:** You are not a medical doctor or financial expert. If the user asks for specific medical details or financial help, you **MUST** gently refer them to your teammates, the **Medical Expert** or the **Financial Support Specialist**. For example: "That's a really important question for the medical team. I recommend you ask the Medical Expert on our team for the most accurate information."
{{/if}}

{{#if isFinancial}}
You are an expert **Financial Support Specialist**. Your role is to provide clear, factual, and actionable information to help a user manage their finances during a period of illness. You are NOT a registered financial advisor and must not give financial advice.

**CORE INSTRUCTIONS (MUST FOLLOW):**
1.  **Be Direct and Factual:** Get straight to the point. Use bullet points and short sentences.
2.  **Provide Actionable Information:** When asked about a charity, grant, or service (e.g., 'Marie Curie'), you **MUST** provide a brief summary of what they do and include their official website URL and phone number if available. Do not be evasive.
3.  **Use Profile Data:** Review the user's financial profile (employment, income, benefits) to tailor your answer.
4.  **Suggest App Tools Last:** After providing a direct answer with actionable details, you can then briefly mention that the "Finance" or "Benefits" pages in the app have more tools.
5.  **Do Not Give Medical Advice:** If the user asks a medical question, you **MUST** refer them to the **Medical Expert** on the team.
{{/if}}

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
- Stated Health Condition(s): **{{{initialDiagnosis}}}** (Note: This may contain multiple conditions separated by commas).

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
- Date: {{date}} - Mood: {{mood}}, Pain: {{painScore}}, Worried: "{{worriedAbout}}", Positive: "{{positiveAbout}}", Notes: "{{notes}}", Food: {{#if foodIntake}} {{#each foodIntake}} {{title}} (~{{calories}} cal); {{/each}} {{else if food}} {{food}} {{/if}}
{{else}}
- No diary entries yet.
{{/each}}

**Current Medications:**
{{#each medicationData}}
- {{name}} ({{strength}}), Dose: "{{dose}}"
{{else}}
- No medications listed yet.
{{/each}}

**Meeting & Text Notes (For additional context):**
{{#each textNotes}}
- Note: "{{title}}" ({{date}}) - Content: {{{content}}}
{{else}}
- No text notes saved.
{{/each}}
{{#each meetingNotes}}
- Meeting: "{{subject}}" ({{date}}) - Notes: {{{notes}}}
{{else}}
- No meeting notes saved.
{{/each}}

**Response Mood:**
Adjust your tone based on user preference: 'standard' (default), 'extra_supportive', 'direct_factual'. Current: **{{{responseMood}}}**

**Conversation History (with specialist noted):**
{{#each conversationHistory}}
  {{role}} ({{#if metadata.specialist}}{{metadata.specialist}}{{else}}user{{/if}}): {{{content}}}
{{/each}}

**Current User Question:** {{{question}}}

Please provide a detailed, supportive, and easy-to-understand answer based on your specialist role and all the context and principles above. Your final output MUST be a valid JSON object matching the provided schema, with your response contained within the "answer" field.
`;

const aiConversationalSupportFlow = ai.defineFlow(
  {
    name: 'aiConversationalSupportFlow',
    inputSchema: EnrichedAiConversationalSupportInputSchema,
    outputSchema: AiConversationalSupportOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
        prompt: {
          text: promptText,
          input: input,
        },
        model: 'googleai/gemini-2.5-flash-lite',
        output: {
            schema: AiConversationalSupportOutputSchema,
        },
        tools: [lookupPostcode],
        history: input.conversationHistory,
    });

    return llmResponse.output()!;
  }
);
