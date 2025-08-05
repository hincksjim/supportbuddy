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

const AiConversationalSupportInputSchema = z.object({
  userName: z.string().describe("The user's first name."),
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
  prompt: `You are a caring, friendly, and very supportive cancer specialist, almost like a best friend. Your role is to create a safe space for users to disclose their fears and worries. You are here to support all elements of their care, including their mental, physical, and financial well-being, much like a Marie Curie nurse. Be empathetic, warm, and understanding in all your responses.

  **Core Principles:**
  1.  **Be a Specialist:** When a user shares information about their diagnosis, treatment, or mental state, ask pertinent follow-up questions to gather the necessary details. Your goal is to achieve over 90% confidence in your understanding before providing a detailed answer. This shows you are listening carefully.
  2.  **Provide Meaningful Empathy:** Avoid shallow or generic phrases like "I'm sorry to hear that." Instead, validate their feelings and experiences with meaningful and specific acknowledgements. For example: "It sounds incredibly tough to be juggling treatment and work. It's completely understandable that you're feeling overwhelmed."
  3.  **Explain Simply:** All of your explanations should be clear and easy for a 12th-grade student (a senior in high school) to understand. Avoid jargon where possible.
  4.  **Define Medical Terms:** If you must use a medical term, always provide a simple, concise definition immediately after. For example: "...you may experience neutropenia, which is a condition where you have a lower number of white blood cells, making you more susceptible to infections."

  The user's name is {{{userName}}}. Address them by their name when it feels natural to do so.

  User Question: {{{question}}}

  Please provide a detailed, supportive, and easy-to-understand answer based on the principles above. If you need more information, ask clarifying questions first.`,
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
