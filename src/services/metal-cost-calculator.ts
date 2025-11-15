/**
 * Service for calculating metal costs based on supplier and pricing rules.
 */
import { getLeesSupplierData, getIksanSupplierData, getIksanGoldPricing, getMetalRates } from '@/services/pricing-source';
import type { EnrichProductSpecificationsOutput } from '@/ai/flows/enrich-product-specifications';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface SupplierData {
  'Supplier Name'?: string;
  'MFG & Part #'?: string;
  'Part #2'?: string;
  [key: string]: any; // Allow additional properties
}

interface LeesDataItem {
  "Item Number": string;
  "Per Piece": number;
  [key: string]: any;
}

interface IksanDataItem {
  "SKU": string;
  "Weight": number;
  "Metal Price": number;
  "Labor Fee": number;
  "Labor Price": number;
  "Total Cost": number;
  [key: string]: any;
}

interface LookupResult {
  price: number | null;
  matchType: 'exact' | 'progressive' | 'substring' | 'multiple_matches' | 'no_match' | 'not_provided';
  processed: string;
  searchAttempts: number;
  error?: string;
}

interface IksanLookupResult {
  data: IksanDataItem | null;
  matchType: 'exact' | 'progressive' | 'substring' | 'multiple_matches' | 'no_match' | 'not_provided';
  processed: string;
  searchAttempts: number;
  error?: string;
}

interface CalculationResult {
  supplier: string;
  metalCost: number | null;
  calculationMethod: 'standard' | 'supplier_specific' | 'standard_fallback';
  details: Record<string, any>;
  errors: string[];
  isSuccess: boolean;
}

interface LookupDetails {
  original: string;
  processed: string;
  matchType: string;
  perPiecePrice: number | null;
  searchAttempts: number;
}

interface PurityDetails {
  original: string;
  processed: string;
  matchType: string;
  perPiecePrice: number | string;
}

interface WeightDetails {
  original: string;
  processed: number;
  matchType: string;
  perPiecePrice: string;
}

interface EarringLogic {
  detected: boolean;
  type?: string | null;
  note: string;
  multiplier?: number;
  doubledCost?: number;
  doubledMfgPrice?: number;
  doubledPart2Price?: number;
}

interface EnhancedCalculationDetails {
  rate?: string | number;
  weight?: number;
  baseCost?: number | null;
  earringLogic: EarringLogic;
  totalCost: number | null;
  mfgPartPrice?: number;
  part2Price?: number;
}

// Enhanced specifications interface to handle various input types
interface ProcessedSpecifications {
  metal_purity: string;
  metal_weight: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STANDARD_METAL_RATES: Record<string, number> = {
  '10k': 43,
  '14k': 60,
  '18k': 80,
  '950': 32, // Platinum
};

const ERROR_TYPES = {
  MULTIPLE_MATCHES: "Multiple items found - ambiguous match",
  NO_MATCH_FOUND: "No matching item found in dataset",
  MISSING_ATTRIBUTE: "Required attribute not provided",
  CALCULATION_ERROR: "Error in cost calculation",
  INVALID_SUPPLIER_DATA: "Invalid supplier data provided",
  INVALID_SPECIFICATIONS: "Invalid product specifications provided",
  INVALID_WEIGHT: "Invalid weight value",
  INVALID_PURITY: "Invalid purity value",
  MISSING_PRICING_DATA: "Missing pricing data for lookup"
} as const;

// ============================================================================
// EARRING LOGIC CONSTANTS AND FUNCTIONS
// ============================================================================

const EARRING_PATTERNS = [
  { type: "studs", pattern: /\bstud(s)?\b/i },
  { type: "earrings", pattern: /\bearring(s)?\b/i },
  { type: "hoops", pattern: /\bhoop(s)?\b/i },
  { type: "push_backings", pattern: /\bpush\s*back(ing)?s?\b/i }
];

/**
 * Detects if the product is an earring-related item that requires doubling the metal cost
 */
function detectEarringType(productData: any): { isEarring: boolean; type: string | null; note: string } {
  if (!productData || typeof productData !== 'object') {
    return { isEarring: false, type: null, note: "No product data available for earring detection" };
  }

  // Check common fields for earring patterns
  const fieldsToCheck = [
    productData.Title || '',
    productData.Description || '',
    productData.Category || '',
    productData.Type || '',
    productData.Name || ''
  ];

  const searchText = fieldsToCheck.join(' ').toLowerCase();

  for (const earringPattern of EARRING_PATTERNS) {
    if (earringPattern.pattern.test(searchText)) {
      return {
        isEarring: true,
        type: earringPattern.type,
        note: `Earring type detected: ${earringPattern.type}. Metal cost will be doubled for pair.`
      };
    }
  }

  return { isEarring: false, type: null, note: "Not an earring-related product" };
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

class MetalCostCalculationError extends Error {
  constructor(
    message: string, 
    public code: string, 
    public details?: any
  ) {
    super(message);
    this.name = 'MetalCostCalculationError';
  }
}

function createErrorResult(
  supplier: string, 
  errors: string[], 
  method: CalculationResult['calculationMethod'],
  details: Record<string, any> = {}
): CalculationResult {
  return {
    supplier,
    metalCost: null,
    calculationMethod: method,
    details,
    errors,
    isSuccess: false
  };
}

function createSuccessResult(
  supplier: string,
  metalCost: number,
  method: CalculationResult['calculationMethod'],
  details: Record<string, any> = {},
  warnings: string[] = []
): CalculationResult {
  return {
    supplier,
    metalCost,
    calculationMethod: method,
    details,
    errors: warnings,
    isSuccess: true
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateSpecifications(specs: EnrichProductSpecificationsOutput): string[] {
  const errors: string[] = [];
  
  if (!specs || typeof specs !== 'object') {
    errors.push('Product specifications must be an object');
    return errors;
  }
  
  if (!specs.metal_purity || typeof specs.metal_purity !== 'string') {
    errors.push('Metal purity is required and must be a string');
  }
  
  if (!specs.metal_weight) {
    errors.push('Metal weight is required');
  } else {
    const weight = parseFloat(String(specs.metal_weight));
    if (isNaN(weight) || weight <= 0) {
      errors.push('Metal weight must be a valid positive number');
    }
  }
  
  return errors;
}

function processSpecifications(specs: EnrichProductSpecificationsOutput): ProcessedSpecifications | null {
  const validationErrors = validateSpecifications(specs);
  if (validationErrors.length > 0) {
    return null;
  }

  const weight = parseFloat(String(specs.metal_weight));
  
  return {
    metal_purity: specs.metal_purity.trim(),
    metal_weight: weight
  };
}

function validateLeesData(data: SupplierData): string[] {
  const errors: string[] = [];
  const mfgPart = data["MFG & Part #"]?.trim() || "";
  const part2 = data["Part #2"]?.trim() || "";
  
  if (!mfgPart && !part2) {
    errors.push(`${ERROR_TYPES.MISSING_ATTRIBUTE}: Both MFG & Part # and Part #2 are missing.`);
  }
  
  return errors;
}

function validateSupplierData(data: SupplierData): string[] {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push(ERROR_TYPES.INVALID_SUPPLIER_DATA);
    return errors;
  }
  
  return errors;
}

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Safely access LEES_SUPPLIER_DATA with error handling
 */
function getLeesSupplierDataSafe(): LeesDataItem[] {
  try {
    const data = getLeesSupplierData();
    if (!data || !Array.isArray(data)) {
      console.warn('LEES_SUPPLIER_DATA is not available or not an array');
      return [];
    }
    return data as LeesDataItem[];
  } catch (error) {
    console.error('Error accessing LEES_SUPPLIER_DATA:', error);
    return [];
  }
}

/**
 * Looks up an item in Lee's supplier data using a 3-step algorithm.
 * @param partNumber The part number to look up.
 * @returns An object with price, match type, processed string, search attempts, and potential errors.
 */
function lookupLeesItem(partNumber: string): LookupResult {
  if (!partNumber || typeof partNumber !== 'string' || partNumber.trim() === '') {
    return { 
      price: null, 
      matchType: 'not_provided', 
      processed: '', 
      searchAttempts: 0 
    };
  }

  const leesData = getLeesSupplierDataSafe();
  if (leesData.length === 0) {
    return {
      price: null,
      matchType: 'no_match',
      processed: partNumber.trim(),
      searchAttempts: 0,
      error: ERROR_TYPES.MISSING_PRICING_DATA
    };
  }

  const searchItem = partNumber.trim();
  let attempts = 0;

  // Step 1: Exact Match
  attempts++;
  let match = leesData.find(item => 
    item["Item Number"] && item["Item Number"].trim() === searchItem
  );
  
  if (match && typeof match["Per Piece"] === 'number') {
    return { 
      price: match["Per Piece"], 
      matchType: 'exact', 
      processed: searchItem, 
      searchAttempts: attempts 
    };
  }

  // Step 2: Progressive Truncation
  let truncatedSearch = searchItem;
  while (truncatedSearch.includes('-')) {
    truncatedSearch = truncatedSearch.substring(0, truncatedSearch.lastIndexOf('-'));
    if (truncatedSearch.trim()) {
      attempts++;
      match = leesData.find(item => 
        item["Item Number"] && item["Item Number"].trim() === truncatedSearch
      );
      
      if (match && typeof match["Per Piece"] === 'number') {
        return { 
          price: match["Per Piece"], 
          matchType: 'progressive', 
          processed: truncatedSearch, 
          searchAttempts: attempts 
        };
      }
    }
  }

  // Step 3: Substring Match
  attempts++;
  const substringMatches = leesData.filter(item => 
    item["Item Number"] && 
    item["Item Number"].includes(searchItem) &&
    typeof item["Per Piece"] === 'number'
  );
  
  if (substringMatches.length === 1) {
    return { 
      price: substringMatches[0]["Per Piece"], 
      matchType: 'substring', 
      processed: searchItem, 
      searchAttempts: attempts 
    };
  }
  
  if (substringMatches.length > 1) {
    const errorMsg = `${ERROR_TYPES.MULTIPLE_MATCHES} for part: ${searchItem}`;
    return { 
      price: null, 
      matchType: 'multiple_matches', 
      processed: searchItem, 
      searchAttempts: attempts, 
      error: errorMsg 
    };
  }

  const notFoundMsg = `${ERROR_TYPES.NO_MATCH_FOUND} for part: ${searchItem}`;
  return { 
    price: null, 
    matchType: 'no_match', 
    processed: searchItem, 
    searchAttempts: attempts, 
    error: notFoundMsg 
  };
}

/**
 * Safely access IKSAN_SUPPLIER_DATA with error handling
 */
function getIksanSupplierDataSafe(): IksanDataItem[] {
  try {
    const data = getIksanSupplierData();
    if (!data || !Array.isArray(data)) {
      console.warn('IKSAN_SUPPLIER_DATA is not available or not an array');
      return [];
    }
    return data as IksanDataItem[];
  } catch (error) {
    console.error('Error accessing IKSAN_SUPPLIER_DATA:', error);
    return [];
  }
}

/**
 * Looks up an item in IKSAN supplier data using a 3-step algorithm (same as Lee's).
 * @param sku The SKU to look up (MFG & Part # or Part #2).
 * @returns An object with the complete data row or null, match type, processed string, search attempts, and potential errors.
 */
function lookupIksanItem(sku: string): IksanLookupResult {
  if (!sku || typeof sku !== 'string' || sku.trim() === '') {
    return { 
      data: null, 
      matchType: 'not_provided', 
      processed: '', 
      searchAttempts: 0 
    };
  }

  const iksanData = getIksanSupplierDataSafe();
  if (iksanData.length === 0) {
    return {
      data: null,
      matchType: 'no_match',
      processed: sku.trim(),
      searchAttempts: 0,
      error: ERROR_TYPES.MISSING_PRICING_DATA
    };
  }

  const searchSku = sku.trim();
  let attempts = 0;

  // Step 1: Exact Match
  attempts++;
  let match = iksanData.find(item => 
    item["SKU"] && item["SKU"].trim() === searchSku
  );
  
  if (match) {
    return { 
      data: match, 
      matchType: 'exact', 
      processed: searchSku, 
      searchAttempts: attempts 
    };
  }

  // Step 2: Progressive Truncation (remove from last hyphen backwards)
  let truncatedSearch = searchSku;
  while (truncatedSearch.includes('-')) {
    truncatedSearch = truncatedSearch.substring(0, truncatedSearch.lastIndexOf('-'));
    if (truncatedSearch.trim()) {
      attempts++;
      match = iksanData.find(item => 
        item["SKU"] && item["SKU"].trim() === truncatedSearch
      );
      
      if (match) {
        return { 
          data: match, 
          matchType: 'progressive', 
          processed: truncatedSearch, 
          searchAttempts: attempts 
        };
      }
    }
  }

  // Step 3: Substring Match
  attempts++;
  const substringMatches = iksanData.filter(item => 
    item["SKU"] && 
    item["SKU"].includes(searchSku)
  );
  
  if (substringMatches.length === 1) {
    return { 
      data: substringMatches[0], 
      matchType: 'substring', 
      processed: searchSku, 
      searchAttempts: attempts 
    };
  }
  
  if (substringMatches.length > 1) {
    const errorMsg = `${ERROR_TYPES.MULTIPLE_MATCHES} for SKU: ${searchSku}`;
    return { 
      data: null, 
      matchType: 'multiple_matches', 
      processed: searchSku, 
      searchAttempts: attempts, 
      error: errorMsg 
    };
  }

  const notFoundMsg = `${ERROR_TYPES.NO_MATCH_FOUND} for SKU: ${searchSku}`;
  return { 
    data: null, 
    matchType: 'no_match', 
    processed: searchSku, 
    searchAttempts: attempts, 
    error: notFoundMsg 
  };
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Lee's Manufacturing specific cost calculation.
 */
function calculateLeesCost(data: SupplierData, productData?: any): CalculationResult {
  const dataValidationErrors = validateSupplierData(data);
  if (dataValidationErrors.length > 0) {
    return createErrorResult(
      "Lee's Manufacturing",
      dataValidationErrors,
      'supplier_specific'
    );
  }

  const validationErrors = validateLeesData(data);
  if (validationErrors.length > 0) {
    return createErrorResult(
      "Lee's Manufacturing",
      validationErrors,
      'supplier_specific'
    );
  }

  const mfgPart = data["MFG & Part #"]?.trim() || "";
  const part2 = data["Part #2"]?.trim() || "";
  const errors: string[] = [];
  const details: Record<string, any> = {};

  // Lookup MFG & Part #
  const mfgPartResult = lookupLeesItem(mfgPart);
  details["mfg_and_part"] = {
    original: mfgPart,
    processed: mfgPartResult.processed,
    matchType: mfgPartResult.matchType,
    perPiecePrice: mfgPartResult.price,
    searchAttempts: mfgPartResult.searchAttempts
  } as LookupDetails;
  
  if (mfgPartResult.error) {
    errors.push(`MFG & Part #: ${mfgPartResult.error}`);
  }

  // Lookup Part #2
  const part2Result = lookupLeesItem(part2);
  details["part_2"] = {
    original: part2,
    processed: part2Result.processed,
    matchType: part2Result.matchType,
    perPiecePrice: part2Result.price,
    searchAttempts: part2Result.searchAttempts
  } as LookupDetails;
  
  if (part2Result.error) {
    errors.push(`Part #2: ${part2Result.error}`);
  }

  // Calculate total cost
  let metalCost: number | null = null;
  
  const mfgPrice = typeof mfgPartResult.price === 'number' ? mfgPartResult.price : 0;
  const part2Price = typeof part2Result.price === 'number' ? part2Result.price : 0;
  
  // At least one part must have a valid price
  if (mfgPartResult.price !== null || part2Result.price !== null) {
    const baseCost = mfgPrice + part2Price;
    
    // Check for earring logic
    const earringDetection = detectEarringType(productData);
    
    if (earringDetection.isEarring) {
      // Apply earring logic - double both parts individually
      const doubledMfgPrice = mfgPrice * 2;
      const doubledPart2Price = part2Price * 2;
      metalCost = doubledMfgPrice + doubledPart2Price;
      
      details.calculation = {
        mfgPartPrice: mfgPrice,
        part2Price: part2Price,
        baseCost: baseCost,
        earringLogic: {
          detected: true,
          type: earringDetection.type,
          note: earringDetection.note,
          doubledMfgPrice: doubledMfgPrice,
          doubledPart2Price: doubledPart2Price
        },
        totalCost: metalCost
      };
      
      // Add earring note to details
      details.earringLogic = earringDetection.note;
    } else {
      metalCost = baseCost;
      
      details.calculation = {
        mfgPartPrice: mfgPrice,
        part2Price: part2Price,
        earringLogic: {
          detected: false,
          note: earringDetection.note
        },
        totalCost: metalCost
      };
    }

    if (metalCost >= 0) { // Allow zero cost
      return createSuccessResult(
        "Lee's Manufacturing",
        metalCost,
        'supplier_specific',
        details,
        errors
      );
    }
  }

  // If we reach here, calculation failed - show what was not found
  // Generate breakdown showing lookup attempts
  const failureBreakdown: string[] = [];
  
  if (mfgPart) {
    if (mfgPartResult.price !== null) {
      failureBreakdown.push(`MFG & Part # (${mfgPart}): FOUND ($${mfgPartResult.price}) but calculation failed`);
    } else {
      failureBreakdown.push(`MFG & Part # (${mfgPart}): NOT FOUND [Attempts: ${mfgPartResult.searchAttempts}, Last: ${mfgPartResult.matchType}]`);
    }
  }
  
  if (part2) {
    if (part2Result.price !== null) {
      failureBreakdown.push(`Part #2 (${part2}): FOUND ($${part2Result.price}) but calculation failed`);
    } else {
      failureBreakdown.push(`Part #2 (${part2}): NOT FOUND [Attempts: ${part2Result.searchAttempts}, Last: ${part2Result.matchType}]`);
    }
  }
  
  if (!mfgPart && !part2) {
    failureBreakdown.push('No parts specified');
  }
  
  failureBreakdown.push('Total Cost: $0.00');
  
  details.calculation = {
    breakdown: failureBreakdown.join('\n'),
    mfgPartPrice: mfgPrice,
    part2Price: part2Price,
    totalCost: 0
  };

  if (errors.length === 0) {
    errors.push(ERROR_TYPES.CALCULATION_ERROR);
  }

  // Return as SUCCESS with $0 to prevent fallback
  return createSuccessResult(
    "Lee's Manufacturing",
    0,
    'supplier_specific',
    details,
    errors
  );
}

/**
 * Validates IKSAN supplier data
 */
function validateIksanData(data: SupplierData): string[] {
  const errors: string[] = [];
  const mfgPart = data["MFG & Part #"]?.trim() || "";
  const part2 = data["Part #2"]?.trim() || "";
  
  if (!mfgPart && !part2) {
    errors.push(`${ERROR_TYPES.MISSING_ATTRIBUTE}: Both MFG & Part # and Part #2 are missing.`);
  }
  
  return errors;
}

/**
 * IKSAN Jewelry Cooperative specific cost calculation.
 * Fetches pricing from IKSAN_SUPPLIER_DATA sheet and displays step-by-step breakdown.
 */
function calculateIksanCost(data: SupplierData, productData?: any): CalculationResult {
  const dataValidationErrors = validateSupplierData(data);
  if (dataValidationErrors.length > 0) {
    return createErrorResult(
      "IKSAN Jewelry Cooperative",
      dataValidationErrors,
      'supplier_specific'
    );
  }

  // Get gold pricing data from the IKSAN sheet
  const goldPricing = getIksanGoldPricing();

  // Don't fail early - we want to show which parts were not found
  const mfgPart = data["MFG & Part #"]?.trim() || "";
  const part2 = data["Part #2"]?.trim() || "";
  const errors: string[] = [];
  const details: Record<string, any> = {};

  // Add gold pricing to details
  if (goldPricing) {
    details["goldPricing"] = {
      todaysGold: goldPricing.todaysGold,
      goldOz: goldPricing.goldOz,
      goldGram: goldPricing.goldGram,
    };
  }

  // Lookup MFG & Part # in IKSAN data
  const mfgPartResult = lookupIksanItem(mfgPart);
  const mfgPartData = mfgPartResult.data;
  
  details["mfg_and_part"] = {
    original: mfgPart,
    processed: mfgPartResult.processed,
    matchType: mfgPartResult.matchType,
    searchAttempts: mfgPartResult.searchAttempts,
    sku: mfgPartData?.SKU || null,
    weight: mfgPartData?.Weight || null,
    metalPrice: mfgPartData?.["Metal Price"] || null,
    laborFee: mfgPartData?.["Labor Fee"] || null,
    laborPrice: mfgPartData?.["Labor Price"] || null,
    totalCost: mfgPartData?.["Total Cost"] || null,
  };
  
  if (mfgPartResult.error) {
    errors.push(`MFG & Part #: ${mfgPartResult.error}`);
  }

  // Lookup Part #2 in IKSAN data
  const part2Result = lookupIksanItem(part2);
  const part2Data = part2Result.data;
  
  details["part_2"] = {
    original: part2,
    processed: part2Result.processed,
    matchType: part2Result.matchType,
    searchAttempts: part2Result.searchAttempts,
    sku: part2Data?.SKU || null,
    weight: part2Data?.Weight || null,
    metalPrice: part2Data?.["Metal Price"] || null,
    laborFee: part2Data?.["Labor Fee"] || null,
    laborPrice: part2Data?.["Labor Price"] || null,
    totalCost: part2Data?.["Total Cost"] || null,
  };
  
  if (part2Result.error) {
    errors.push(`Part #2: ${part2Result.error}`);
  }

  // Calculate total cost by summing Total Cost from both parts
  let metalCost: number | null = null;
  
  const mfgTotalCost = typeof mfgPartData?.["Total Cost"] === 'number' ? mfgPartData["Total Cost"] : 0;
  const part2TotalCost = typeof part2Data?.["Total Cost"] === 'number' ? part2Data["Total Cost"] : 0;
  
  // At least one part must have valid data
  if (mfgPartData || part2Data) {
    const baseCost = mfgTotalCost + part2TotalCost;
    
    // Check for earring logic
    const earringDetection = detectEarringType(productData);
    
    if (earringDetection.isEarring) {
      // Apply earring logic - double both parts' total costs
      const doubledMfgCost = mfgTotalCost * 2;
      const doubledPart2Cost = part2TotalCost * 2;
      metalCost = doubledMfgCost + doubledPart2Cost;
      
      // Create detailed calculation breakdown
      const calculationBreakdown: string[] = [];
      
      if (mfgPartData) {
        calculationBreakdown.push(`MFG & Part # (${mfgPart}) [Match: ${mfgPartResult.matchType}, Attempts: ${mfgPartResult.searchAttempts}]:`);
        calculationBreakdown.push(`  SKU Found: ${mfgPartData.SKU}`);
        calculationBreakdown.push(`  Weight: ${mfgPartData.Weight || 'N/A'} g`);
        calculationBreakdown.push(`  Metal Price: $${mfgPartData["Metal Price"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Labor Fee: $${mfgPartData["Labor Fee"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Labor Price: $${mfgPartData["Labor Price"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Subtotal: $${mfgTotalCost.toFixed(2)}`);
        calculationBreakdown.push(`  Doubled (earring): $${doubledMfgCost.toFixed(2)}`);
      } else if (mfgPart) {
        calculationBreakdown.push(`MFG & Part # (${mfgPart}): NOT FOUND [Attempts: ${mfgPartResult.searchAttempts}]`);
      }
      
      if (part2Data) {
        calculationBreakdown.push(`Part #2 (${part2}) [Match: ${part2Result.matchType}, Attempts: ${part2Result.searchAttempts}]:`);
        calculationBreakdown.push(`  SKU Found: ${part2Data.SKU}`);
        calculationBreakdown.push(`  Weight: ${part2Data.Weight || 'N/A'} g`);
        calculationBreakdown.push(`  Metal Price: $${part2Data["Metal Price"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Labor Fee: $${part2Data["Labor Fee"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Labor Price: $${part2Data["Labor Price"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Subtotal: $${part2TotalCost.toFixed(2)}`);
        calculationBreakdown.push(`  Doubled (earring): $${doubledPart2Cost.toFixed(2)}`);
      } else if (part2) {
        calculationBreakdown.push(`Part #2 (${part2}): NOT FOUND [Attempts: ${part2Result.searchAttempts}]`);
      }
      
      calculationBreakdown.push(`Total Cost: $${metalCost.toFixed(2)}`);
      
      details.calculation = {
        mfgPartCost: mfgTotalCost,
        part2Cost: part2TotalCost,
        baseCost: baseCost,
        earringLogic: {
          detected: true,
          type: earringDetection.type,
          note: earringDetection.note,
          doubledMfgCost: doubledMfgCost,
          doubledPart2Cost: doubledPart2Cost,
          multiplier: 2
        },
        totalCost: metalCost,
        breakdown: calculationBreakdown.join('\n')
      };
      
      details.earringLogic = earringDetection.note;
    } else {
      metalCost = baseCost;
      
      // Create detailed calculation breakdown
      const calculationBreakdown: string[] = [];
      
      if (mfgPartData) {
        calculationBreakdown.push(`MFG & Part # (${mfgPart}) [Match: ${mfgPartResult.matchType}, Attempts: ${mfgPartResult.searchAttempts}]:`);
        calculationBreakdown.push(`  SKU Found: ${mfgPartData.SKU}`);
        calculationBreakdown.push(`  Weight: ${mfgPartData.Weight || 'N/A'} g`);
        calculationBreakdown.push(`  Metal Price: $${mfgPartData["Metal Price"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Labor Fee: $${mfgPartData["Labor Fee"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Labor Price: $${mfgPartData["Labor Price"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Subtotal: $${mfgTotalCost.toFixed(2)}`);
      } else if (mfgPart) {
        calculationBreakdown.push(`MFG & Part # (${mfgPart}): NOT FOUND [Attempts: ${mfgPartResult.searchAttempts}]`);
      }
      
      if (part2Data) {
        calculationBreakdown.push(`Part #2 (${part2}) [Match: ${part2Result.matchType}, Attempts: ${part2Result.searchAttempts}]:`);
        calculationBreakdown.push(`  SKU Found: ${part2Data.SKU}`);
        calculationBreakdown.push(`  Weight: ${part2Data.Weight || 'N/A'} g`);
        calculationBreakdown.push(`  Metal Price: $${part2Data["Metal Price"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Labor Fee: $${part2Data["Labor Fee"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Labor Price: $${part2Data["Labor Price"]?.toFixed(2) || 'N/A'}`);
        calculationBreakdown.push(`  Subtotal: $${part2TotalCost.toFixed(2)}`);
      } else if (part2) {
        calculationBreakdown.push(`Part #2 (${part2}): NOT FOUND [Attempts: ${part2Result.searchAttempts}]`);
      }
      
      calculationBreakdown.push(`Total Cost: $${metalCost.toFixed(2)}`);
      
      details.calculation = {
        mfgPartCost: mfgTotalCost,
        part2Cost: part2TotalCost,
        earringLogic: {
          detected: false,
          note: earringDetection.note
        },
        totalCost: metalCost,
        breakdown: calculationBreakdown.join('\n')
      };
    }

    if (metalCost >= 0) { // Allow zero cost
      return createSuccessResult(
        "IKSAN Jewelry Cooperative",
        metalCost,
        'supplier_specific',
        details,
        errors
      );
    }
  }

  // If we reach here, calculation failed - but STILL show what we tried
  // Return as "partial success" with $0 cost so we don't trigger fallback
  if (errors.length === 0) {
    errors.push(ERROR_TYPES.CALCULATION_ERROR);
  }

  // Generate breakdown even for failures to show what was not found
  const failureBreakdown: string[] = [];
  
  if (mfgPart) {
    if (mfgPartData) {
      failureBreakdown.push(`MFG & Part # (${mfgPart}) [Match: ${mfgPartResult.matchType}, Attempts: ${mfgPartResult.searchAttempts}]: FOUND but no valid cost`);
    } else {
      failureBreakdown.push(`MFG & Part # (${mfgPart}): NOT FOUND [Attempts: ${mfgPartResult.searchAttempts}]`);
    }
  }
  
  if (part2) {
    if (part2Data) {
      failureBreakdown.push(`Part #2 (${part2}) [Match: ${part2Result.matchType}, Attempts: ${part2Result.searchAttempts}]: FOUND but no valid cost`);
    } else {
      failureBreakdown.push(`Part #2 (${part2}): NOT FOUND [Attempts: ${part2Result.searchAttempts}]`);
    }
  }
  
  if (!mfgPart && !part2) {
    failureBreakdown.push('No parts specified (both MFG & Part # and Part #2 are empty)');
  }
  
  failureBreakdown.push('Total Cost: $0.00');
  
  details.calculation = {
    breakdown: failureBreakdown.join('\n'),
    mfgPartCost: 0,
    part2Cost: 0,
    totalCost: 0
  };

  // Return as SUCCESS with $0 cost and errors to prevent fallback to standard calculation
  // This way the user sees the IKSAN-specific "NOT FOUND" messages
  return createSuccessResult(
    "IKSAN Jewelry Cooperative",
    0,
    'supplier_specific',
    details,
    errors
  );
}

/**
 * Default metal cost calculation using standard rates.
 */
function calculateStandardCost(
  data: SupplierData, 
  specifications: EnrichProductSpecificationsOutput, 
  method: 'standard' | 'standard_fallback' = 'standard',
  productData?: any
): CalculationResult {
  const supplierName = data['Supplier Name'] || "Standard Calculation";
  
  const dataValidationErrors = validateSupplierData(data);
  if (dataValidationErrors.length > 0) {
    return createErrorResult(supplierName, dataValidationErrors, method);
  }

  const processedSpecs = processSpecifications(specifications);
  if (!processedSpecs) {
    const specValidationErrors = validateSpecifications(specifications);
    return createErrorResult(supplierName, specValidationErrors, method);
  }

  const { metal_purity: purity, metal_weight: weight } = processedSpecs;
  const errors: string[] = [];
  let metalCost: number | null = null;
  let applicableRate: number | string = "N/A";
  let normalizedPurityKey: string | null = null;

  // Normalize purity key - more robust matching
  const purityLower = purity.toLowerCase().replace(/\s+/g, '');
  
  if (purityLower.includes('10k') || purityLower.includes('10kt')) {
    normalizedPurityKey = '10k';
  } else if (purityLower.includes('14k') || purityLower.includes('14kt')) {
    normalizedPurityKey = '14k';
  } else if (purityLower.includes('18k') || purityLower.includes('18kt')) {
    normalizedPurityKey = '18k';
  } else if (purityLower.includes('950') || purityLower.includes('platinum')) {
    normalizedPurityKey = '950';
  }

  // Prefer Google Sheets metal rates if available
  const dynamicRates = getMetalRates();
  if (normalizedPurityKey) {
    const dynamicKey = normalizedPurityKey;
    if (dynamicRates && typeof dynamicRates[dynamicKey] === 'number') {
      applicableRate = dynamicRates[dynamicKey];
    } else if (STANDARD_METAL_RATES[normalizedPurityKey]) {
      applicableRate = STANDARD_METAL_RATES[normalizedPurityKey];
    } else {
      errors.push(`No metal rate found for metal purity: ${purity}`);
    }
  }

  // Calculate cost
  let baseCost: number | null = null;
  let earringLogic: any = { detected: false, note: "Not an earring-related product" };
  
  if (typeof applicableRate === 'number' && weight > 0) {
    baseCost = applicableRate * weight;
    
    // Check for earring logic
    const earringDetection = detectEarringType(productData);
    earringLogic = {
      detected: earringDetection.isEarring,
      type: earringDetection.type,
      note: earringDetection.note
    };
    
    if (earringDetection.isEarring) {
      // Apply earring logic - double the total cost
      metalCost = baseCost * 2;
      earringLogic.multiplier = 2;
      earringLogic.doubledCost = metalCost;
    } else {
      metalCost = baseCost;
    }
  } else if (typeof applicableRate !== 'number') {
    errors.push(ERROR_TYPES.INVALID_PURITY);
  }

  const details = {
    purity: {
      original: purity,
      processed: normalizedPurityKey || 'N/A',
      matchType: 'standard_rate',
      perPiecePrice: applicableRate
    } as PurityDetails,
    weight: {
      original: String(specifications.metal_weight),
      processed: weight,
      matchType: 'parsed_float',
      perPiecePrice: 'N/A'
    } as WeightDetails,
    calculation: {
      rate: applicableRate,
      weight: weight,
      baseCost: baseCost,
      earringLogic: earringLogic,
      totalCost: metalCost
    },
    earringLogic: earringLogic.note
  };

  if (metalCost !== null && metalCost >= 0) {
    return createSuccessResult(
      supplierName,
      metalCost,
      method,
      details,
      errors
    );
  }

  return createErrorResult(
    supplierName,
    errors.length > 0 ? errors : [ERROR_TYPES.CALCULATION_ERROR],
    method,
    details
  );
}

// ============================================================================
// SUPPLIER HANDLERS
// ============================================================================

const supplierCostHandlers: Record<string, (data: SupplierData, specs: EnrichProductSpecificationsOutput, productData?: any) => CalculationResult> = {
  "lee's manufacturing": (data, specs, productData) => calculateLeesCost(data, productData),
  "lees manufacturing": (data, specs, productData) => calculateLeesCost(data, productData),
  "lee's": (data, specs, productData) => calculateLeesCost(data, productData),
  "lees": (data, specs, productData) => calculateLeesCost(data, productData),
  "iksan jewelry cooperative": (data, specs, productData) => calculateIksanCost(data, productData),
  "iksan": (data, specs, productData) => calculateIksanCost(data, productData)
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Main function to calculate metal cost.
 * Tries supplier-specific logic first, then falls back to standard calculation.
 * Applies earring logic for studs, earrings, hoops, and push backings.
 */
export function calculateMetalCost(
  data: SupplierData, 
  specifications: EnrichProductSpecificationsOutput,
  productData?: any
): CalculationResult {
  try {
    // Validate inputs
    if (!data || typeof data !== 'object') {
      return createErrorResult(
        "Unknown",
        [ERROR_TYPES.INVALID_SUPPLIER_DATA],
        'standard'
      );
    }

    if (!specifications || typeof specifications !== 'object') {
      return createErrorResult(
        data['Supplier Name'] || "Unknown",
        [ERROR_TYPES.INVALID_SPECIFICATIONS],
        'standard'
      );
    }

    const supplier = (data['Supplier Name'] || '').toLowerCase().trim();

    // Try supplier-specific handler first
    if (supplier && supplierCostHandlers[supplier]) {
      const handler = supplierCostHandlers[supplier];
      const result = handler(data, specifications, productData);
      
      // If supplier-specific logic fails, try standard fallback
      if (!result.isSuccess) {
        const specValidationErrors = validateSpecifications(specifications);
        if (specValidationErrors.length === 0) {
          const fallbackResult = calculateStandardCost(data, specifications, 'standard_fallback', productData);
          
          if (fallbackResult.isSuccess) {
            // Combine information from both attempts
            fallbackResult.errors = [
              `Supplier-specific calculation failed: ${result.errors.join(', ')}`,
              'Used standard calculation as fallback',
              ...fallbackResult.errors
            ];
            
            // Preserve supplier-specific lookup details alongside fallback details
            fallbackResult.details = { 
              supplier_attempt: result.details,
              fallback_calculation: fallbackResult.details 
            };
            
            return fallbackResult;
          }
        }
      }
      
      return result;
    }

    // Use standard calculation for unknown suppliers or when no supplier specified
    return calculateStandardCost(data, specifications, 'standard', productData);

  } catch (error) {
    return createErrorResult(
      data?.['Supplier Name'] || "Unknown",
      [`Unexpected error: ${error instanceof Error ? error.message : String(error)}`],
      'standard'
    );
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  type SupplierData,
  type CalculationResult,
  type LookupResult,
  type IksanLookupResult,
  type IksanDataItem,
  type LookupDetails,
  type PurityDetails,
  type WeightDetails,
  type ProcessedSpecifications,
  type EarringLogic,
  type EnhancedCalculationDetails,
  MetalCostCalculationError,
  STANDARD_METAL_RATES,
  ERROR_TYPES,
  EARRING_PATTERNS,
  validateSpecifications,
  lookupLeesItem,
  lookupIksanItem,
  validateSupplierData,
  processSpecifications,
  detectEarringType
};
