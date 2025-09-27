
'use server';

/**
 * @fileOverview An AI agent to analyze a photo of a meal and estimate calories.
 *
 * - analyzeFoodPhoto - A function that handles the food photo analysis.
 * - AnalyzeFoodPhotoInput - The input type for the function.
 * - AnalyzeFoodPhotoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFoodPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeFoodPhotoInput = z.infer<typeof AnalyzeFoodPhotoInputSchema>;


const AnalyzeFoodPhotoOutputSchema = z.object({
  description: z.string().describe("A brief, one-sentence description of the identified meal."),
  calories: z.number().describe("An estimated calorie count for the meal."),
  ingredients: z.array(z.string()).describe("A list of the main ingredients identified in the meal."),
});
export type AnalyzeFoodPhotoOutput = zinfer<typeof AnalyzeFoodPhotoOutputSchema>;


export async function analyzeFoodPhoto(
  input: AnalyzeFoodPhotoInput
): Promise<AnalyzeFoodPhotoOutput> {
  return analyzeFoodPhotoFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeFoodPhotoPrompt',
  input: {schema: AnalyzeFoodPhotoInputSchema},
  output: {schema: AnalyzeFoodPhotoOutputSchema},
  prompt: `You are an expert nutritionist AI with an amazing ability to identify food from images.

**TASK:**
Analyze the provided image of a meal. You MUST perform the following actions and return them as a valid JSON object:

1.  **Identify the Meal:** Write a brief, one-sentence description of the meal.
2.  **Estimate Calories:** Provide a realistic calorie estimate for the portion shown.
3.  **List Ingredients:** Identify and list the main ingredients in the meal.

**IMAGE:**
{{media url=photoDataUri}}
`,
});


const analyzeFoodPhotoFlow = ai.defineFlow(
  {
    name: 'analyzeFoodPhotoFlow',
    inputSchema: AnalyzeFoodPhotoInputSchema,
    outputSchema: AnalyzeFoodPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
