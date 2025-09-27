
'use server';

/**
 * @fileOverview An AI agent to analyze a photo of a medication box.
 *
 * - analyzeMedicationPhoto - A function that handles the medication photo analysis.
 * - AnalyzeMedicationPhotoInput - The input type for the function.
 * - AnalyzeMedicationPhotoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMedicationPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a medication box, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeMedicationPhotoInput = z.infer<typeof AnalyzeMedicationPhotoInputSchema>;

const AnalyzeMedicationPhotoOutputSchema = z.object({
  name: z.string().describe("The brand or generic name of the medication identified in the photo."),
  strength: z.string().describe("The strength of the medication (e.g., '50mg', '10ml')."),
  dose: z.string().describe("The dosage instructions found on the box (e.g., 'Take one tablet twice daily')."),
});
export type AnalyzeMedicationPhotoOutput = z.infer<typeof AnalyzeMedicationPhotoOutputSchema>;

export async function analyzeMedicationPhoto(
  input: AnalyzeMedicationPhotoInput
): Promise<AnalyzeMedicationPhotoOutput> {
  return analyzeMedicationPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMedicationPhotoPrompt',
  input: {schema: AnalyzeMedicationPhotoInputSchema},
  output: {schema: AnalyzeMedicationPhotoOutputSchema},
  model: 'googleai/gemini-2.5-flash-lite',
  prompt: `You are an expert at reading and interpreting medication packaging from images.

**TASK:**
Analyze the provided image of a medication box or label. You MUST extract the following three pieces of information:

1.  **Medication Name:** Identify the primary name of the medication. This could be a brand name or a generic name.
2.  **Strength:** Identify the strength of the medication. This is usually a number followed by units like 'mg', 'ml', 'mcg', etc.
3.  **Dosage:** Identify the dosage instructions. This is usually text like "Take one tablet twice daily" or "Apply a thin layer to the affected area."

If any of these pieces of information cannot be clearly identified, return an empty string for that field.

**IMAGE:**
{{media url=photoDataUri}}
`,
});

const analyzeMedicationPhotoFlow = ai.defineFlow(
  {
    name: 'analyzeMedicationPhotoFlow',
    inputSchema: AnalyzeMedicationPhotoInputSchema,
    outputSchema: AnalyzeMedicationPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
