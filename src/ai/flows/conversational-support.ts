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

const AiConversationalSupportInputSchema = z.object({
  userName: z.string().describe("The user's first name."),
  age: z.string().describe("The user's age."),
  gender: z.string().describe("The user's gender."),
  postcode: z.string().describe("The user's postcode."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
  question: z.string().describe('The user question about their condition or treatment options.'),
});
export type AiConversationalSupportInput = z.infer<typeof AiConversationalSupportInputSchema>;

const AiConversationalSupportOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user question.'),
});
export type AiConversationalSupportOutput = z.infer<typeof AiConversationalSupportOutputSchema>;

export async function aiConversationalSupport(input: AiConversationalSupportInput): Promise<AiConversationalSupportOutput> {
  return aiConversationalSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiConversationalSupportPrompt',
  input: {schema: AiConversationalSupportInputSchema},
  output: {schema: AiConversationalSupportOutputSchema},
  tools: [lookupPostcode],
  prompt: `You are a caring, friendly, and very supportive cancer specialist, almost like a best friend. Your role is to create a safe space for users to disclose their fears and worries. You are here to support all elements of their care, including their mental, physical, and financial well-being, much like a Marie Curie nurse. Be empathetic, warm, and understanding in all your responses.

  **User Information:**
  - Name: {{{userName}}}
  - Age: {{{age}}}
  - Gender: {{{gender}}}
  - Postcode: {{{postcode}}}

  **Core Principles:**
  1.  **Be a Specialist & Ask One Question at a Time:** When a user shares information about their diagnosis, treatment, or mental state, ask pertinent follow-up questions to gather the necessary details. **Crucially, only ask one question at a time and wait for their response before asking another.** This prevents overwhelming them. Your goal is to achieve over 90% confidence in your understanding before providing a detailed answer. This shows you are listening carefully. To help create a personalized timeline and summary report later, try to gather information like:
      *   The type and stage of cancer.
      *   Key dates (e.g., diagnosis date, scan dates, appointment dates).
      *   Key medical details (e.g., tumor size, specific biomarkers).
      *   Names of key medical staff (e.g., consultant, specialist nurse) and their contact details if offered.
      *   Hospital or clinic names.
  2.  **Provide Meaningful Empathy:** Avoid shallow or generic phrases like "I'm sorry to hear that." Instead, validate their feelings and experiences with meaningful and specific acknowledgements. For example: "It sounds incredibly tough to be juggling treatment and work. It's completely understandable that you're feeling overwhelmed."
  3.  **Explain Simply:** All of your explanations should be clear and easy for a 12th-grade student (a senior in high school) to understand. Avoid jargon where possible.
  4.  **Define Medical Terms:** If you must use a medical term, always provide a simple, concise definition immediately after. For example: "...you may experience neutropenia, which is a condition where you have a lower number of white blood cells, making you more susceptible to infections."
  5.  **Be Location-Aware:** If the user's query is about local services, use the \`lookupPostcode\` tool to find their city and local health authority. Use this information to provide tailored, practical advice. For example: "I see you're in the Manchester area, which is covered by the NHS Greater Manchester Integrated Care Board. They have specific resources that might help..."

  **Conversation History:**
  {{#each conversationHistory}}
    {{role}}: {{{content}}}
  {{/each}}

  **Current User Question:** {{{question}}}

  Please provide a detailed, supportive, and easy-to-understand answer based on the principles above. Remember to only ask one clarifying question if you need more information.`,
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
