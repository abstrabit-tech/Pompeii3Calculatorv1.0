/**
 * Service for batch processing SKUs and generating forecast analysis.
 * Handles multiple SKUs with quantities and growth percentages.
 */

import { enrichProductSpecifications } from '@/ai/flows/enrich-product-specifications';
import { estimateProductCost } from '@/ai/flows/estimate-product-cost';
import { fetchProductFromChannelAdvisor } from '@/services/channeladvisor';
import type { EnrichProductSpecificationsOutput } from '@/ai/flows/enrich-product-specifications';

export interface SKUInput {
  sku: string;
  quantity: number;
}

export interface ProcessedSKUResult {
  sku: string;
  quantity: number;
  success: boolean;
  error?: string;
  rawData?: any;
  specifications?: any;
  enrichedData?: EnrichProductSpecificationsOutput;
  costEstimation?: any;
  breakdown?: {
    diamond?: any;
    gemstone?: any;
    metal?: any;
    labor?: any;
    part2?: any;
    part3?: any;
  };
}

export interface ForecastAnalysis {
  processedSKUs: ProcessedSKUResult[];
  summary: {
    totalSKUs: number;
    successfulSKUs: number;
    failedSKUs: number;
    totalQuantity: number;
    totalEstimatedCost: number;
    totalDiamondCost: number;
    totalGemstoneCost: number;
    totalMetalCost: number;
    totalLaborCost: number;
    totalPart2Cost: number;
    totalPart3Cost: number;
    averageCostPerUnit: number;
    projectedCostWithGrowth?: number;
  };
  growthPercentage?: number;
  breakdowns: {
    byDiamondType: Map<string, { quantity: number; cost: number }>;
    byGemstoneType: Map<string, { quantity: number; cost: number }>;
    byMetalType: Map<string, { weight: number; cost: number }>;
    byManufacturing: { part2: number; part3: number; labor: number };
  };
}

/**
 * Flatten product data from ChannelAdvisor response
 */
function flattenProductData(product: any) {
  if (!product || typeof product !== 'object') return null;

  const flattened: Record<string, any> = {};

  // Flatten basic info
  if (product.basic) {
    for (const [key, value] of Object.entries(product.basic)) {
      flattened[key] = value;
    }
  }

  // Flatten attributes
  if (product.attributes && Array.isArray(product.attributes)) {
    product.attributes.forEach((attr: any) => {
      flattened[attr.Name] = attr.Value;
    });
  }
  
  // Flatten labels
  if (product.labels && Array.isArray(product.labels)) {
    product.labels.forEach((label: any) => {
      flattened[label.Name] = true;
    });
  }

  // Flatten images
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img: any, index: number) => {
        if(img.PlacementName === 'Item Photo') flattened['ITEMIMAGEURL1'] = img.Url;
        if(img.PlacementName === 'Item Photo 2') flattened['ITEMIMAGEURL2'] = img.Url;
        if(img.PlacementName === 'Item Photo 3') flattened['ITEMIMAGEURL3'] = img.Url;
    });
  }

  // Ensure consistent Supplier Name key
  if (flattened.SupplierName && !flattened['Supplier Name']) {
    flattened['Supplier Name'] = flattened.SupplierName;
  } else if (flattened.Supplier && !flattened['Supplier Name']) {
    flattened['Supplier Name'] = flattened.Supplier;
  }

  return Object.keys(flattened).length > 0 ? flattened : null;
}

/**
 * Process a single SKU and return detailed cost breakdown
 */
export async function processSingleSKU(skuInput: SKUInput): Promise<ProcessedSKUResult> {
  const { sku, quantity } = skuInput;
  
  try {
    // Fetch product data from ChannelAdvisor
    const rawProductData = await fetchProductFromChannelAdvisor(sku);
    if (!rawProductData) {
      return {
        sku,
        quantity,
        success: false,
        error: `Product with SKU '${sku}' not found.`
      };
    }

    const specifications = flattenProductData(rawProductData);
    if (!specifications) {
      return {
        sku,
        quantity,
        success: false,
        error: `Failed to process product data for SKU '${sku}'. Product data may be incomplete.`
      };
    }

    // Enrich product specifications
    let enriched: EnrichProductSpecificationsOutput;
    try {
      enriched = await enrichProductSpecifications({
        productData: specifications,
      });
    } catch (error) {
      console.warn(`enrichProductSpecifications failed for SKU ${sku}, using fallback data:`, error instanceof Error ? error.message : String(error));
      enriched = {
        metal_purity: specifications.MetalType || specifications.Metal || "14K",
        metal_weight: specifications.Weight || specifications.MetalWeight || "1.0",
        stone_used: specifications.StoneType || specifications.Stone || "Diamond",
        diamond_details: specifications.DiamondCount ? {
          diamonds: [{
            diamondType: "Natural",
            carat_value: "0.01",
            quantity: specifications.DiamondCount
          }]
        } : null,
        gemstone_details: specifications.GemstoneType ? {
          gemstones: [{
            gemstoneType: specifications.GemstoneType,
            gemstoneShape: "Round",
            gemstoneSize: "3x3",
            gemstoneCarat: null,
            quantity: 1
          }]
        } : null,
        visual_analysis: {
          diamond_count_match: true,
          gemstone_count_match: true,
          shape_consistency: "consistent"
        }
      };
    }

    // Estimate product cost
    let costEstimation: any;
    try {
      costEstimation = await estimateProductCost({
        rawData: specifications,
        productTitle: specifications.Title || sku,
        productDescription: specifications.Description || "",
        productSpecifications: enriched,
      });
    } catch (error) {
      console.error(`Cost estimation failed for SKU ${sku}:`, error);
      return {
        sku,
        quantity,
        success: false,
        error: `Cost estimation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }

    // Extract breakdown data - use the actual output field names
    const breakdown = {
      diamond: costEstimation?.diamondBillDetails || null,
      gemstone: costEstimation?.gemstoneBillDetails || null,
      metal: costEstimation?.metalCostDetails || null,
      labor: costEstimation?.laborCostDetails || null,
      part2: costEstimation?.metalCostDetails?.details?.part2Price || null,
      part3: costEstimation?.metalCostDetails?.details?.mfgPartPrice || null,
    };

    return {
      sku,
      quantity,
      success: true,
      rawData: rawProductData,
      specifications,
      enrichedData: enriched,
      costEstimation,
      breakdown
    };

  } catch (error) {
    console.error(`Error processing SKU ${sku}:`, error);
    return {
      sku,
      quantity,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Process multiple SKUs in batch and generate comprehensive forecast analysis
 */
export async function processBatchSKUs(
  skuInputs: SKUInput[],
  growthPercentage?: number
): Promise<ForecastAnalysis> {
  const processedSKUs: ProcessedSKUResult[] = [];
  
  // Process each SKU sequentially to avoid overwhelming the API
  for (const skuInput of skuInputs) {
    const result = await processSingleSKU(skuInput);
    processedSKUs.push(result);
  }

  // Generate analysis
  return generateForecastAnalysis(processedSKUs, growthPercentage);
}

/**
 * Generate comprehensive forecast analysis from processed SKUs
 */
function generateForecastAnalysis(
  processedSKUs: ProcessedSKUResult[],
  growthPercentage?: number
): ForecastAnalysis {
  const summary = {
    totalSKUs: processedSKUs.length,
    successfulSKUs: processedSKUs.filter(r => r.success).length,
    failedSKUs: processedSKUs.filter(r => !r.success).length,
    totalQuantity: 0,
    totalEstimatedCost: 0,
    totalDiamondCost: 0,
    totalGemstoneCost: 0,
    totalMetalCost: 0,
    totalLaborCost: 0,
    totalPart2Cost: 0,
    totalPart3Cost: 0,
    averageCostPerUnit: 0,
    projectedCostWithGrowth: undefined as number | undefined,
  };

  const breakdowns = {
    byDiamondType: new Map<string, { quantity: number; cost: number }>(),
    byGemstoneType: new Map<string, { quantity: number; cost: number }>(),
    byMetalType: new Map<string, { weight: number; cost: number }>(),
    byManufacturing: { part2: 0, part3: 0, labor: 0 },
  };

  // Calculate totals and breakdowns
  processedSKUs.forEach(result => {
    if (!result.success) return;

    const qty = result.quantity;
    summary.totalQuantity += qty;

    // Extract cost data from the actual estimateProductCost output structure
    const costEst = result.costEstimation;
    
    // Total costs - handle both number and "ERROR" string
    const unitCost = typeof costEst?.totalCost === 'number' ? costEst.totalCost : 0;
    const totalCost = unitCost * qty;
    summary.totalEstimatedCost += totalCost;

    // Diamond costs
    const diamondCost = (costEst?.diamondCost || 0) * qty;
    summary.totalDiamondCost += diamondCost;

    // Gemstone costs
    const gemstoneCost = (costEst?.gemstoneCost || 0) * qty;
    summary.totalGemstoneCost += gemstoneCost;

    // Metal costs (materialCost includes base metal + part2 + part3)
    const materialCost = typeof costEst?.materialCost === 'number' ? costEst.materialCost : 0;
    const metalCost = materialCost * qty;
    summary.totalMetalCost += metalCost;

    // Labor costs
    const laborCost = (costEst?.laborCost || 0) * qty;
    summary.totalLaborCost += laborCost;

    // Extract Part 2 and Part 3 costs from metalCostDetails
    const metalDetails = costEst?.metalCostDetails;
    const part2Cost = (metalDetails?.details?.part2Price || 0) * qty;
    const part3Cost = (metalDetails?.details?.mfgPartPrice || 0) * qty;
    summary.totalPart2Cost += part2Cost;
    summary.totalPart3Cost += part3Cost;

    // Diamond breakdown by type
    if (costEst?.diamondBillDetails?.diamonds && Array.isArray(costEst.diamondBillDetails.diamonds)) {
      costEst.diamondBillDetails.diamonds.forEach((item: any) => {
        const type = item.diamondType || 'Unknown';
        const existing = breakdowns.byDiamondType.get(type) || { quantity: 0, cost: 0 };
        breakdowns.byDiamondType.set(type, {
          quantity: existing.quantity + (item.quantity * qty),
          cost: existing.cost + (item.total_price * qty)
        });
      });
    }

    // Gemstone breakdown by type
    if (costEst?.gemstoneBillDetails?.gemstones && Array.isArray(costEst.gemstoneBillDetails.gemstones)) {
      costEst.gemstoneBillDetails.gemstones.forEach((item: any) => {
        const type = item.gemstone || item.gemstoneType || 'Unknown';
        const existing = breakdowns.byGemstoneType.get(type) || { quantity: 0, cost: 0 };
        breakdowns.byGemstoneType.set(type, {
          quantity: existing.quantity + (item.quantity * qty),
          cost: existing.cost + (item.total_price * qty)
        });
      });
    }

    // Metal breakdown by type
    if (result.enrichedData?.metal_purity) {
      const metalType = result.enrichedData.metal_purity;
      const weight = typeof result.enrichedData.metal_weight === 'number' 
        ? result.enrichedData.metal_weight 
        : parseFloat(String(result.enrichedData.metal_weight || 0));
      const cost = materialCost;
      const existing = breakdowns.byMetalType.get(metalType) || { weight: 0, cost: 0 };
      breakdowns.byMetalType.set(metalType, {
        weight: existing.weight + (weight * qty),
        cost: existing.cost + cost
      });
    }

    // Manufacturing costs
    breakdowns.byManufacturing.part2 += part2Cost;
    breakdowns.byManufacturing.part3 += part3Cost;
    breakdowns.byManufacturing.labor += laborCost;
  });

  // Calculate averages
  if (summary.totalQuantity > 0) {
    summary.averageCostPerUnit = summary.totalEstimatedCost / summary.totalQuantity;
  }

  // Calculate projected cost with growth
  if (growthPercentage !== undefined && growthPercentage > 0) {
    const growthMultiplier = 1 + (growthPercentage / 100);
    summary.projectedCostWithGrowth = summary.totalEstimatedCost * growthMultiplier;
  }

  return {
    processedSKUs,
    summary,
    growthPercentage,
    breakdowns
  };
}
