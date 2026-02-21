"use server";

import { ActionResult } from "@/types/actions/actions-types";

export interface EPCCertificate {
  lmkKey: string;
  address1: string;
  address2?: string;
  address3?: string;
  postcode: string;
  buildingReferenceNumber: string;
  currentEnergyRating: string;
  potentialEnergyRating: string;
  currentEnergyEfficiency: number;
  potentialEnergyEfficiency: number;
  propertyType: string;
  builtForm: string;
  construction_age_band?: string;
  inspectionDate: string;
  lodgementDate: string;
  transactionType: string;
  environment_impact_current: number;
  environment_impact_potential: number;
  energy_consumption_current: number;
  energy_consumption_potential: number;
  co2_emissions_current: number;
  co2_emissions_potential: number;
  lighting_cost_current: number;
  lighting_cost_potential: number;
  heating_cost_current: number;
  heating_cost_potential: number;
  hot_water_cost_current: number;
  hot_water_cost_potential: number;
  total_floor_area: number;
  energy_tariff: string;
  mains_gas_flag: string;
  floor_level: number;
  flat_top_storey: string;
  flat_storey_count: number;
  main_heating_controls: string;
  multi_glaze_proportion: number;
  glazed_type: string;
  glazed_area: string;
  extension_count: number;
  number_habitable_rooms: number;
  number_heated_rooms: number;
  low_energy_lighting: number;
  number_open_fireplaces: number;
  hotwater_description: string;
  hot_water_energy_eff: string;
  hot_water_env_eff: string;
  floor_description: string;
  floor_energy_eff: string;
  floor_env_eff: string;
  windows_description: string;
  windows_energy_eff: string;
  windows_env_eff: string;
  walls_description: string;
  walls_energy_eff: string;
  walls_env_eff: string;
  secondheat_description?: string;
  sheating_energy_eff?: string;
  sheating_env_eff?: string;
  roof_description: string;
  roof_energy_eff: string;
  roof_env_eff: string;
  mainheat_description: string;
  mainheat_energy_eff: string;
  mainheat_env_eff: string;
  mainheatcont_description: string;
  mainheatc_energy_eff: string;
  mainheatc_env_eff: string;
  lighting_description: string;
  lighting_energy_eff: string;
  lighting_env_eff: string;
  main_fuel: string;
  wind_turbine_count: number;
  heat_loss_corridor: string;
  unheated_corridor_length: number;
  floor_height: number;
  photo_supply: number;
  solar_water_heating_flag: string;
  mechanical_ventilation: string;
  address: string;
  local_authority_label: string;
  constituency_label: string;
  county: string;
  lodgement_datetime: string;
  tenure: string;
  fixed_lighting_outlets_count: number;
  low_energy_fixed_light_count: number;
}

export interface EPCSearchResult {
  certificates: EPCCertificate[];
  totalResults: number;
}

/**
 * Base64 encode the EPC API credentials
 */
function getEPCAuthToken(): string {
  const email = process.env.EPC_OPENDATA_EMAIL;
  const apiKey = process.env.EPC_OPENDATA_KEY;
  
  if (!email || !apiKey) {
    throw new Error("EPC API credentials not configured");
  }
  
  const credentials = `${email}:${apiKey}`;
  return Buffer.from(credentials).toString('base64');
}

/**
 * Parse CSV response from EPC API
 */
function parseEPCCSV(csvData: string): EPCCertificate[] {
  const lines = csvData.trim().split('\n');
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const certificates: EPCCertificate[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Handle CSV parsing more carefully for quoted values
    const values = parseCSVLine(lines[i]);
    const certificate: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      // Map CSV headers to our interface properties
      const fieldMap: Record<string, string> = {
        'lmk-key': 'lmkKey',
        'current-energy-rating': 'currentEnergyRating',
        'potential-energy-rating': 'potentialEnergyRating',
        'current-energy-efficiency': 'currentEnergyEfficiency',
        'potential-energy-efficiency': 'potentialEnergyEfficiency',
        'property-type': 'propertyType',
        'built-form': 'builtForm',
        'construction-age-band': 'construction_age_band',
        'inspection-date': 'inspectionDate',
        'lodgement-date': 'lodgementDate',
        'transaction-type': 'transactionType',
        'environment-impact-current': 'environment_impact_current',
        'environment-impact-potential': 'environment_impact_potential',
        'energy-consumption-current': 'energy_consumption_current',
        'energy-consumption-potential': 'energy_consumption_potential',
        'co2-emissions-current': 'co2_emissions_current',
        'co2-emissions-potential': 'co2_emissions_potential',
        'lighting-cost-current': 'lighting_cost_current',
        'lighting-cost-potential': 'lighting_cost_potential',
        'heating-cost-current': 'heating_cost_current',
        'heating-cost-potential': 'heating_cost_potential',
        'hot-water-cost-current': 'hot_water_cost_current',
        'hot-water-cost-potential': 'hot_water_cost_potential',
        'total-floor-area': 'total_floor_area',
        'energy-tariff': 'energy_tariff',
        'mains-gas-flag': 'mains_gas_flag',
        'floor-level': 'floor_level',
        'flat-top-storey': 'flat_top_storey',
        'flat-storey-count': 'flat_storey_count',
        'main-heating-controls': 'main_heating_controls',
        'multi-glaze-proportion': 'multi_glaze_proportion',
        'glazed-type': 'glazed_type',
        'glazed-area': 'glazed_area',
        'extension-count': 'extension_count',
        'number-habitable-rooms': 'number_habitable_rooms',
        'number-heated-rooms': 'number_heated_rooms',
        'low-energy-lighting': 'low_energy_lighting',
        'number-open-fireplaces': 'number_open_fireplaces',
        'hotwater-description': 'hotwater_description',
        'hot-water-energy-eff': 'hot_water_energy_eff',
        'hot-water-env-eff': 'hot_water_env_eff',
        'floor-description': 'floor_description',
        'floor-energy-eff': 'floor_energy_eff',
        'floor-env-eff': 'floor_env_eff',
        'windows-description': 'windows_description',
        'windows-energy-eff': 'windows_energy_eff',
        'windows-env-eff': 'windows_env_eff',
        'walls-description': 'walls_description',
        'walls-energy-eff': 'walls_energy_eff',
        'walls-env-eff': 'walls_env_eff',
        'secondheat-description': 'secondheat_description',
        'sheating-energy-eff': 'sheating_energy_eff',
        'sheating-env-eff': 'sheating_env_eff',
        'roof-description': 'roof_description',
        'roof-energy-eff': 'roof_energy_eff',
        'roof-env-eff': 'roof_env_eff',
        'mainheat-description': 'mainheat_description',
        'mainheat-energy-eff': 'mainheat_energy_eff',
        'mainheat-env-eff': 'mainheat_env_eff',
        'mainheatcont-description': 'mainheatcont_description',
        'mainheatc-energy-eff': 'mainheatc_energy_eff',
        'mainheatc-env-eff': 'mainheatc_env_eff',
        'lighting-description': 'lighting_description',
        'lighting-energy-eff': 'lighting_energy_eff',
        'lighting-env-eff': 'lighting_env_eff',
        'main-fuel': 'main_fuel',
        'wind-turbine-count': 'wind_turbine_count',
        'heat-loss-corridor': 'heat_loss_corridor',
        'unheated-corridor-length': 'unheated_corridor_length',
        'floor-height': 'floor_height',
        'photo-supply': 'photo_supply',
        'solar-water-heating-flag': 'solar_water_heating_flag',
        'mechanical-ventilation': 'mechanical_ventilation',
        'local-authority-label': 'local_authority_label',
        'constituency-label': 'constituency_label',
        'lodgement-datetime': 'lodgement_datetime',
        'fixed-lighting-outlets-count': 'fixed_lighting_outlets_count',
        'low-energy-fixed-light-count': 'low_energy_fixed_light_count',
        'building-reference-number': 'buildingReferenceNumber'
      };

      const fieldName = fieldMap[header] || header.replace(/-/g, '_');
      
      // Convert numeric fields
      const numericFields = [
        'currentEnergyEfficiency', 'potentialEnergyEfficiency', 'environment_impact_current', 
        'environment_impact_potential', 'energy_consumption_current', 'energy_consumption_potential',
        'co2_emissions_current', 'co2_emissions_potential', 'lighting_cost_current', 'lighting_cost_potential',
        'heating_cost_current', 'heating_cost_potential', 'hot_water_cost_current', 'hot_water_cost_potential',
        'total_floor_area', 'floor_level', 'flat_storey_count', 'multi_glaze_proportion', 'extension_count',
        'number_habitable_rooms', 'number_heated_rooms', 'low_energy_lighting', 'number_open_fireplaces',
        'wind_turbine_count', 'unheated_corridor_length', 'floor_height', 'photo_supply',
        'fixed_lighting_outlets_count', 'low_energy_fixed_light_count'
      ];
      
      if (numericFields.includes(fieldName)) {
        certificate[fieldName] = value ? parseFloat(value) : 0;
      } else {
        certificate[fieldName] = value;
      }
    });
    
    certificates.push(certificate);
  }
  
  return certificates;
}

/**
 * Parse a single CSV line handling quoted values properly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Search for EPC certificates by postcode
 */
export async function getEPCByPostcodeAction(
  postcode: string,
  limit: number = 25
): Promise<ActionResult<EPCSearchResult>> {
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
    if (!postcodeRegex.test(trimmedPostcode)) {
      return {
        isSuccess: false,
        message: "Please enter a valid UK postcode"
      };
    }

    const authToken = getEPCAuthToken();
    const baseUrl = 'https://epc.opendatacommunities.org/api/v1/domestic/search';
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      postcode: trimmedPostcode,
      size: Math.min(limit, 5000).toString() // API max is 5000
    });

    const url = `${baseUrl}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'Authorization': `Basic ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          isSuccess: false,
          message: "EPC API authentication failed"
        };
      } else if (response.status === 404) {
        return {
          isSuccess: false,
          message: "No EPC certificates found for this postcode"
        };
      } else {
        return {
          isSuccess: false,
          message: `EPC API error: ${response.status} ${response.statusText}`
        };
      }
    }

    const csvData = await response.text();
    
    if (!csvData || csvData.trim() === '') {
      return {
        isSuccess: false,
        message: "No EPC data found for this postcode"
      };
    }

    console.log('Raw CSV data sample:', csvData.substring(0, 500));
    const certificates = parseEPCCSV(csvData);
    console.log('Parsed certificates sample:', certificates.slice(0, 2));
    
    return {
      isSuccess: true,
      data: {
        certificates,
        totalResults: certificates.length
      }
    };

  } catch (error) {
    console.error('EPC API error:', error);
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch EPC data"
    };
  }
}

/**
 * Search for EPC certificates by address
 */
export async function getEPCByAddressAction(
  address: string,
  limit: number = 25
): Promise<ActionResult<EPCSearchResult>> {
  try {
    if (!address || address.trim().length === 0) {
      return {
        isSuccess: false,
        message: "Address is required"
      };
    }

    const trimmedAddress = address.trim();
    const authToken = getEPCAuthToken();
    const baseUrl = 'https://epc.opendatacommunities.org/api/v1/domestic/search';
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      address: trimmedAddress,
      size: Math.min(limit, 5000).toString() // API max is 5000
    });

    const url = `${baseUrl}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'Authorization': `Basic ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          isSuccess: false,
          message: "EPC API authentication failed"
        };
      } else if (response.status === 404) {
        return {
          isSuccess: false,
          message: "No EPC certificates found for this address"
        };
      } else {
        return {
          isSuccess: false,
          message: `EPC API error: ${response.status} ${response.statusText}`
        };
      }
    }

    const csvData = await response.text();
    
    if (!csvData || csvData.trim() === '') {
      return {
        isSuccess: false,
        message: "No EPC data found for this address"
      };
    }

    console.log('Raw CSV data sample (address search):', csvData.substring(0, 500));
    const certificates = parseEPCCSV(csvData);
    console.log('Parsed certificates sample (address search):', certificates.slice(0, 2));
    
    return {
      isSuccess: true,
      data: {
        certificates,
        totalResults: certificates.length
      }
    };

  } catch (error) {
    console.error('EPC API error:', error);
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch EPC data"
    };
  }
}

