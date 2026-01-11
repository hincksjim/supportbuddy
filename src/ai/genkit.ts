import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1',
    }),
  ],
  defaultModel: 'googleai/gemini-pro',
  logLevel: 'debug',
  enableTracing: true,
});
