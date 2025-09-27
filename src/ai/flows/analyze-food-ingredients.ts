'use server';

/**
 * @fileOverview An AI agent to analyze meal ingredients against a user's diagnosis.
 *
 * - analyzeFoodIngredients - A function that handles the ingredient analysis.
 * - AnalyzeFoodIngredientsInput - The input type for the function.
 * - AnalyzeFoodIngredientsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFoodIngredientsInputSchema = z.object({
  diagnosis: z.string().describe("The user's primary diagnosed health condition."),
  ingredients: z.array(z.string()).describe("A list of ingredients from a meal."),
});
export type AnalyzeFoodIngredientsInput = z.infer<typeof AnalyzeFoodIngredientsInputSchema>;

const AnalyzeFoodIngredientsOutputSchema = z.object({
  warning: z.string().nullable().describe("A brief, helpful warning if any ingredients are potentially problematic for the user's diagnosis (e.g., high in sodium for kidney disease, high in sugar for diabetes). Returns null if no specific concerns are found."),
});
export type AnalyzeFoodIngredientsOutput = z.infer<typeof AnalyzeFoodIngredientsOutputSchema>;

export async function analyzeFoodIngredients(
  input: AnalyzeFoodIngredientsInput
): Promise<AnalyzeFoodIngredientsOutput> {
  return analyzeFoodIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFoodIngredientsPrompt',
  input: {schema: AnalyzeFoodIngredientsInputSchema},
  output: {schema: AnalyzeFoodIngredientsOutputSchema},
  model: 'gemini-2.5-flash-lite',
  prompt: `You are an expert nutritionist. Your task is to analyze a list of meal ingredients and provide a dietary warning if any of them are generally considered problematic for a user with a specific health condition.

**TASK:**
1.  **Review Diagnosis and Ingredients:** Consider the user's diagnosis: '{{{diagnosis}}}' and the ingredients: {{#each ingredients}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}.
2.  **Identify Potential Issues:** Check if any ingredients are high in substances that could be harmful for the given diagnosis. For example:
    *   **Kidney Disease:** High sodium, potassium, or phosphorus.
    *   **Diabetes:** High sugar, refined carbohydrates.
    *   **Heart Disease:** High saturated fats, sodium.
3.  **Generate Warning (if necessary):** If you find a potential issue, construct a brief, one-sentence warning. For example: "This meal may be high in sodium, which should be monitored with kidney conditions." or "The ingredients suggest a high sugar content, which is a concern for diabetes."
4.  **No Warning:** If the ingredients seem generally fine or you cannot determine a clear risk, you **MUST** return \`null\` for the 'warning' field. Do not invent warnings.

Your final output MUST be a valid JSON object matching the provided schema.`,
});

const analyzeFoodIngredientsFlow = ai.defineFlow(
  {
    name: 'analyzeFoodIngredientsFlow',
    inputSchema: AnalyzeFoodIngredientsInputSchema,
    outputSchema: AnalyzeFoodIngredientsOutputSchema,
  },
  async input => {
    // Do not run analysis if diagnosis is not specified or too generic.
    if (!input.diagnosis || input.diagnosis === "Not specified" || input.diagnosis.toLowerCase().includes("all types")) {
        return { warning: null };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
