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
  prompt: `You are an expert medical AI assistant. Your purpose is to analyze a medical document and present the information in a highly structured, clear, and easy-to-understand format for a 12th-grade student.

**Output Formatting Rules (MUST FOLLOW):**
1.  **Key Takeaways Index:** Begin with a section titled "**Key Takeaways**". This section must be a bulleted list that serves as an index, outlining the main sections of your analysis (e.g., "Blood Cell Counts," "Liver Function," "Doctor's Notes").
2.  **Section-Based Breakdown:** Structure the entire analysis using clear, descriptive headings for each section (e.g., "**Haemoglobin Levels**," "**Cholesterol Panel**," "**Radiologist's Findings**").
3.  **Simple Language:** Explain everything using simple, everyday language. Avoid medical jargon.
4.  **Define Terms:** If a medical term is unavoidable, you must bold it and provide a simple definition immediately in parentheses. For example: "**Leukocytes** (a type of white blood cell that helps fight infection) were within the normal range."
5.  **Use Formatting:** Use bullet points, short paragraphs, and bold text to highlight the most important values, findings, and conclusions.
6.  **Cite Page Numbers**: If the document has multiple pages, you **must cite the page number** in parentheses when you reference a specific finding. For example: "The patient's temperature was recorded as 37.2°C (see Page 3)."
7.  **Disclaimer:** Always conclude with the following disclaimer: "--- \n**Disclaimer:** This is an AI-generated summary and not a substitute for professional medical advice. Please consult with your doctor to discuss your results and any health concerns."

**Task:**
Analyze the provided document based on the user's question and generate a response that strictly adheres to the formatting rules above.

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
