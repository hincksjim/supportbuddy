
'use server';

/**
 * @fileOverview An AI agent to recommend a diet based on a user's diagnosis and current food intake.
 *
 * - generateDietaryRecommendation - A function that handles the recommendation generation.
 * - GenerateDietaryRecommendationInput - The input type for the function.
 * - GenerateDietaryRecommendationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { DiaryEntryForAI } from './types';


const GenerateDietaryRecommendationInputSchema = z.object({
  diagnosis: z.string().describe("The user's primary health diagnosis."),
  recentMeals: z.array(DiaryEntryForAI).describe("An array of the user's recent diary entries, including their logged food intake."),
});
export type GenerateDietaryRecommendationInput = z.infer<typeof GenerateDietaryRecommendationInputSchema>;


const MealSuggestionSchema = z.object({
  name: z.string().describe("The name of the meal suggestion (e.g., 'Oatmeal with Berries')."),
  reason: z.string().describe("A brief, one-sentence explanation of why this meal is a good choice for the user's condition."),
});

const GenerateDietaryRecommendationOutputSchema = z.object({
    dietaryCommentary: z.string().describe("A 2-3 sentence commentary on the user's current diet based on their logged meals, providing gentle, constructive feedback."),
    recommendations: z.object({
        breakfast: z.array(MealSuggestionSchema).describe("A list of 2-3 breakfast suggestions."),
        lunch: z.array(MealSuggestionSchema).describe("A list of 2-3 lunch suggestions."),
        dinner: z.array(MealSuggestionSchema).describe("A list of 2-3 dinner suggestions."),
        snacks: z.array(MealSuggestionSchema).describe("A list of 2-3 snack suggestions for the week."),
    })
});
export type GenerateDietaryRecommendationOutput = z.infer<typeof GenerateDietaryRecommendationOutputSchema>;


export async function generateDietaryRecommendation(
  input: GenerateDietaryRecommendationInput
): Promise<GenerateDietaryRecommendationOutput> {
  // Return a default/empty state if there's no diagnosis to work with.
  if (!input.diagnosis || input.diagnosis === "Not specified" || input.diagnosis.toLowerCase().includes("all types")) {
      return { 
          dietaryCommentary: "Please set your primary health condition in your profile to receive personalized dietary recommendations.",
          recommendations: {
              breakfast: [],
              lunch: [],
              dinner: [],
              snacks: [],
          }
      };
  }
  return generateDietaryRecommendationFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateDietaryRecommendationPrompt',
  input: {schema: GenerateDietaryRecommendationInputSchema},
  output: {schema: GenerateDietaryRecommendationOutputSchema},
  prompt: `You are an expert nutritionist AI. Your task is to provide dietary recommendations and commentary for a user with a specific health condition. Your tone must be supportive, encouraging, and easy to understand.

**CONTEXT:**
*   **User's Diagnosis:** {{{diagnosis}}}
*   **User's Recent Meals (from their diary):**
    {{#each recentMeals}}
    - **{{date}}:** {{#each foodIntake}} {{title}} (~{{calories}} kcal, Ingredients: {{#each ingredients}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}); {{/each}}
    {{else}}
    - No meals logged recently.
    {{/each}}

**TASK:**
You MUST perform two actions:

1.  **Generate Dietary Commentary:**
    *   Review the user's recently logged meals.
    *   Write a 2-3 sentence, high-level commentary on their current diet.
    *   If there are positive aspects (e.g., eating fruits/vegetables), praise them.
    *   If there are potential areas for improvement related to their diagnosis (e.g., high sodium for kidney disease, high sugar for diabetes), provide gentle, constructive suggestions. For example: "It's great to see you're logging your meals! I noticed some of your recent choices might be higher in sodium, which is something to be mindful of with kidney conditions. Perhaps we could explore some lower-salt alternatives?"
    *   If no meals are logged, encourage them to start logging to get feedback.

2.  **Generate Meal Recommendations:**
    *   Based on the user's diagnosis, create a list of 2-3 simple, healthy meal suggestions for EACH of the following categories: Breakfast, Lunch, Dinner, and Snacks.
    *   For each meal suggestion, you MUST provide:
        *   `name`: The name of the meal (e.g., "Grilled Salmon with Quinoa").
        *   `reason`: A brief, one-sentence explanation of *why* it's a good choice for their condition (e.g., "Rich in omega-3s, which are good for heart health.").

**CRITICAL RULES:**
*   Do NOT provide specific calorie counts or portion sizes. Keep the advice general.
*   Your output MUST be a valid JSON object that strictly follows the provided schema.
`,
});


const generateDietaryRecommendationFlow = ai.defineFlow(
  {
    name: 'generateDietaryRecommendationFlow',
    inputSchema: GenerateDietaryRecommendationInputSchema,
    outputSchema: GenerateDietaryRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
