
'use server';

/**
 * @fileOverview A service for looking up UK postcode information.
 */

import {ai} from '@/ai/genkit';
import axios from 'axios';
import {z} from 'zod';
import {googleSearch} from 'genkit/tools';

const PostcodeInfoSchema = z.object({
  city: z.string().describe('The city associated with the postcode.'),
  nhs_ha: z.string().describe('The Strategic Health Authority name.'),
  phoneNumber: z.string().optional().describe('The contact phone number for the health authority.'),
});

export const lookupPostcode = ai.defineTool(
  {
    name: 'lookupPostcode',
    description: 'Looks up information for a given UK postcode, such as city and local health authority, including the health authority\'s phone number.',
    inputSchema: z.object({
      postcode: z.string().describe('The UK postcode to look up.'),
    }),
    outputSchema: PostcodeInfoSchema,
    tools: [googleSearch],
  },
  async (input) => {
    try {
      const response = await axios.get(
        `https://api.postcodes.io/postcodes/${input.postcode}`
      );
      if (response.status === 200 && response.data.result) {
        const result = response.data.result;
        const nhsHa = result.nhs_ha || 'Unknown';
        
        let phoneNumber: string | undefined = undefined;
        if (nhsHa !== 'Unknown') {
            const searchResult = await googleSearch(
                `contact number for ${nhsHa}`
            );
            
            // A simple regex to find a plausible UK phone number from the search result.
            const phoneRegex = /(?:(?:\(?(?:0(?:0|11)\)?[\s-]?\(?|(\+)\d{1,4}\)?[\s-]?\(?(?:0\d|)\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}\s?\(?...\)?|\(?\d{2,6}\)?[\s-]?\d{3,4}[\s-]?\d{3,4})|.{0,4}?"S?"?d{4,6}["S"s]?\d{6,8}|"d{4,6}"s"d{6,8})/g;
            const match = searchResult.match(phoneRegex);
            if (match && match.length > 0) {
                // Find the most likely number - often the first one that looks like a standard UK number
                phoneNumber = match.find(m => /^(0\d{3,4}\s?\d{3}\s?\d{3}|0\d{9,10})$/.test(m.replace(/\s/g, '')));
            }
        }
        
        return {
          city: result.admin_district || result.region || 'Unknown',
          nhs_ha: nhsHa,
          phoneNumber: phoneNumber,
        };
      }
      throw new Error('Postcode not found or invalid.');
    } catch (error) {
      console.error('Postcode lookup failed:', error);
      // Fallback for invalid or not found postcodes
      return {
        city: 'Unknown',
        nhs_ha: 'Unknown',
        phoneNumber: undefined,
      };
    }
  }
);
