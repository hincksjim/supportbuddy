
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
  description: z.string().describe("A brief description of the food identified in the photo."),
  calories: z.number().describe("The estimated calorie count for the meal."),
  ingredients: z.array(z.string()).describe("A list of identified ingredients in the meal."),
});
export type AnalyzeFoodPhotoOutput = z.infer<typeof AnalyzeFoodPhotoOutputSchema>;

export async function analyzeFoodPhoto(
  input: AnalyzeFoodPhotoInput
): Promise<AnalyzeFoodPhotoOutput> {
  return analyzeFoodPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFoodPhotoPrompt',
  input: {schema: AnalyzeFoodPhotoInputSchema},
  output: {schema: AnalyzeFoodPhotoOutputSchema},
  prompt: `You are an expert nutritionist. Your task is to analyze an image of a meal, identify the food items, and provide an estimated calorie count for the entire meal.

**TASK:**
1.  **Identify the food:** Look at the image and identify all the components of the meal.
2.  **Describe the meal:** Provide a brief, one-sentence description of the identified meal.
3.  **Estimate Calories:** Based on the portion size and food items, estimate the total calories. Return this as a number.
4.  **List Ingredients:** Identify the primary ingredients of the meal and return them as a list of strings.

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
