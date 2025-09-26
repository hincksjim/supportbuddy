import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      location: 'europe-west1',
    }),
  ],
  defaultModel: 'googleai/gemini-1.5-flash',
  logLevel: 'debug',
  enableTracing: true,
});
