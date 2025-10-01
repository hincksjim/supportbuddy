'use server';

/**
 * @fileOverview An AI agent to calculate BMI and set dietary targets.
 *
 * - generateDietaryTargets - A function that handles the target generation.
 */

import {ai} from '@/ai/genkit';
import { GenerateDietaryTargetsInputSchema, GenerateDietaryTargetsOutputSchema, type GenerateDietaryTargetsInput, type GenerateDietaryTargetsOutput } from './types';


export async function generateDietaryTargets(
  input: GenerateDietaryTargetsInput
): Promise<GenerateDietaryTargetsOutput> {
  return generateDietaryTargetsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateDietaryTargetsPrompt',
  input: {schema: GenerateDietaryTargetsInputSchema},
  output: {schema: GenerateDietaryTargetsOutputSchema},
  model: 'googleai/gemini-2.5-flash-lite',
  prompt: `You are an expert health and nutrition AI. Your task is to calculate a user's Body Mass Index (BMI) and provide a recommended daily calorie intake and a healthy target weight range.

**USER DATA:**
*   **Age:** {{{age}}}
*   **Gender:** {{{gender}}}
*   **Height:** {{{height}}} cm
*   **Current Weight:** {{{weight}}} kg
*   **Activity Level:** Assume 'sedentary' (little to no exercise) for calorie calculations, as this is the safest baseline for a user with a significant health condition unless otherwise specified.

**TASK:**
You MUST perform the following calculations and provide the results in a valid JSON object:

1.  **Calculate BMI:**
    *   Formula: \`weight (kg) / (height (m) * height (m))\`
    *   You will need to convert the height from cm to meters.
    *   Round the result to one decimal place.

2.  **Determine BMI Category:**
    *   Based on the calculated BMI, classify it as 'Underweight' (<18.5), 'Healthy' (18.5-24.9), 'Overweight' (25-29.9), or 'Obese' (>=30).

3.  **Calculate Healthy Target Weight Range:**
    *   Using the user's height, calculate the weight range (in kg) that would put them in the 'Healthy' BMI category (18.5 to 24.9).
    *   Present this as a range, e.g., "60kg - 75kg".

4.  **Recommend Daily Calorie Intake:**
    *   Using a standard formula (like the Mifflin-St Jeor equation), calculate the user's Basal Metabolic Rate (BMR).
    *   Adjust the BMR for a 'sedentary' activity level (BMR * 1.2) to get a maintenance calorie target.
    *   Based on their goal (e.g., if BMI is 'Overweight', suggest a slight deficit; if 'Underweight', a slight surplus), provide a final recommended daily calorie intake. For 'Healthy' weight, suggest maintenance calories. Aim for a safe and gradual change (e.g., +/- 300-500 kcal from maintenance).
    *   Round the final number to the nearest 50 calories.

Your final output MUST be a valid JSON object matching the provided schema. Do not include any other explanatory text.`,
});


const generateDietaryTargetsFlow = ai.defineFlow(
  {
    name: 'generateDietaryTargetsFlow',
    inputSchema: GenerateDietaryTargetsInputSchema,
    outputSchema: GenerateDietaryTargetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
