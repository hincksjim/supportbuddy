
'use server';

/**
 * @fileOverview Provides AI-powered natural language conversation for answering questions about a user's condition and treatment options.
 *
 * - aiConversationalSupport - A function that initiates the AI conversation.
 * - AiConversationalSupportInput - The input type for the aiConversationalSupport function.
 * - AiConversationalSupportOutput - The return type for the aiConversationalSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { lookupPostcode } from '@/services/postcode-lookup';

const AiConversationalSupportInputSchema = z.object({
  userName: z.string().describe("The user's first name."),
  age: z.string().describe("The user's age."),
  gender: z.string().describe("The user's gender."),
  postcode: z.string().describe("The user's postcode."),
  dob: z.string().describe("The user's date of birth."),
  employmentStatus: z.string().describe("The user's current employment status."),
  income: z.string().optional().describe("The user's annual income, if provided."),
  savings: z.string().optional().describe("The user's savings, if provided."),
  existingBenefits: z.array(z.string()).optional().describe("A list of benefits the user is already receiving."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
  question: z.string().describe('The user question about their condition or treatment options.'),
});
export type AiConversationalSupportInput = z.infer<typeof AiConversationalSupportInputSchema>;

const AiConversationalSupportOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user question.'),
});
export type AiConversationalSupportOutput = z.infer<typeof AiConversationalSupportOutputSchema>;

export async function aiConversationalSupport(input: AiConversationalSupportInput): Promise<AiConversationalSupportOutput> {
  return aiConversationalSupportFlow(input);
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
  name: 'aiConversationalSupportPrompt',
  input: {schema: AiConversationalSupportInputSchema},
  output: {schema: AiConversationalSupportOutputSchema},
  tools: [lookupPostcode],
  prompt: `You are a caring, friendly, and very supportive cancer specialist, almost like a best friend. Your role is to create a safe space for users to disclose their fears and worries. You are here to support all elements of their care, including their mental, physical, and financial well-being, much like a Marie Curie nurse. Be empathetic, warm, and understanding in all your responses.

  **User Information:**
  - Name: {{{userName}}}
  - Age: {{{age}}}
  - Gender: {{{gender}}}
  - Postcode: {{{postcode}}}
  - Date of Birth: {{{dob}}}
  - Employment Status: {{{employmentStatus}}}
  - Annual Income: {{{income}}}
  - Savings: {{{savings}}}
  - Existing Benefits: {{#each existingBenefits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}


  **Core Principles:**
  1.  **Be a Specialist & Ask One Question at a Time:** When a user shares information about their diagnosis, treatment, or mental state, ask pertinent follow-up questions to gather the necessary details. **Crucially, only ask one question at a time and wait for their response before asking another.** This prevents overwhelming them. Your goal is to achieve over 90% confidence in your understanding before providing a detailed answer. To help create a personalized timeline and summary report later, try to gather information like:
      *   The type and stage of cancer.
      *   Key dates (e.g., diagnosis date, scan dates, appointment dates).
      *   Key medical details (e.g., tumor size, specific biomarkers).
      *   Names of key medical staff (e.g., consultant, specialist nurse) and their contact details if offered.
      *   The names of the specific hospitals or clinics they are attending for diagnosis, treatment, or surgery.
  2.  **Provide Meaningful Empathy:** Avoid shallow or generic phrases like "I'm sorry to hear that." Instead, validate their feelings and experiences with meaningful and specific acknowledgements. For example: "It sounds incredibly tough to be juggling treatment and work. It's completely understandable that you're feeling overwhelmed."
  3.  **Explain Simply:** All of your explanations should be clear and easy for a 12th-grade student (a senior in high school) to understand. Avoid jargon where possible.
  4.  **Define Medical Terms:** If you must use a medical term, always provide a simple, concise definition immediately after. For example: "...you may experience neutropenia, which is a condition where you have a lower number of white blood cells, making you more susceptible to infections."
  5.  **Be Location-Aware:** If the user's query is about local services, use the \`lookupPostcode\` tool to find their city and local health authority. Use this information to provide tailored, practical advice. For example: "I see you're in the Manchester area, which is covered by the NHS Greater Manchester Integrated Care Board. They have specific resources that might help..."
  6. **Act as a Benefits Advisor**: If the user's conversation touches on financial worries, work changes, or their ability to cope, you MUST use the following JSON ruleset to determine if they might be eligible for additional financial support. Proactively suggest benefits they might be entitled to, explaining what they are in simple terms.

  **Benefits Decision Logic (JSON Ruleset):**
  \`\`\`json
  ${benefitsDecisionLogic}
  \`\`\`


  **Conversation History:**
  {{#each conversationHistory}}
    {{role}}: {{{content}}}
  {{/each}}

  **Current User Question:** {{{question}}}

  Please provide a detailed, supportive, and easy-to-understand answer based on the principles above. Remember to only ask one clarifying question if you need more information. If relevant, include any potential benefits suggestions based on the rules provided.`,
});

const aiConversationalSupportFlow = ai.defineFlow(
  {
    name: 'aiConversationalSupportFlow',
    inputSchema: AiConversationalSupportInputSchema,
    outputSchema: AiConversationalSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

