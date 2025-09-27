import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1',
      location: 'europe-west1',
    }),
  ],
  defaultModel: 'googleai/gemini-1.5-flash-latest',
  logLevel: 'debug',
  enableTracing: true,
});
