
'use server';

/**
 * @fileOverview An AI agent to analyze a user's situation and suggest potential financial benefits.
 *
 * - generateBenefitsSuggestion - A function that handles the benefit suggestion process.
 * - GenerateBenefitsSuggestionInput - The input type for the function.
 * - GenerateBenefitsSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBenefitsSuggestionInputSchema = z.object({
  age: z.string().describe("The user's age."),
  employmentStatus: z.string().describe("The user's current employment status."),
  income: z.string().optional().describe("The user's annual income, if provided."),
  savings: z.string().optional().describe("The user's savings, if provided."),
  existingBenefits: z.array(z.string()).optional().describe("A list of benefits the user is already receiving."),
});
export type GenerateBenefitsSuggestionInput = z.infer<typeof GenerateBenefitsSuggestionInputSchema>;

const BenefitSuggestionSchema = z.object({
    name: z.string().describe("The name of the suggested benefit."),
    reason: z.string().describe("A brief, simple explanation of why this benefit is being suggested and what it is for."),
});

const GenerateBenefitsSuggestionOutputSchema = z.object({
  suggestions: z.array(BenefitSuggestionSchema).describe('A list of suggested benefits.'),
});
export type GenerateBenefitsSuggestionOutput = z.infer<typeof GenerateBenefitsSuggestionOutputSchema>;

export async function generateBenefitsSuggestion(
  input: GenerateBenefitsSuggestionInput
): Promise<GenerateBenefitsSuggestionOutput> {
  return generateBenefitsSuggestionFlow(input);
}

const benefitsDecisionLogic = `
[
  {
    "Age Range":"Under 16",
    "Employment Status":"N/A",
    "Existing Benefits":"Any",
    "Income/Savings":"N/A",
    "Health Impact (Cancer)":"Has cancer",
    "Additional or Replacement Benefits":"Disability Living Allowance (DLA), Carer's Allowance (for parent), NHS travel/prescription support"
  },
  {
    "Age Range":"16-64",
    "Employment Status":"Employed",
    "Existing Benefits":"None or any",
    "Income/Savings":"Any",
    "Health Impact (Cancer)":"Cannot work (cancer)",
    "Additional or Replacement Benefits":"Statutory Sick Pay (SSP), Personal Independence Payment (PIP), Employment and Support Allowance (ESA), Universal Credit (UC) with LCWRA element"
  },
  {
    "Age Range":"16-64",
    "Employment Status":"Employed",
    "Existing Benefits":"SSP ended",
    "Income/Savings":"Low income/savings < £16K",
    "Health Impact (Cancer)":"Ongoing illness (cancer)",
    "Additional or Replacement Benefits":"ESA, PIP, UC with health-related element, Blue Badge"
  },
  {
    "Age Range":"16-64",
    "Employment Status":"Unemployed",
    "Existing Benefits":"JSA",
    "Income/Savings":"Low income",
    "Health Impact (Cancer)":"Diagnosed with cancer",
    "Additional or Replacement Benefits":"Replace JSA with ESA, claim PIP, UC with LCWRA"
  },
  {
    "Age Range":"16-64",
    "Employment Status":"On Benefits",
    "Existing Benefits":"Universal Credit (UC)",
    "Income/Savings":"Low income",
    "Health Impact (Cancer)":"New cancer diagnosis",
    "Additional or Replacement Benefits":"Add Limited Capability for Work (LCWRA) element, apply for PIP"
  },
  {
    "Age Range":"16-64",
    "Employment Status":"Self-employed",
    "Existing Benefits":"None",
    "Income/Savings":"Income affected",
    "Health Impact (Cancer)":"Cancer limits work",
    "Additional or Replacement Benefits":"UC with health element, PIP, ESA (New Style), Council Tax Support"
  },
  {
    "Age Range":"16-64",
    "Employment Status":"Already on UC",
    "Existing Benefits":"UC",
    "Income/Savings":"Low income",
    "Health Impact (Cancer)":"New cancer diagnosis",
    "Additional or Replacement Benefits":"Add LCWRA element (extra ~£390/month), apply for PIP"
  },
  {
    "Age Range":"16-64",
    "Employment Status":"Already on ESA",
    "Existing Benefits":"ESA",
    "Income/Savings":"Low income",
    "Health Impact (Cancer)":"Health worsens",
    "Additional or Replacement Benefits":"Ensure they're in Support Group, PIP, Council Tax Support"
  },
  {
    "Age Range":"65+",
    "Employment Status":"Retired",
    "Existing Benefits":"State Pension",
    "Income/Savings":"Low income",
    "Health Impact (Cancer)":"Diagnosed with cancer",
    "Additional or Replacement Benefits":"Attendance Allowance, Pension Credit with Severe Disability Premium, Blue Badge, Free NHS travel/prescriptions"
  },
  {
    "Age Range":"65+",
    "Employment Status":"Retired",
    "Existing Benefits":"Pension Credit",
    "Income/Savings":"Low income",
    "Health Impact (Cancer)":"Cancer diagnosis",
    "Additional or Replacement Benefits":"Attendance Allowance, Carer's Allowance (for spouse if caring), Housing Benefit/Council Tax Support"
  },
  {
    "Age Range":"Any",
    "Employment Status":"Any",
    "Existing Benefits":"Caring for someone with cancer",
    "Income/Savings":"Any",
    "Health Impact (Cancer)":"Caring 35+ hours/week",
    "Additional or Replacement Benefits":"Carer's Allowance, Council Tax discount for carers"
  },
  {
    "Age Range":"Terminal",
    "Employment Status":"Any",
    "Existing Benefits":"Any",
    "Income/Savings":"Any",
    "Health Impact (Cancer)":"Terminal (expected < 12 months)",
    "Additional or Replacement Benefits":"Fast-track: PIP (highest rate), Attendance Allowance, DLA, UC/ESA with no work requirements"
  }
]
`;

const prompt = ai.definePrompt({
  name: 'generateBenefitsSuggestionPrompt',
  input: {schema: GenerateBenefitsSuggestionInputSchema},
  output: {schema: GenerateBenefitsSuggestionOutputSchema},
  prompt: `You are an expert UK benefits advisor AI. Your task is to analyze a user's situation based on the data provided and suggest potential additional benefits they could claim. You MUST use the provided JSON ruleset to make your determination. The user has cancer, which is a significant health condition.

**User Information:**
- Age: {{{age}}}
- Employment Status: {{{employmentStatus}}}
- Annual Income: {{{income}}}
- Savings: {{{savings}}}
- Existing Benefits: {{#each existingBenefits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**Benefits Decision Logic (JSON Ruleset):**
\`\`\`json
${benefitsDecisionLogic}
\`\`\`

**Task:**
1.  Carefully review the user's information.
2.  Compare their situation against each rule in the JSON logic.
3.  Identify any "Additional or Replacement Benefits" the user might be eligible for.
4.  You MUST filter out any benefits the user is already receiving (listed in "Existing Benefits").
5.  For each *new* potential benefit, provide its name and a brief, simple explanation of what it is for.
6.  If there are no new benefits to suggest, return an empty array for "suggestions".
7.  Format the output as a valid JSON object matching the provided schema.
`,
});

const generateBenefitsSuggestionFlow = ai.defineFlow(
  {
    name: 'generateBenefitsSuggestionFlow',
    inputSchema: GenerateBenefitsSuggestionInputSchema,
    outputSchema: GenerateBenefitsSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

