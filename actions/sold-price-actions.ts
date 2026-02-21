"use server";

import { ActionResult } from "@/types/actions/actions-types";
import { fetchSoldPriceData, type SoldPriceFilters } from "@/utils/fetchSoldPrice";
import { SelectSoldPriceData } from "@/db/schema/sold-price-data-schema";
import { validateAddressAction } from "@/actions/address-autocomplete-actions";

export interface SoldPriceDataResult {
  transactions: Omit<SelectSoldPriceData, 'id' | 'createdAt' | 'updatedAt'>[];
  summary: {
    totalTransactions: number;
    averagePrice: number;
    medianPrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    mostRecentDate: string;
    oldestDate: string;
  };
  filters: SoldPriceFilters;
}

/**
 * Main server action to get sold price data for a postcode with filters
 */
export async function getSoldPriceDataAction(
  postcode: string,
  filters: SoldPriceFilters = {}
): Promise<ActionResult<SoldPriceDataResult>> {
  try {
    // Validate inputs
    if (!postcode || postcode.trim().length === 0) {
      return {
        isSuccess: false,
        message: "Postcode is required"
      };
    }

    const trimmedPostcode = postcode.trim().toUpperCase();

    // Basic UK postcode format validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$|^[A-Z]{1,2}[0-9][A-Z0-9]?$/i;
    if (!postcodeRegex.test(trimmedPostcode)) {
      return {
        isSuccess: false,
        message: "Please enter a valid UK postcode"
      };
    }

    // Validate date filters if provided
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (startDate >= endDate) {
        return {
          isSuccess: false,
          message: "Start date must be before end date"
        };
      }

      // Check if dates are not too far in the future
      const currentDate = new Date();
      if (startDate > currentDate || endDate > currentDate) {
        return {
          isSuccess: false,
          message: "Dates cannot be in the future"
        };
      }
    }

    // Validate price filters
    if (filters.minPrice !== undefined && filters.minPrice < 0) {
      return {
        isSuccess: false,
        message: "Minimum price cannot be negative"
      };
    }

    if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
      return {
        isSuccess: false,
        message: "Maximum price cannot be negative"
      };
    }

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice >= filters.maxPrice) {
      return {
        isSuccess: false,
        message: "Minimum price must be less than maximum price"
      };
    }

    console.log(`Fetching sold price data for postcode: ${trimmedPostcode}`, filters);

    // Fetch the sold price data
    const transactions = await fetchSoldPriceData(trimmedPostcode, filters);

    if (transactions.length === 0) {
      return {
        isSuccess: true,
        message: "No sold price data found for this postcode with the specified filters",
        data: {
          transactions: [],
          summary: {
            totalTransactions: 0,
            averagePrice: 0,
            medianPrice: 0,
            priceRange: { min: 0, max: 0 },
            mostRecentDate: '',
            oldestDate: ''
          },
          filters
        }
      };
    }

    // Calculate summary statistics
    const prices = transactions.map(t => parseFloat(t.amount)).sort((a, b) => a - b);
    const dates = transactions.map(t => new Date(t.transactionDate)).sort((a, b) => b.getTime() - a.getTime());
    
    const totalTransactions = transactions.length;
    const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    const medianPrice = prices.length % 2 === 0
      ? Math.round((prices[Math.floor(prices.length / 2) - 1] + prices[Math.floor(prices.length / 2)]) / 2)
      : prices[Math.floor(prices.length / 2)];
    
    const summary = {
      totalTransactions,
      averagePrice,
      medianPrice,
      priceRange: {
        min: prices[0],
        max: prices[prices.length - 1]
      },
      mostRecentDate: dates[0].toISOString().split('T')[0],
      oldestDate: dates[dates.length - 1].toISOString().split('T')[0]
    };

    console.log(`Found ${totalTransactions} transactions for ${trimmedPostcode}`);
    console.log(`Price range: £${summary.priceRange.min.toLocaleString()} - £${summary.priceRange.max.toLocaleString()}`);
    console.log(`Average: £${summary.averagePrice.toLocaleString()}, Median: £${summary.medianPrice.toLocaleString()}`);

    return {
      isSuccess: true,
      message: `Found ${totalTransactions} transactions for ${trimmedPostcode}`,
      data: {
        transactions,
        summary,
        filters
      }
    };

  } catch (error) {
    console.error("Error in getSoldPriceDataAction:", error);
    
    if (error instanceof Error) {
      return {
        isSuccess: false,
        message: error.message
      };
    }
    
    return {
      isSuccess: false,
      message: "An unexpected error occurred while fetching sold price data"
    };
  }
}

/**
 * Get summary statistics for a postcode without detailed transaction data
 * Useful for quick overview or dashboard displays
 */
export async function getSoldPriceSummaryAction(
  postcode: string,
  filters: SoldPriceFilters = {}
): Promise<ActionResult<SoldPriceDataResult['summary']>> {
  try {
    const result = await getSoldPriceDataAction(postcode, filters);
    
    if (!result.isSuccess || !result.data) {
      return {
        isSuccess: result.isSuccess,
        message: result.message
      };
    }

    return {
      isSuccess: true,
      message: result.message,
      data: result.data.summary
    };

  } catch (error) {
    console.error("Error in getSoldPriceSummaryAction:", error);
    return {
      isSuccess: false,
      message: "Failed to fetch sold price summary"
    };
  }
}

/**
 * Validate postcode format and check if it exists
 * Can be used before making expensive sold price queries
 */
export async function validatePostcodeAction(postcode: string): Promise<ActionResult<{ isValid: boolean; normalizedPostcode: string }>> {
  try {
    if (!postcode || postcode.trim().length === 0) {
      return {
        isSuccess: false,
        message: "Postcode is required"
      };
    }

    const trimmedPostcode = postcode.trim().toUpperCase();
    
    // Basic UK postcode format validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$|^[A-Z]{1,2}[0-9][A-Z0-9]?$/i;
    const isValidFormat = postcodeRegex.test(trimmedPostcode);
    
    if (!isValidFormat) {
      return {
        isSuccess: true,
        message: "Invalid postcode format",
        data: {
          isValid: false,
          normalizedPostcode: trimmedPostcode
        }
      };
    }

    // Normalize postcode format (ensure space between outcode and incode)
    let normalizedPostcode = trimmedPostcode;
    if (normalizedPostcode.length > 5 && !normalizedPostcode.includes(' ')) {
      // Insert space before last 3 characters if it's a full postcode
      const outcodeLength = normalizedPostcode.length - 3;
      normalizedPostcode = normalizedPostcode.substring(0, outcodeLength) + ' ' + normalizedPostcode.substring(outcodeLength);
    }

    return {
      isSuccess: true,
      message: "Postcode is valid",
      data: {
        isValid: true,
        normalizedPostcode
      }
    };

  } catch (error) {
    console.error("Error in validatePostcodeAction:", error);
    return {
      isSuccess: false,
      message: "Failed to validate postcode"
    };
  }
}

/**
 * Get available property types for filtering
 */
export async function getPropertyTypesAction(): Promise<ActionResult<Array<{ value: string; label: string }>>> {
  try {
    const propertyTypes = [
      { value: 'D', label: 'Detached' },
      { value: 'S', label: 'Semi-Detached' },
      { value: 'T', label: 'Terraced' },
      { value: 'F', label: 'Flats/Maisonettes' },
      { value: 'O', label: 'Other' }
    ];

    return {
      isSuccess: true,
      message: "Property types retrieved successfully",
      data: propertyTypes
    };
  } catch (error) {
    console.error("Error in getPropertyTypesAction:", error);
    return {
      isSuccess: false,
      message: "Failed to get property types"
    };
  }
}