
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


export const AnalyzeSymptomPatternInputSchema = z.object({
  symptom: z.string().describe("The recurring symptom being experienced by the user (e.g., 'Headache', 'Nausea', 'Back (Lower) pain')."),
  diagnosis: z.string().describe("The user's primary diagnosis (e.g., 'Renal Cell Carcinoma')."),
  medications: z.array(z.object({ name: z.string() })).describe("A list of medications the user is currently taking."),
  treatments: z.array(z.string()).describe("A list of active or recent treatment step titles (e.g., 'Chemotherapy', 'Partial Nephrectomy')."),
});
export type AnalyzeSymptomPatternInput = z.infer<typeof AnalyzeSymptomPatternInputSchema>;

export const AnalyzeSymptomPatternOutputSchema = z.object({
  analysis: z.string().describe("A markdown-formatted string detailing potential links between the symptom and the user's profile. Should start with a summary, then bullet points for each potential link found."),
});
export type AnalyzeSymptomPatternOutput = z.infer<typeof AnalyzeSymptomPatternOutputSchema>;
