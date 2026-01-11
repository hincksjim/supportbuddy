
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  defaultModel: 'googleai/gemini-2.5-flash',
  logLevel: 'debug',
  enableTracing: true,
});
