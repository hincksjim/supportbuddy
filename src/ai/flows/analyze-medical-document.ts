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
  prompt: `You are an AI assistant specializing in analyzing medical documents.

  You will be provided with a medical document and a question about the document.
  Your task is to answer the question based on the information in the document.

  Document: {{media url=documentDataUri}}
  Question: {{{question}}}

  Answer: `,
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
