import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({location: 'europe-west1'})],
  defaultModel: 'gemini-1.5-flash',
  // By not specifying a global default model, Genkit will use the first model
  // from the first configured plugin. In this case, it will be the default
  // model from the googleAI plugin, which is now correctly scoped to 'europe-west1'.
  // This resolves the issue of requests being sent to us-central1.
});
