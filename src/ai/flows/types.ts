
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


export const SourceDocument = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  analysis: z.string(),
});
export type SourceDocument = z.infer<typeof SourceDocument>;


export const SourceConversation = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  summary: z.string(),
  fullConversation: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
});
export type SourceConversation = z.infer<typeof SourceConversation>;
