
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
import '@/ai/flows/check-medication-dose.ts';

