
'use server';

/**
 * @fileOverview An AI agent to create a matrix of potential benefits based on different scenarios.
 *
 * - generateBenefitsMatrix - A function that handles the benefit matrix generation.
 * - GenerateBenefitsMatrixInput - The input type for the function.
 * - GenerateBenefitsMatrixOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBenefitsMatrixInputSchema = z.object({
  age: z.string().describe("The user's age."),
  employmentStatus: z.string().describe("The user's current employment status."),
  existingBenefits: z.array(z.string()).describe("A list of benefits the user is already receiving."),
});
export type GenerateBenefitsMatrixInput = z.infer<typeof GenerateBenefitsMatrixInputSchema>;

const BenefitInfoSchema = z.object({
    name: z.string().describe("The name of the benefit."),
    isEligible: z.boolean().describe("Whether the user is likely eligible for this benefit in this scenario."),
    isCurrent: z.boolean().describe("Whether the user is already receiving this benefit."),
    reason: z.string().describe("A brief explanation for the eligibility status.")
});

const ScenarioSchema = z.object({
    scenario: z.string().describe("The name of the scenario (e.g., 'If you stop working due to illness')."),
    description: z.string().describe("A brief description of this scenario."),
    benefits: z.array(BenefitInfoSchema).describe("The list of benefits and their status for this scenario.")
});

const GenerateBenefitsMatrixOutputSchema = z.object({
  scenarios: z.array(ScenarioSchema).describe('An array of different scenarios and the potential benefits in each.'),
});
export type GenerateBenefitsMatrixOutput = z.infer<typeof GenerateBenefitsMatrixOutputSchema>;

export async function generateBenefitsMatrix(
  input: GenerateBenefitsMatrixInput
): Promise<GenerateBenefitsMatrixOutput> {
  return generateBenefitsMatrixFlow(input);
}

const benefitsDecisionLogic = `
[
  // This is a comprehensive list of rules for determining UK benefit eligibility based on various life circumstances.
  // The AI will use these rules to populate the matrix for different scenarios.
  {
    "Age Range":"Under 16", "Employment Status":"N/A", "Health Impact (Cancer)":"Has cancer",
    "Resulting Benefits":"Disability Living Allowance (DLA), Carer's Allowance (for parent), NHS travel/prescription support"
  },
  {
    "Age Range":"16-64", "Employment Status":"Employed", "Health Impact (Cancer)":"Cannot work (cancer)",
    "Resulting Benefits":"Statutory Sick Pay (SSP), Personal Independence Payment (PIP), New Style Employment and Support Allowance (ESA), Universal Credit (UC) with LCWRA element"
  },
  {
    "Age Range":"16-64", "Employment Status":"Employed", "Health Impact (Cancer)":"SSP ended, ongoing illness",
    "Resulting Benefits":"New Style ESA, PIP, UC with health-related element, Blue Badge, Council Tax Support"
  },
  {
    "Age Range":"16-64", "Employment Status":"Unemployed", "Health Impact (Cancer)":"Diagnosed with cancer",
    "Resulting Benefits":"Replace Jobseeker's Allowance (JSA) with New Style ESA, claim PIP, Universal Credit (UC) with LCWRA"
  },
  {
    "Age Range":"16-64", "Employment Status":"On Benefits", "Health Impact (Cancer)":"New cancer diagnosis",
    "Existing Benefits": "Universal Credit (UC)", "Resulting Benefits":"Add Limited Capability for Work (LCWRA) element, Personal Independence Payment (PIP)"
  },
  {
    "Age Range":"16-64", "Employment Status":"Self-employed", "Health Impact (Cancer)":"Cancer limits work",
    "Resulting Benefits":"UC with health element, PIP, New Style ESA, Council Tax Support"
  },
  {
    "Age Range":"65+", "Employment Status":"Retired", "Health Impact (Cancer)":"Diagnosed with cancer",
    "Resulting Benefits":"Attendance Allowance, Pension Credit with Severe Disability Premium, Blue Badge, Free NHS travel/prescriptions"
  },
  {
    "Age Range":"Any", "Employment Status":"Any", "Health Impact (Cancer)":"Caring 35+ hours/week for someone with cancer",
    "Resulting Benefits":"Carer's Allowance, Council Tax discount for carers"
  },
  {
    "Age Range":"Terminal", "Employment Status":"Any", "Health Impact (Cancer)":"Terminal (expected < 12 months)",
    "Resulting Benefits":"Fast-track: PIP (highest rate), Attendance Allowance, DLA, UC/ESA with no work requirements"
  }
]
`;

const prompt = ai.definePrompt({
  name: 'generateBenefitsMatrixPrompt',
  input: {schema: GenerateBenefitsMatrixInputSchema},
  output: {schema: GenerateBenefitsMatrixOutputSchema},
  prompt: `You are an expert UK benefits advisor AI. Your task is to generate a benefits matrix for a user based on their current situation and several potential future scenarios.

**User's Current Situation:**
*   Age: {{{age}}}
*   Employment Status: {{{employmentStatus}}}
*   Existing Benefits: {{#if existingBenefits}}{{#each existingBenefits}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

**Benefits Decision Logic (JSON Ruleset):**
\`\`\`json
${benefitsDecisionLogic}
\`\`\`

**Task:**
Create a response for the following three scenarios. For each scenario, determine the potential benefits based on the JSON ruleset provided.

1.  **Scenario: "If you stop working due to illness"**
    *   Description: This scenario applies if your health condition prevents you from continuing your current employment.
    *   Assume the user's employment status changes to "Cannot work (cancer)".
    *   List all potential benefits from the rules.

2.  **Scenario: "If you become a carer"**
    *   Description: This applies if you start caring for someone with cancer for at least 35 hours per week.
    *   Assume the user's "Health Impact" is "Caring 35+ hours/week for someone with cancer".
    *   List all potential benefits from the rules.

3.  **Scenario: "If your prognosis is terminal"**
    *   Description: This applies if you receive a terminal diagnosis (with a life expectancy of less than 12 months).
    *   Assume the user's "Health Impact" is "Terminal (expected < 12 months)".
    *   List all potential benefits from the rules.

**Output Formatting Instructions:**
For each scenario, you must generate a list of all possible benefits mentioned in the ruleset. For each benefit in that list, you MUST determine three things:
1.  \`name\`: The name of the benefit.
2.  \`isEligible\`: A boolean. Set to \`true\` if the rules for the given scenario suggest this benefit.
3.  \`isCurrent\`: A boolean. Set to \`true\` if this benefit is in the user's \`existingBenefits\` list.
4.  \`reason\`: A brief explanation. If eligible, explain why (e.g., "For help with daily living costs due to illness"). If not eligible, state "Not typically available in this scenario." If it's a current benefit, state "You are already receiving this benefit."

Your final output MUST be a valid JSON object matching the provided schema.
`,
});

const generateBenefitsMatrixFlow = ai.defineFlow(
  {
    name: 'generateBenefitsMatrixFlow',
    inputSchema: GenerateBenefitsMatrixInputSchema,
    outputSchema: GenerateBenefitsMatrixOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
