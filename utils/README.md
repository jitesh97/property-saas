# Utility Functions

## Land Registry Integration (`fetchSoldPrice.ts`)

This module provides integration with the UK Land Registry Price Paid Data using their official SPARQL endpoint.

### Features

- **Real API Integration**: Uses the official Land Registry SPARQL endpoint at `https://landregistry.data.gov.uk/landregistry/query`
- **Robust Postcode Validation**: Implements UK postcode format validation with regex patterns
- **Comprehensive Filtering**: Supports date ranges, price ranges, property types, and categories
- **Mock Data Mode**: Generates realistic test data for development
- **Error Handling**: Comprehensive error handling with meaningful messages
- **TypeScript Support**: Fully typed with proper interfaces

### Configuration

Set environment variable `USE_MOCK_DATA=false` in your `.env.local` to enable real Land Registry API calls.

**WARNING**: Real API calls may be slow (30-60 seconds) and subject to rate limits. Use mock data for development.

### SPARQL Query Structure

The implementation uses a SPARQL query based on the Land Registry's RDF ontology:

- **Prefixes**: Standard RDF prefixes plus Land Registry specific ones
- **Data Selection**: Property address, price, date, category, property type, and estate type
- **Filtering**: Date ranges and price ranges applied at query level
- **Ordering**: Results ordered by transaction date (newest first)
- **Limits**: Maximum 1000 results per query

### Usage

```typescript
import { fetchSoldPriceData } from '@/utils/fetchSoldPrice';

const results = await fetchSoldPriceData('SW1A 1AA', {
  startDate: '2023-01-01',
  endDate: '2024-01-01',
  minPrice: 100000,
  maxPrice: 1000000,
  propertyType: 'D', // Detached
  category: 'A'      // Standard Price
});
```

### Data Transformation

Raw SPARQL results are transformed to match our database schema:

- Property types: `Detached` → `D`, `Semi-Detached` → `S`, etc.
- Estate types: `Freehold` → `F`, `Leasehold` → `L`  
- Categories: `Standard Price Paid` → `A`, `Additional Price Paid` → `B`
- Dates: ISO format → `YYYY-MM-DD`
- Addresses: Split into components (PAON, SAON, street, town, county)

### Mock Data Generation

When `USE_MOCK_DATA=true`, the system generates realistic mock transactions with:

- Property type distribution matching UK housing stock
- Realistic price ranges based on property type
- Random transaction dates within specified ranges
- Proper UK address formatting
- Varied estate types and categories