import { SelectSoldPriceData } from "@/db/schema/sold-price-data-schema";

// Land Registry SPARQL API types
interface SPARQLBinding {
  type: string;
  value: string;
  datatype?: string;
}

interface SPARQLResult {
  paon?: SPARQLBinding;
  saon?: SPARQLBinding;
  street?: SPARQLBinding;
  locality?: SPARQLBinding;
  town?: SPARQLBinding;
  district?: SPARQLBinding;
  county?: SPARQLBinding;
  postcode?: SPARQLBinding;
  amount?: SPARQLBinding;
  date?: SPARQLBinding;
  category?: SPARQLBinding;
  propertyTypeLabel?: SPARQLBinding;
  propertyType?: SPARQLBinding;
  newBuild?: SPARQLBinding;
  duration?: SPARQLBinding;
}

interface SPARQLResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: SPARQLResult[];
  };
}

// Filter parameters interface
export interface SoldPriceFilters {
  startDate?: string;
  endDate?: string;
  propertyType?: 'D' | 'S' | 'T' | 'F' | 'O'; // Detached, Semi-Detached, Terraced, Flat, Other
  estateType?: 'F' | 'L'; // Freehold or Leasehold
  minPrice?: number;
  maxPrice?: number;
  category?: 'A' | 'B'; // Standard or Additional price
}

// Property type mapping from Land Registry labels to our schema
const PROPERTY_TYPE_MAP: Record<string, 'D' | 'S' | 'T' | 'F' | 'O'> = {
  'Detached': 'D',
  'Semi-Detached': 'S', 
  'Terraced': 'T',
  'Flat/Maisonette': 'F',
  'Other': 'O',
  // Alternative mappings
  'detached': 'D',
  'semi-detached': 'S',
  'terraced': 'T',
  'flat': 'F',
  'maisonette': 'F',
  'other': 'O'
};

// Estate type mapping from duration labels
const ESTATE_TYPE_MAP: Record<string, 'F' | 'L'> = {
  'Freehold': 'F',
  'Leasehold': 'L',
  'freehold': 'F',
  'leasehold': 'L'
};

// Category mapping from Land Registry category labels
const CATEGORY_MAP: Record<string, 'A' | 'B'> = {
  'Standard Price Paid': 'A',
  'Additional Price Paid': 'B',
  'standard price paid': 'A',
  'additional price paid': 'B'
};

/**
 * Normalize and clean postcode format
 */
function normalizePostcode(postcode: string): string {
  return postcode.toUpperCase().replace(/\s+/g, ' ').trim();
}

/**
 * Convert SPARQL results to our schema format
 */
function transformSPARQLResults(results: SPARQLResult[]): Omit<SelectSoldPriceData, 'id' | 'createdAt' | 'updatedAt'>[] {
  return results
    .filter(item => 
      item.amount?.value && // Has price
      item.postcode?.value && // Has postcode
      item.date?.value && // Has transaction date
      parseFloat(item.amount.value) > 0 // Valid price
    )
    .map(item => {
      // Extract property type from the propertyTypeLabel
      const propertyTypeLabel = item.propertyTypeLabel?.value || '';
      const propertyType = PROPERTY_TYPE_MAP[propertyTypeLabel] || 
                          PROPERTY_TYPE_MAP[propertyTypeLabel.toLowerCase()] || 'O';
      
      // Extract estate type from duration if available
      const durationLabel = item.duration?.value || '';
      const estateType = durationLabel ? (ESTATE_TYPE_MAP[durationLabel] || 
                        ESTATE_TYPE_MAP[durationLabel.toLowerCase()] || null) : null;
      
      // Extract category
      const categoryLabel = item.category?.value || '';
      const category = CATEGORY_MAP[categoryLabel] || 
                      CATEGORY_MAP[categoryLabel.toLowerCase()] || 'A';

      return {
        postcode: normalizePostcode(item.postcode!.value),
        addressLine1: item.paon?.value || null,
        addressLine2: item.saon?.value || null, 
        street: item.street?.value || null,
        locality: item.locality?.value || null,
        town: item.town?.value || null,
        district: item.district?.value || null,
        county: item.county?.value || null,
        amount: item.amount!.value,
        transactionDate: item.date!.value.split('T')[0], // Convert ISO date to YYYY-MM-DD
        transactionId: null,
        category,
        propertyType,
        estateType,
        newBuild: null, // Not available in basic SPARQL query
      };
    });
}

/**
 * Format UK postcode using regex validation (from your Python example)
 */
function formatUKPostcode(postcode: string): string {
  const cleanedPostcode = postcode.replace(/\s/g, '').toUpperCase();
  
  // UK postcode regex pattern (from your Python example)
  const postcodePattern = /^(GIR0AA|([A-Z]{1,2}[0-9R][0-9A-Z]?)([0-9][ABD-HJLNP-UW-Z]{2}))$/;
  const match = cleanedPostcode.match(postcodePattern);
  
  if (!match) {
    throw new Error('Invalid UK postcode format');
  }
  
  if (match[1] === 'GIR0AA') {
    return 'GIR 0AA';
  }
  
  const outward = match[2];
  const inward = match[3];
  return `${outward} ${inward}`;
}

/**
 * Build SPARQL query for Land Registry Price Paid Data
 */
function buildSPARQLQuery(postcode: string, filters: SoldPriceFilters = {}): string {
  const formattedPostcode = formatUKPostcode(postcode);
  
  let sparqlQuery = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX sr: <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/>
PREFIX ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>
PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>

SELECT ?paon ?saon ?street ?locality ?town ?district ?county ?postcode ?amount ?date ?category ?propertyTypeLabel ?duration
WHERE
{
  VALUES ?postcode {"${formattedPostcode}"^^xsd:string}
  
  ?addr lrcommon:postcode ?postcode.
  
  ?transx lrppi:propertyAddress ?addr ;
          lrppi:pricePaid ?amount ;
          lrppi:transactionDate ?date ;
          lrppi:transactionCategory/skos:prefLabel ?category;
          lrppi:propertyType ?propertyType.
          
  OPTIONAL {?addr lrcommon:county ?county}
  OPTIONAL {?addr lrcommon:paon ?paon}
  OPTIONAL {?addr lrcommon:saon ?saon}
  OPTIONAL {?addr lrcommon:street ?street}
  OPTIONAL {?addr lrcommon:locality ?locality}
  OPTIONAL {?addr lrcommon:town ?town}
  OPTIONAL {?addr lrcommon:district ?district}
  OPTIONAL {?transx lrppi:estateType/skos:prefLabel ?duration}
  
  ?propertyType rdfs:label ?propertyTypeLabel.`;

  // Add date filters if provided
  if (filters.startDate) {
    sparqlQuery += `
  FILTER(?date >= "${filters.startDate}"^^xsd:date)`;
  }
  
  if (filters.endDate) {
    sparqlQuery += `
  FILTER(?date <= "${filters.endDate}"^^xsd:date)`;
  }
  
  // Add price filters if provided
  if (filters.minPrice) {
    sparqlQuery += `
  FILTER(?amount >= ${filters.minPrice})`;
  }
  
  if (filters.maxPrice) {
    sparqlQuery += `
  FILTER(?amount <= ${filters.maxPrice})`;
  }

  sparqlQuery += `
}
ORDER BY DESC(?date) ?amount
LIMIT 1000`;

  return sparqlQuery;
}

/**
 * Execute SPARQL query against Land Registry endpoint
 */
async function executeSPARQLQuery(sparqlQuery: string): Promise<SPARQLResult[]> {
  const endpointUrl = 'https://landregistry.data.gov.uk/landregistry/query';
  
  console.log('Executing SPARQL query:', sparqlQuery.substring(0, 200) + '...');
  
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      'Accept': 'application/json',
      'User-Agent': 'Property-SaaS/1.0',
    },
    body: sparqlQuery,
    // Add timeout
    signal: AbortSignal.timeout(60000), // 60 second timeout for SPARQL queries
  });

  if (!response.ok) {
    throw new Error(`Land Registry SPARQL endpoint error: ${response.status} ${response.statusText}`);
  }

  const data: SPARQLResponse = await response.json();
  
  if (!data.results || !data.results.bindings) {
    throw new Error('Invalid SPARQL response format');
  }

  return data.results.bindings;
}

/**
 * Fetch sold price data from Land Registry SPARQL endpoint
 */
export async function fetchSoldPriceData(
  postcode: string, 
  filters: SoldPriceFilters = {}
): Promise<Omit<SelectSoldPriceData, 'id' | 'createdAt' | 'updatedAt'>[]> {
  
  // Development mode: Return mock data (can be toggled)
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA !== 'false') {
    console.log(`🚧 DEVELOPMENT MODE: Generating mock sold price data for ${postcode}`);
    return generateMockSoldPriceData(postcode, filters);
  }

  try {
    // Validate and format postcode
    let formattedPostcode: string;
    try {
      formattedPostcode = formatUKPostcode(postcode);
    } catch (error) {
      throw new Error(`Invalid postcode format: ${postcode}`);
    }
    
    // Build and execute SPARQL query
    const sparqlQuery = buildSPARQLQuery(formattedPostcode, filters);
    const sparqlResults = await executeSPARQLQuery(sparqlQuery);
    
    console.log(`Retrieved ${sparqlResults.length} raw results from Land Registry SPARQL endpoint`);
    
    // Transform SPARQL results to our schema
    let transformedData = transformSPARQLResults(sparqlResults);
    
    // Apply additional client-side filters that couldn't be done in SPARQL
    if (filters.propertyType) {
      transformedData = transformedData.filter(item => item.propertyType === filters.propertyType);
    }
    
    if (filters.estateType) {
      transformedData = transformedData.filter(item => item.estateType === filters.estateType);
    }
    
    if (filters.category) {
      transformedData = transformedData.filter(item => item.category === filters.category);
    }

    console.log(`Processed results: ${transformedData.length} transactions for ${formattedPostcode}`);
    
    return transformedData;
    
  } catch (error) {
    console.error('Error fetching sold price data:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Land Registry SPARQL endpoint took too long to respond');
      }
      
      // If it's a postcode format error, throw as-is
      if (error.message.includes('Invalid postcode format')) {
        throw error;
      }
      
      throw new Error(`Failed to fetch sold price data: ${error.message}`);
    }
    
    throw new Error('Unknown error occurred while fetching sold price data');
  }
}

/**
 * Generate mock sold price data for development and testing
 */
function generateMockSoldPriceData(
  postcode: string, 
  filters: SoldPriceFilters = {}
): Omit<SelectSoldPriceData, 'id' | 'createdAt' | 'updatedAt'>[] {
  
  const normalizedPostcode = normalizePostcode(postcode);
  const currentDate = new Date();
  const mockData: Omit<SelectSoldPriceData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  // Generate 15-30 mock transactions
  const numTransactions = Math.floor(Math.random() * 15) + 15;
  
  for (let i = 0; i < numTransactions; i++) {
    // Random date within last 3 years or within filter range
    let transactionDate: Date;
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      transactionDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    } else {
      const daysAgo = Math.floor(Math.random() * 1095); // 3 years
      transactionDate = new Date(currentDate);
      transactionDate.setDate(currentDate.getDate() - daysAgo);
    }
    
    // Random property types
    const propertyTypes: ('D' | 'S' | 'T' | 'F' | 'O')[] = ['D', 'S', 'T', 'F', 'O'];
    const propertyType = filters.propertyType || propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    
    // Price ranges based on property type
    const basePrices = { D: 450000, S: 320000, T: 280000, F: 220000, O: 350000 };
    const basePrice = basePrices[propertyType];
    const variation = 0.4; // ±40% variation
    const minPriceForType = Math.floor(basePrice * (1 - variation));
    const maxPriceForType = Math.floor(basePrice * (1 + variation));
    
    let price = Math.floor(Math.random() * (maxPriceForType - minPriceForType) + minPriceForType);
    
    // Apply price filters if specified
    if (filters.minPrice && price < filters.minPrice) continue;
    if (filters.maxPrice && price > filters.maxPrice) continue;
    
    // Round to nearest £5,000
    price = Math.round(price / 5000) * 5000;
    
    const category = filters.category || (Math.random() > 0.9 ? 'B' : 'A');
    
    // Generate address components
    const houseNumbers = [Math.floor(Math.random() * 200) + 1, `Flat ${Math.floor(Math.random() * 50) + 1}`];
    const streetNames = ['High Street', 'Church Lane', 'Victoria Road', 'Mill Lane', 'Oak Avenue', 'Kings Road', 'Queens Drive', 'Park View', 'Station Road', 'Manor Close'];
    
    const addressLine1 = Math.random() > 0.7 
      ? houseNumbers[1].toString()  // Flat number
      : houseNumbers[0].toString(); // House number
    
    const street = streetNames[Math.floor(Math.random() * streetNames.length)];
    
    mockData.push({
      postcode: normalizedPostcode,
      addressLine1,
      addressLine2: Math.random() > 0.8 ? `${Math.floor(Math.random() * 100) + 1} ${street}` : null,
      street,
      locality: Math.random() > 0.6 ? `${normalizedPostcode.split(' ')[0]} Area` : null,
      town: 'Sample Town',
      district: 'Sample District', 
      county: 'Sample County',
      amount: price.toString(),
      transactionDate: transactionDate.toISOString().split('T')[0], // YYYY-MM-DD format
      transactionId: null,
      category,
      propertyType,
      estateType: Math.random() > 0.3 ? 'F' : 'L',
      newBuild: Math.random() > 0.85 ? 'Y' : 'N',
    });
  }
  
  // Sort by transaction date (newest first)
  mockData.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  
  console.log(`Generated ${mockData.length} mock transactions for ${normalizedPostcode}`);
  
  return mockData;
}