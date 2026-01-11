'use server';

/**
 * @fileOverview An AI agent to analyze a text description of a meal.
 *
 * - analyzeFoodDescription - A function that handles the food description analysis.
 * - AnalyzeFoodDescriptionInput - The input type for the function.
 * - AnalyzeFoodDescriptionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFoodDescriptionInputSchema = z.object({
  description: z.string().describe("A text description of a meal (e.g., 'A bowl of oatmeal with berries and nuts')."),
});
export type AnalyzeFoodDescriptionInput = z.infer<typeof AnalyzeFoodDescriptionInputSchema>;


const AnalyzeFoodDescriptionOutputSchema = z.object({
  calories: z.number().describe("An estimated calorie count for the meal."),
  ingredients: z.array(z.string()).describe("A list of the main ingredients identified in the meal."),
});
export type AnalyzeFoodDescriptionOutput = z.infer<typeof AnalyzeFoodDescriptionOutputSchema>;


export async function analyzeFoodDescription(
  input: AnalyzeFoodDescriptionInput
): Promise<AnalyzeFoodDescriptionOutput> {
  return analyzeFoodDescriptionFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeFoodDescriptionPrompt',
  input: {schema: AnalyzeFoodDescriptionInputSchema},
  output: {schema: AnalyzeFoodDescriptionOutputSchema},
  prompt: `You are an expert nutritionist AI. Your task is to analyze a text description of a meal and provide an estimated calorie count and a list of main ingredients.

**TASK:**
Analyze the provided meal description. You MUST perform the following actions and return them as a valid JSON object:

1.  **Estimate Calories:** Provide a realistic calorie estimate for the described meal.
2.  **List Ingredients:** Identify and list the main ingredients in the meal.

**DESCRIPTION:**
"{{{description}}}"
`,
});


const analyzeFoodDescriptionFlow = ai.defineFlow(
  {
    name: 'analyzeFoodDescriptionFlow',
    inputSchema: AnalyzeFoodDescriptionInputSchema,
    outputSchema: AnalyzeFoodDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
