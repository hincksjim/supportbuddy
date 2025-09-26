
'use server';

/**
 * @fileOverview An AI agent to generate a categorized shopping list from a list of meals.
 *
 * - generateShoppingList - A function that handles the shopping list generation.
 * - GenerateShoppingListInput - The input type for the function.
 * - GenerateShoppingListOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateShoppingListInputSchema, GenerateShoppingListOutputSchema } from './types';
import type { GenerateShoppingListInput, GenerateShoppingListOutput } from './types';

export async function generateShoppingList(
  input: GenerateShoppingListInput
): Promise<GenerateShoppingListOutput> {
  return generateShoppingListFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateShoppingListPrompt',
  input: {schema: GenerateShoppingListInputSchema},
  output: {schema: GenerateShoppingListOutputSchema},
  model: 'gemini-1.5-flash',
  prompt: `You are an expert shopping list generator for a UK-based user. Your task is to take a list of meals and create a consolidated, categorized shopping list with estimated prices.

**TASK:**
1.  **Review Meals:** Go through all the ingredients from the provided list of meals.
2.  **Consolidate Ingredients:** Combine identical ingredients. For example, if one meal needs '1 onion' and another needs '1 onion', the list should show '2 onions'. If quantities are in different units (e.g., '1 cup of flour' and '200g of flour'), use your best judgment to combine them into a single sensible unit (e.g., 'approx. 450g flour').
3.  **Categorize Items:** Group all items into logical supermarket categories. Use these categories ONLY:
    *   Produce (Fruit & Vegetables)
    *   Meat & Fish
    *   Dairy & Eggs
    *   Bakery
    *   Pantry (for dry goods, spices, oils, tins, etc.)
    *   Frozen
    *   Other
4.  **Estimate Costs:** For each consolidated item, provide a realistic estimated cost in GBP (£) based on average UK supermarket prices. For example, a single onion might be £0.15, a chicken breast £2.00, a spice jar £1.50.
5.  **Calculate Total:** Sum up all individual item costs to get a total estimated cost for the entire shopping list.
6.  **Structure Output:** Your final output MUST be a valid JSON object matching the provided schema.

**Meals to Process:**
{{#each meals}}
- **{{name}}**: {{#each ingredients}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}
`,
});


const generateShoppingListFlow = ai.defineFlow(
  {
    name: 'generateShoppingListFlow',
    inputSchema: GenerateShoppingListInputSchema,
    outputSchema: GenerateShoppingListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
