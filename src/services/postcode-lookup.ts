
'use server';

/**
 * @fileOverview A service for looking up UK postcode information.
 */

import { ai } from '@/ai/genkit';
import axios from 'axios';
import { z } from 'zod';

const PostcodeInfoSchema = z.object({
  city: z.string().describe('The city associated with the postcode.'),
  nhs_ha: z.string().describe('The Strategic Health Authority name.'),
});

export const lookupPostcode = ai.defineTool(
  {
    name: 'lookupPostcode',
    description: 'Looks up information for a given UK postcode, such as city and local health authority. After getting the health authority name, you should also perform a search to find the contact number for that authority.',
    inputSchema: z.object({
      postcode: z.string().describe('The UK postcode to look up.'),
    }),
    outputSchema: PostcodeInfoSchema,
  },
  async (input) => {
    try {
      const response = await axios.get(`https://api.postcodes.io/postcodes/${input.postcode}`);
      if (response.status === 200 && response.data.result) {
        const result = response.data.result;
        return {
          city: result.admin_district || result.region || 'Unknown',
          nhs_ha: result.nhs_ha || 'Unknown',
        };
      }
      throw new Error('Postcode not found or invalid.');
    } catch (error) {
      console.error('Postcode lookup failed:', error);
      // Fallback for invalid or not found postcodes
      return {
          city: 'Unknown',
          nhs_ha: 'Unknown'
      };
    }
  }
);

    