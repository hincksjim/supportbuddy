import {z} from 'genkit';

/**
 * @fileOverview This file contains shared Zod schemas for AI flows.
 * It does not contain any server actions and can be safely imported by other files.
 */

export const GenerateDietaryTargetsInputSchema = z.object({
    age: z.string().describe("The user's age in years."),
    gender: z.enum(['male', 'female', 'other']).describe("The user's gender."),
    height: z.string().describe("The user's height in centimeters."),
    weight: z.string().describe("The user's current weight in kilograms."),
});
export type GenerateDietaryTargetsInput = z.infer<typeof GenerateDietaryTargetsInputSchema>;

export const GenerateDietaryTargetsOutputSchema = z.object({
  bmi: z.number().describe("The user's calculated Body Mass Index, rounded to one decimal place."),
  bmiCategory: z.enum(['Underweight', 'Healthy', 'Overweight', 'Obese']).describe("The user's BMI category."),
  targetWeightRange: z.string().describe("The healthy target weight range for the user in kg (e.g., '60kg - 75kg')."),
  targetCalories: z.number().describe("The recommended daily calorie intake, rounded to the nearest 50."),
});
export type GenerateDietaryTargetsOutput = z.infer<typeof GenerateDietaryTargetsOutputSchema>;

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

export const TextNoteSchema = z.object({
  id: z.string(),
  type: z.literal('textNote'),
  title: z.string(),
  content: z.string(),
  date: z.string(),
});
export type TextNote = z.infer<typeof TextNoteSchema>;


export const AnalyzeSymptomPatternInputSchema = z.object({
  symptom: z.string().describe("The recurring symptom being experienced by the user (e.g., 'Headache', 'Nausea', 'Back (Lower) pain')."),
  diagnosis: z.string().describe("The user's primary diagnosis (e.g., 'Renal Cell Carcinoma'). This may contain multiple conditions separated by commas."),
  medications: z.array(z.object({ name: z.string() })).describe("A list of medications the user is currently taking."),
  treatments: z.array(z.string()).describe("A list of active or recent treatment step titles (e.g., 'Chemotherapy', 'Partial Nephrectomy')."),
  painRemarks: z.array(z.string()).describe("A list of the user's own descriptions of the pain from the days it was logged."),
});
export type AnalyzeSymptomPatternInput = z.infer<typeof AnalyzeSymptomPatternInputSchema>;

export const AnalyzeSymptomPatternOutputSchema = z.object({
  analysis: z.string().describe("A markdown-formatted string detailing potential links between the symptom and the user's profile. Should start with a summary, then bullet points for each potential link found."),
});
export type AnalyzeSymptomPatternOutput = z.infer<typeof AnalyzeSymptomPatternOutputSchema>;

const FoodIntakeSchema = z.object({
    id: z.string(),
    title: z.string(),
    photoDataUri: z.string(),
    description: z.string(),
    calories: z.number(),
    ingredients: z.array(z.string()),
    dietaryWarning: z.string().optional(),
});

// This schema is for AI flows that need to process diary entries.
// It keeps the structure consistent and flexible.
export const DiaryEntrySchemaForAI = z.object({
    id: z.string(),
    date: z.string(),
    mood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable().optional(),
    diagnosisMood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable().optional(),
    treatmentMood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).nullable().optional(),
    painScore: z.number().nullable().optional(),
    painLocation: z.string().nullable().optional(),
    painRemarks: z.string().nullable().optional(),
    symptomAnalysis: z.string().nullable().optional(),
    weight: z.string().optional(),
    sleep: z.string().optional(),
    foodIntake: z.array(FoodIntakeSchema).optional(),
    food: z.string().optional(), // For backward compatibility
    worriedAbout: z.string().optional(),
    positiveAbout: z.string().optional(),
    notes: z.string().optional(),
    medsTaken: z.array(z.object({
        id: z.string(),
        name: z.string(),
        time: z.string(),
        quantity: z.number(),
        isPrescribed: z.boolean(),
    })).optional(),
});
export type DiaryEntryForAI = z.infer<typeof DiaryEntrySchemaForAI>;

export const MeetingNoteSchema = z.object({
    id: z.string(),
    type: z.literal('meetingNote'),
    date: z.string(),
    location: z.enum(['in-person', 'phone', 'video-call']),
    attendees: z.array(z.string()),
    subject: z.string(),
    notes: z.string(),
    actions: z.array(z.object({
        id: z.string(),
        description: z.string(),
        assignedTo: z.array(z.string()),
        dueDate: z.string().nullable(),
        priority: z.enum(['low', 'medium', 'high']),
    })).optional(),
});
export type MeetingNote = z.infer<typeof MeetingNoteSchema>;


// Schema for the individual report sections
export const ReportSectionSchema = z.object({
    personalDetails: z.string().optional().describe("Markdown content for the 'Personal Details' section."),
    medicalTeam: z.string().optional().describe("Markdown content for the 'Medical Team & Contacts' section."),
    diagnosisSummary: z.string().optional().describe("Markdown content for the 'Diagnosis & Condition Summary' section."),
    currentMedications: z.string().optional().describe("Markdown content for the 'Current Medications' section."),
    wellnessInsights: z.string().optional().describe("Markdown content for the 'Wellness & Diary Insights' section."),
    timelineMilestones: z.string().optional().describe("Markdown content for the 'Timeline & Milestones' section."),
    financialSummary: z.string().optional().describe("Markdown content for the 'Financial Summary' section."),
    potentialBenefits: z.string().optional().describe("Markdown content for the 'Potential Additional Benefits' section."),
    sources: z.string().optional().describe("Markdown content for the 'Sources' section.")
});

export type ReportSectionData = z.infer<typeof ReportSectionSchema>;

export const PersonalSummaryOutputSchema = ReportSectionSchema.extend({
    updatedDiagnosis: z.string().describe("The latest, most specific diagnosis found in the source documents or conversations."),
});

export type PersonalSummaryOutput = z.infer<typeof PersonalSummaryOutputSchema>;


// Schemas for Shopping List
const MealInputSchema = z.object({
  name: z.string().describe("The name of the meal."),
  ingredients: z.array(z.string()).describe("A list of ingredients for the meal."),
});

export const GenerateShoppingListInputSchema = z.object({
  meals: z.array(MealInputSchema).describe("A list of meals to generate a shopping list for."),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;


const ShoppingListItemSchema = z.object({
  name: z.string().describe("The name of the ingredient."),
  quantity: z.string().describe("The consolidated quantity needed (e.g., '2', '500g', '1 bunch')."),
  estimatedCost: z.number().describe("An estimated cost for the item in GBP (£)."),
});

const ShoppingListCategorySchema = z.object({
    category: z.string().describe("The category name (e.g., 'Produce', 'Meat & Fish', 'Dairy & Eggs', 'Pantry')."),
    items: z.array(ShoppingListItemSchema).describe("A list of items in this category."),
});

export const GenerateShoppingListOutputSchema = z.object({
    list: z.array(ShoppingListCategorySchema).describe("The categorized shopping list."),
    totalEstimatedCost: z.number().describe("The total estimated cost for all items on the list in GBP (£).")
});
export type GenerateShoppingListOutput = z.infer<typeof GenerateShoppingListOutputSchema>;

// Re-exporting the dietary targets schema to be used in other places
export type { GenerateDietaryTargetsOutput } from './generate-dietary-targets';
export { GenerateDietaryTargetsOutputSchema };
    