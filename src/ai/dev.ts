'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-conversation-summary.ts';
import '@/ai/flows/analyze-medical-document.ts';
import '@/ai/flows/conversational-support.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/summarize-voice-note.ts';
import '@/ai/flows/generate-treatment-timeline.ts';
import '@/ai/flows/generate-personal-summary.ts';
import '@/ai/flows/generate-benefits-suggestion.ts';
import '@/services/postcode-lookup.ts';
import '@/ai/flows/generate-benefits-matrix.ts';
import '@/ai/flows/analyze-medication.ts';
import '@/ai/flows/check-medication-dose.ts';
import '@/ai/flows/analyze-medication-photo.ts';
import '@/ai/flows/analyze-symptom-pattern.ts';
import '@/ai/flows/generate-diary-summary.ts';
import '@/ai/flows/types.ts';
import '@/ai/flows/analyze-food-photo.ts';
import '@/ai/flows/analyze-food-ingredients.ts';
import '@/ai/flows/generate-dietary-recommendation.ts';
import '@/ai/flows/generate-shopping-list.ts';
import '@/ai/flows/generate-dietary-targets.ts';
import '@/ai/flows/analyze-food-description.ts';
