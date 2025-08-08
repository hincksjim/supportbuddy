
import {z} from 'genkit';

/**
 * @fileOverview This file contains shared Zod schemas for AI flows.
 * It does not contain any server actions and can be safely imported by other files.
 */

export const BenefitSuggestionSchema = z.object({
    name: z.string().describe("The name of the suggested benefit."),
    reason: z.string().describe("A brief, simple explanation of why this benefit is being suggested and what it is for."),
});
export type BenefitSuggestion = z.infer<typeof BenefitSuggestionSchema>;
