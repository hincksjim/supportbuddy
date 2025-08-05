'use server';

/**
 * @fileOverview An AI agent to analyze medical documents and answer questions about them.
 *
 * - analyzeMedicalDocument - A function that handles the medical document analysis process.
 * - AnalyzeMedicalDocumentInput - The input type for the analyzeMedicalDocument function.
 * - AnalyzeMedicalDocumentOutput - The return type for the analyzeMedicalDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMedicalDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A medical document (image or PDF), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question to ask about the document.'),
});
export type AnalyzeMedicalDocumentInput = z.infer<typeof AnalyzeMedicalDocumentInputSchema>;

const AnalyzeMedicalDocumentOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the document.'),
});
export type AnalyzeMedicalDocumentOutput = z.infer<typeof AnalyzeMedicalDocumentOutputSchema>;

export async function analyzeMedicalDocument(
  input: AnalyzeMedicalDocumentInput
): Promise<AnalyzeMedicalDocumentOutput> {
  return analyzeMedicalDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMedicalDocumentPrompt',
  input: {schema: AnalyzeMedicalDocumentInputSchema},
  output: {schema: AnalyzeMedicalDocumentOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing medical documents for patients. Your primary goal is to explain complex medical information in a way that is clear, simple, and easy for a 12th-grade student to understand.

  **Core Principles:**
  1.  **Simplify, Don't Dumb Down:** Break down complex terms and concepts without losing the essential meaning. Use analogies if helpful.
  2.  **Well-Structured Layout:** Present the information in a highly readable format. Use headings, bullet points, or short, focused paragraphs to organize the key findings.
  3.  **Define Medical Terms:** If you must use a medical term, provide a simple definition immediately. For example: "...leukocyte count, which is a measure of your white blood cells that help fight infection."
  4.  **Focus on Key Takeaways:** Start with the most important information. Structure your answer to highlight the most significant findings and what they mean for the patient.
  5.  **Empathetic and Cautious Tone:** Your tone should be supportive and reassuring. Always include a disclaimer that this is not a substitute for professional medical advice and the user should consult their doctor for any medical decisions.

  **Task:**
  You will be provided with a medical document (image or PDF) and a question. Answer the user's question based *only* on the information present in the document, following the principles above.

  Document: {{media url=documentDataUri}}
  Question: {{{question}}}

  Answer:`,
});

const analyzeMedicalDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeMedicalDocumentFlow',
    inputSchema: AnalyzeMedicalDocumentInputSchema,
    outputSchema: AnalyzeMedicalDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
