'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-conversation-summary.ts';
import '@/ai/flows/analyze-medical-document.ts';
import '@/ai/flows/conversational-support.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/services/postcode-lookup.ts';
