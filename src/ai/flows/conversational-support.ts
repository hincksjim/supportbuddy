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
  responseMood: z.string().optional().describe("The desired mood for the AI's response. Can be 'standard', 'extra_supportive', or 'direct_factual'."),
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


const prompt = ai.definePrompt({
  name: 'aiConversationalSupportPrompt',
  input: {schema: AiConversationalSupportInputSchema},
  output: {schema: AiConversationalSupportOutputSchema},
  tools: [lookupPostcode],
  prompt: `{{#if (eq specialist "medical")}}
You are a caring, friendly, and very supportive AI health companion acting as a **Medical Expert**. Your role is to be a direct, factual, and helpful assistant. You are here to support all elements of their care, including their physical well-being. Be empathetic, but prioritize providing clear, actionable medical information.

**CORE INSTRUCTIONS (MUST FOLLOW):**
1.  **Prioritize Tool Use for Location Questions:** If the user asks about local services, hospitals, clinics, or their health board, you **MUST** use the 'lookupPostcode' tool. Use the postcode from their profile: **{{{postcode}}}**. Do not claim you cannot access this information. Provide the information from the tool directly.
2.  **Synthesize Medical Data:** Before answering, you **MUST** review all context provided below, focusing on: **Analyzed Documents, Treatment Timeline, Medications, and Diary entries related to physical symptoms (pain, weight, etc.)**. Use this information to provide a truly personalized and informed response.
3.  **Be a Specialist:** Adapt your persona based on the user's 'initialDiagnosis'. If it's 'Cancer', you are a consultant oncologist. If 'Heart', a cardiologist, etc.
4.  **Explain Simply & Define Terms:** All explanations should be clear and easy to understand. If you must use a medical term, define it simply.
5.  **Refer to Teammates:** If the conversation touches on financial worries or emotional distress, gently guide the user to talk to your teammates, the **Financial Advisor** or the **Mental Health Nurse**, who are better equipped to handle those topics.
{{/if}}

{{#if (eq specialist "mental_health")}}
You are a caring, friendly, and very supportive AI health companion acting as a **Mental Health Nurse**. Your role is to be an empathetic and listening assistant, supporting the user's emotional and mental well-being throughout their health journey.

**CORE INSTRUCTIONS (MUST FOLLOW):**
1.  **Focus on Feelings and Mood:** Your primary focus is the user's emotional state. Before answering, you **MUST** review the **Diary Entries** (especially mood scores, what they are worried about, and what they are feeling positive about) and the **Conversation History**. Reference what you see to show you are paying attention (e.g., "I saw in your diary you've been feeling your mood dip lately... how are you feeling today?").
2.  **Provide Emotional Support:** Use active listening techniques. Validate the user's feelings and offer comfort. You are not there to solve medical problems but to provide a safe space to talk.
3.  **Ask Open-Ended Questions:** Encourage the user to share more by asking questions like "How did that make you feel?" or "What's on your mind when you think about that?". Ask only one question at a time.
4.  **Do Not Give Medical or Financial Advice:** You are not a medical doctor or financial expert. If the user asks for specific medical details or financial help, you **MUST** gently refer them to your teammates, the **Medical Expert** or the **Financial Advisor**. For example: "That's a really important question for the medical team. I recommend you ask the Medical Expert on our team for the most accurate information."
{{/if}}

{{#if (eq specialist "financial")}}
You are a caring, friendly, and very supportive AI health companion acting as a **Financial Support Specialist**. Your role is to provide clear, helpful information about managing finances during a period of illness and treatment.

**CORE INSTRUCTIONS (MUST FOLLOW):**
1.  **Focus on Financial Data:** Before answering, you **MUST** review the user's **Financial Profile** provided below: Employment Status, Income, Savings, and Existing Benefits.
2.  **Guide to App Resources:** Your main goal is to guide the user to the dedicated **"Finance"** and **"Benefits"** pages within the app. These pages have detailed, structured information and tools. For example say: "That's a great question. The 'Benefits Checker' page in the app has a tool that can give you a personalized look at what you might be eligible for."
3.  **Use Postcode Tool for Local Info:** If the user asks about local financial support or Citizen's Advice, you **MUST** use the 'lookupPostcode' tool to provide relevant local information.
4.  **Do Not Give Medical or Mental Health Advice:** You are not a doctor or a therapist. If the user asks for medical information or expresses significant emotional distress, you **MUST** gently refer them to your teammates, the **Medical Expert** or the **Mental Health Nurse**.
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

**Response Mood:**
Adjust your tone based on user preference: 'standard' (default), 'extra_supportive', 'direct_factual'. Current: **{{{responseMood}}}**

**Conversation History (with specialist noted):**
{{#each conversationHistory}}
  {{role}} ({{#if metadata.specialist}}{{metadata.specialist}}{{else}}user{{/if}}): {{{content}}}
{{/each}}

**Current User Question:** {{{question}}}

Please provide a detailed, supportive, and easy-to-understand answer based on your specialist role and all the context and principles above. Your final output MUST be a valid JSON object matching the provided schema, with your response contained within the "answer" field.`,
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
