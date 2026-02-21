"use server";

import { ActionResult } from "@/types/actions/actions-types";

export interface AddressSuggestion {
  text: string;
  place_name: string;
  postcode?: string;
  type: 'postcode' | 'place';
  context?: Array<{
    id: string;
    text: string;
  }>;
}

// Check if the input looks like a postcode (UK format)
function isLikelyPostcode(query: string): boolean {
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  const partialPostcodeRegex = /^[A-Z]{1,2}[0-9]/i;
  return postcodeRegex.test(query) || partialPostcodeRegex.test(query);
}

async function getPostcodeSuggestions(query: string): Promise<AddressSuggestion[]> {
  try {
    const cleanQuery = query.toUpperCase().replace(/\s/g, '');
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanQuery}/autocomplete`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.result || !Array.isArray(data.result)) {
      return [];
    }

    return data.result.map((postcode: string) => ({
      text: postcode,
      place_name: postcode,
      postcode,
      type: 'postcode' as const,
      context: [
        {
          id: 'type',
          text: 'Postcode'
        }
      ]
    }));
  } catch (error) {
    console.error('Postcode autocomplete error:', error);
    return [];
  }
}

async function getPlaceSuggestions(query: string): Promise<AddressSuggestion[]> {
  try {
    const response = await fetch(`https://api.postcodes.io/places?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.result || !Array.isArray(data.result)) {
      return [];
    }

    return data.result.map((place: any) => ({
      text: place.name_1,
      place_name: `${place.name_1}, ${place.county_unitary || place.district_borough || 'UK'}`,
      type: 'place' as const,
      context: [
        {
          id: 'county',
          text: place.county_unitary || place.district_borough || ''
        },
        {
          id: 'country',
          text: place.country || 'United Kingdom'
        },
        {
          id: 'outcode',
          text: place.outcode || ''
        }
      ]
    }));
  } catch (error) {
    console.error('Place search error:', error);
    return [];
  }
}

export async function getAddressSuggestionsAction(query: string): Promise<ActionResult<AddressSuggestion[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return { 
        isSuccess: true, 
        message: "Query too short", 
        data: [] 
      };
    }

    const trimmedQuery = query.trim();
    let suggestions: AddressSuggestion[] = [];

    // If it looks like a postcode, prioritize postcode suggestions
    if (isLikelyPostcode(trimmedQuery)) {
      console.log(`Searching for postcode suggestions: ${trimmedQuery}`);
      const postcodeSuggestions = await getPostcodeSuggestions(trimmedQuery);
      suggestions.push(...postcodeSuggestions);
    }
    
    // Always search for place names unless we already have many postcode matches
    if (suggestions.length < 5) {
      console.log(`Searching for place suggestions: ${trimmedQuery}`);
      const placeSuggestions = await getPlaceSuggestions(trimmedQuery);
      suggestions.push(...placeSuggestions);
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.place_name === suggestion.place_name)
      )
      .slice(0, 10);

    console.log(`Found ${uniqueSuggestions.length} address suggestions for: ${trimmedQuery}`);

    return { 
      isSuccess: true, 
      message: "Address suggestions retrieved successfully", 
      data: uniqueSuggestions
    };

  } catch (error) {
    console.error('Address autocomplete error:', error);
    return { 
      isSuccess: false, 
      message: "Failed to fetch address suggestions",
      data: []
    };
  }
}

export async function validateAddressAction(address: string): Promise<ActionResult<boolean>> {
  try {
    if (!address || address.trim().length === 0) {
      return { 
        isSuccess: false, 
        message: "Address is required" 
      };
    }

    // Basic validation - check if address contains minimum required components
    const trimmedAddress = address.trim();
    const hasMinimumLength = trimmedAddress.length >= 5;
    const hasCommas = trimmedAddress.includes(',');
    
    if (!hasMinimumLength) {
      return { 
        isSuccess: false, 
        message: "Address is too short",
        data: false
      };
    }

    // For more robust validation, you could make another API call
    // to validate the specific address, but for now we'll do basic validation
    return { 
      isSuccess: true, 
      message: "Address is valid",
      data: true
    };

  } catch (error) {
    console.error('Address validation error:', error);
    return { 
      isSuccess: false, 
      message: "Failed to validate address",
      data: false
    };
  }
}