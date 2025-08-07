
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
    reason: z.string().describe("A brief, one-sentence explanation for the eligibility status."),
    requirements: z.string().describe("A slightly more detailed, user-friendly explanation of the key requirements or purpose of the benefit (2-3 sentences)."),
    url: z.string().url().describe("The official government URL for more information and to apply for the benefit.")
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
    "Benefit": "Disability Living Allowance (DLA)", "Who its for": "For children under 16 to help with the extra costs of being disabled.", "URL": "https://www.gov.uk/disability-living-allowance-children",
    "Rule": "Age Range Under 16, Health Impact (Cancer) Has cancer"
  },
  {
    "Benefit": "Carer's Allowance", "Who its for": "For people who spend at least 35 hours a week caring for someone with substantial caring needs.", "URL": "https://www.gov.uk/carers-allowance",
    "Rule": "Age Range Any, Health Impact (Cancer) Caring 35+ hours/week for someone with cancer"
  },
  {
    "Benefit": "Statutory Sick Pay (SSP)", "Who its for": "Paid by your employer for up to 28 weeks if you're too ill to work.", "URL": "https://www.gov.uk/statutory-sick-pay",
    "Rule": "Age Range 16-Pension Age, Employment Status Employed, Health Impact (Cancer) Cannot work (cancer)"
  },
  {
    "Benefit": "Personal Independence Payment (PIP)", "Who its for": "Helps with extra living costs if you have both a long-term physical or mental health condition and difficulty doing certain everyday tasks or getting around.", "URL": "https://www.gov.uk/pip",
    "Rule": "Age Range 16-Pension Age, Health Impact (Cancer) any"
  },
  {
    "Benefit": "New Style Employment and Support Allowance (ESA)", "Who its for": "For people who have a disability or health condition that affects how much they can work. It is based on your National Insurance contributions.", "URL": "https://www.gov.uk/employment-support-allowance",
    "Rule": "Age Range 16-Pension Age, Employment Status Employed or Self-employed or Unemployed"
  },
  {
    "Benefit": "Universal Credit (UC)", "Who its for": "A payment to help with your living costs. You may be able to get it if you’re on a low income, out of work or you cannot work.", "URL": "https://www.gov.uk/universal-credit",
    "Rule": "Age Range 16-Pension Age, Income/Savings Low income/savings < £16K"
  },
  {
    "Benefit": "Attendance Allowance", "Who its for": "For people over State Pension age who have a disability and need someone to help look after them.", "URL": "https://www.gov.uk/attendance-allowance",
    "Rule": "Age Range Pension Age+, Health Impact (Cancer) any"
  },
  {
    "Benefit": "Pension Credit", "Who its for": "An income-related benefit to give you some extra money in retirement if you're on a low income.", "URL": "https://www.gov.uk/pension-credit",
    "Rule": "Age Range Pension Age+, Employment Status Retired or any"
  },
  {
    "Benefit": "Blue Badge", "Who its for": "Helps people with disabilities or health conditions park closer to their destination.", "URL": "https://www.gov.uk/blue-badge-scheme-information-council",
    "Rule": "Age Range Any, Health Impact (Cancer) any mobility issues"
  },
  {
    "Benefit": "Council Tax Support", "Who its for": "Helps people on low incomes pay their Council Tax bill. This is provided by your local council.", "URL": "https://www.gov.uk/apply-council-tax-reduction",
    "Rule": "Age Range Any, Income/Savings Low income"
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

**Benefits Definitions (JSON Ruleset):**
\`\`\`json
${benefitsDecisionLogic}
\`\`\`

**CRITICAL Pension Age Rule:**
The UK State Pension age is not a fixed number (like 65). It varies based on date of birth and is gradually increasing. You MUST use the user's Age ({{{age}}}) to make a reasonable determination of whether they are of working age or pension age. For example, a 64-year-old is of working age. Someone who is 68 is of pension age. Use your knowledge of current UK pension ages to determine which category the user falls into. Do not classify someone as "Pension Age+" if their age is below the current state pension threshold.

**Employment Status Mapping**: For the purpose of applying the rules, consider the status 'unemployed-on-benefits' to be the same as 'On Benefits'.

**Task:**
Create a response for the following three scenarios. For each scenario, determine the potential benefits based on the JSON ruleset and the Pension Age Rule provided.

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
For each scenario, you must generate a list of all possible benefits mentioned in the ruleset. For each benefit in that list, you MUST determine five things:
1.  \`name\`: The name of the benefit, taken from the "Benefit" field in the JSON.
2.  \`isEligible\`: A boolean. Set to \`true\` if the rules for the given scenario suggest this benefit.
3.  \`isCurrent\`: A boolean. Set to \`true\` if this benefit is in the user's \`existingBenefits\` list.
4.  \`reason\`: A brief, one-sentence explanation for the eligibility status. If \`isCurrent\` is true, the reason MUST be "You are already receiving this benefit.". If eligible, explain why (e.g., "For help with daily living costs due to illness"). If not eligible, state "Not typically available in this scenario."
5.  \`requirements\`: A slightly more detailed, user-friendly explanation of the key requirements or purpose of the benefit (2-3 sentences), based on the "Who its for" description in the JSON ruleset.
6.  \`url\`: The official government URL for the benefit, taken from the "URL" field in the JSON.

**Crucial Logic:** If a benefit is marked as \`isCurrent: true\`, you MUST also set \`isEligible: true\`. This ensures the UI correctly shows it as "Already Receiving" rather than "Not Eligible".

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
