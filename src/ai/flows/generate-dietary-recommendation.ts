
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
import { type DiaryEntryForAI, DiaryEntrySchemaForAI } from './types';


const GenerateDietaryRecommendationInputSchema = z.object({
  diagnosis: z.string().describe("The user's primary health diagnosis. This may contain multiple conditions separated by commas."),
  recentMeals: z.array(DiaryEntrySchemaForAI).describe("An array of the user's recent diary entries, including their logged food intake."),
});
export type GenerateDietaryRecommendationInput = z.infer<typeof GenerateDietaryRecommendationInputSchema>;


const MealSuggestionSchema = z.object({
  name: z.string().describe("The name of the meal suggestion (e.g., 'Oatmeal with Berries')."),
  reason: z.string().describe("A brief, one-sentence explanation of why this meal is a good choice for the user's condition."),
  ingredients: z.array(z.string()).describe("A list of simple ingredients for the meal."),
  instructions: z.string().describe("Simple, step-by-step cooking instructions, formatted as a numbered list in a single string."),
  calories: z.number().describe("An estimated calorie count for the meal."),
  costPerPortion: z.number().describe("An estimated cost per portion in GBP (£)."),
});

const GenerateDietaryRecommendationOutputSchema = z.object({
    dietaryCommentary: z.string().describe("A 2-3 sentence commentary on the user's current diet based on their logged meals, providing gentle, constructive feedback."),
    recommendations: z.object({
        breakfast: z.array(MealSuggestionSchema).describe("A list of at least 12 breakfast suggestions."),
        lunch: z.array(MealSuggestionSchema).describe("A list of at least 12 lunch suggestions."),
        dinner: z.array(MealSuggestionSchema).describe("A list of at least 12 dinner suggestions."),
        snacks: z.array(MealSuggestionSchema).describe("A list of at least 12 snack suggestions for the week."),
    })
});
export type GenerateDietaryRecommendationOutput = z.infer<typeof GenerateDietaryRecommendationOutputSchema>;


export async function generateDietaryRecommendation(
  input: GenerateDietaryRecommendationInput
): Promise<GenerateDietaryRecommendationOutput> {
  // Return a default/empty state if there's no diagnosis to work with.
  if (!input.diagnosis || input.diagnosis === "Not specified" || input.diagnosis.toLowerCase().includes("all types")) {
      return {
          dietaryCommentary: "To provide the best dietary advice, it's essential to have information about your recent meals. Please start logging your food intake so we can create a personalized plan that supports your health journey and complements your treatment.",
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
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert nutritionist AI. Your task is to provide dietary recommendations and commentary for a user with a specific health condition. Your tone must be supportive, encouraging, and easy to understand. You should aim to provide new and creative suggestions each time you are called.

**CONTEXT:**
*   **User's Diagnosis/Conditions:** {{{diagnosis}}} (Note: This may contain multiple conditions separated by commas. Your recommendations should be safe and appropriate for ALL listed conditions.)
*   **User's Recent Meals (from their diary):**
    {{#each recentMeals}}
    - **{{date}}:** {{#if foodIntake}} {{#each foodIntake}} {{title}} (~{{calories}} kcal, Ingredients: {{#each ingredients}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}); {{/each}} {{else if food}} {{food}} {{/if}}
    {{else}}
    - No meals logged recently.
    {{/each}}

**TASK:**
You MUST perform two actions:

1.  **Generate Dietary Commentary:**
    *   Review the user's recently logged meals.
    *   Write a 2-3 sentence, high-level commentary on their current diet, considering all their diagnoses.
    *   If there are positive aspects (e.g., eating fruits/vegetables), praise them.
    *   If there are potential areas for improvement related to their diagnosis (e.g., high sodium for kidney disease, high sugar for diabetes), provide gentle, constructive suggestions. For example: "It's great to see you're logging your meals! I noticed some of your recent choices might be higher in sodium, which is something to be mindful of with kidney conditions. Perhaps we could explore some lower-salt alternatives?"
    *   If no meals are logged, encourage them to start logging to get feedback.

2.  **Generate Meal Recommendations:**
    *   Based on ALL of the user's diagnosed conditions, create a list of at least 12 simple, healthy meal suggestions for EACH of the following categories: Breakfast, Lunch, Dinner, and Snacks.
    *   For each meal suggestion, you MUST provide:
        *   name: The name of the meal (e.g., "Grilled Salmon with Quinoa").
        *   reason: A brief, one-sentence explanation of *why* it's a good choice for their condition(s) (e.g., "Rich in omega-3s, which are good for heart health.").
        *   calories: An estimated calorie count for the meal (e.g. 450).
        *   costPerPortion: An estimated cost per portion in GBP (£), returned as a number (e.g., 3.50).
        *   ingredients: A list of simple, common ingredients.
        *   instructions: Simple, step-by-step cooking instructions, formatted as a numbered list within a single string (e.g., "1. Preheat oven to 200°C.\\n2. Season salmon with herbs.\\n3. Bake for 15 minutes.").

**CRITICAL RULES:**
*   Your advice must be safe and suitable for all listed diagnoses. If there is a conflict (e.g., one condition needs high protein, another needs low protein), prioritize the more critical restriction or suggest moderate options.
*   Do NOT provide specific portion sizes in the recipe, but your calorie and cost estimates should assume a standard single serving.
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
