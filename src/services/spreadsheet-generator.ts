/**
 * Service for generating Excel spreadsheets with forecast analysis data.
 * Creates comprehensive reports with multiple sheets for different breakdowns.
 */

import * as XLSX from 'xlsx-js-style';
import type { ForecastAnalysis, ProcessedSKUResult } from './forecast-processor';

export interface SpreadsheetGeneratorOptions {
  includeRawData?: boolean;
  includeDetailedBreakdowns?: boolean;
  includeCharts?: boolean;
}

// Color schemes for styling
const COLORS = {
  HEADER: { fgColor: { rgb: "4F46E5" } }, // Indigo
  DIAMOND: { fgColor: { rgb: "3B82F6" } }, // Blue
  GEMSTONE: { fgColor: { rgb: "10B981" } }, // Green
  METAL: { fgColor: { rgb: "F97316" } }, // Orange
  PARTS: { fgColor: { rgb: "F59E0B" } }, // Amber
  SUCCESS: { fgColor: { rgb: "10B981" } }, // Green
  ERROR: { fgColor: { rgb: "EF4444" } }, // Red
};

/**
 * Apply header styling to worksheet
 * Note: xlsx library has limited styling support. For full styling, use xlsx-style or ExcelJS.
 * This function sets up cell formatting that will be applied when writing the file.
 */
function styleHeaders(worksheet: XLSX.WorkSheet, headerColor: any, startRow: number = 0) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: startRow, c: col });
    if (!worksheet[cellAddress]) continue;
    
    // Create cell object if it's a string
    const cellValue = worksheet[cellAddress];
    if (typeof cellValue === 'string' || typeof cellValue === 'number') {
      worksheet[cellAddress] = {
        t: 's',
        v: cellValue,
        s: {
          fill: headerColor,
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          }
        }
      };
    } else {
      // Cell is already an object, add styling
      worksheet[cellAddress].s = {
        fill: headerColor,
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        }
      };
    }
  }
}

/**
 * Normalize size string to ensure it has only one 'mm' suffix
 */
function normalizeSize(size: string | number | undefined | null): string {
  if (!size) return 'N/A';
  
  let sizeStr = String(size).trim();
  
  // Remove all existing 'mm' suffixes (case insensitive)
  sizeStr = sizeStr.replace(/mm+$/gi, '');
  sizeStr = sizeStr.replace(/\s*mm\s*/gi, '');
  
  // Remove trailing whitespace
  sizeStr = sizeStr.trim();
  
  // Return N/A if empty after cleanup
  if (!sizeStr || sizeStr === '') return 'N/A';
  
  // Add single 'mm' suffix
  return `${sizeStr}mm`;
}

/**
 * Format diamonds as single-cell array: [(productID, caratct, sizemm, quantitynos.), ...]
 */
function formatDiamondsArray(result: ProcessedSKUResult): string {
  const diamonds = extractDiamondData(result);
  if (diamonds.length === 0) return '';
  
  const formatted = diamonds.map(d => {
    const lookupId = d.lookupCode || 'N/A';
    const carat = d.caratValue ? `${d.caratValue}ct` : 'N/A';
    const size = normalizeSize(d.size);
    const quantity = d.quantity ? `${d.quantity}nos.` : '0nos.';
    return `(${lookupId}, ${carat}, ${size}, ${quantity})`;
  });
  
  return `[${formatted.join(', ')}]`;
}

/**
 * Format gemstones as single-cell array: [(productID, caratct, sizemm, quantitynos.), ...]
 */
function formatGemstonesArray(result: ProcessedSKUResult): string {
  const gemstones = extractGemstoneData(result);
  if (gemstones.length === 0) return '';
  
  const formatted = gemstones.map(g => {
    const lookupId = g.lookupCode || 'N/A';
    const carat = g.carat ? `${g.carat}ct` : 'N/A';
    const size = normalizeSize(g.size);
    const quantity = g.quantity ? `${g.quantity}nos.` : '0nos.';
    return `(${lookupId}, ${carat}, ${size}, ${quantity})`;
  });
  
  return `[${formatted.join(', ')}]`;
}

/**
 * Generate a comprehensive Excel workbook from forecast analysis
 */
export function generateForecastSpreadsheet(
  analysis: ForecastAnalysis,
  options: SpreadsheetGeneratorOptions = {}
): XLSX.WorkBook {
  const {
    includeRawData = true,
    includeDetailedBreakdowns = true,
  } = options;

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  addSummarySheet(workbook, analysis);

  // Sheet 2: Charts & Graphs
  addChartsSheet(workbook, analysis);

  // Sheet 3: All SKUs - Detailed
  addAllSKUsDetailedSheet(workbook, analysis);

  // Sheet 4: Diamond Breakdown
  addDiamondBreakdownSheet(workbook, analysis);

  // Sheet 5: Gemstone Breakdown
  addGemstoneBreakdownSheet(workbook, analysis);

  // Sheet 6: Metal Breakdown
  addMetalBreakdownSheet(workbook, analysis);

  // Sheet 7: Parts & Components
  addPartsComponentsSheet(workbook, analysis);

  // Sheet 8: Earring Pairs Analysis
  addEarringPairsAnalysisSheet(workbook, analysis);

  // Sheet 9: Diamond Inventory
  addDiamondInventorySheet(workbook, analysis);

  // Sheet 10: Gemstone Inventory
  addGemstoneInventorySheet(workbook, analysis);

  // Sheet 11: Metal Inventory
  addMetalInventorySheet(workbook, analysis);

  // Sheet 12: Suppliers Inventory
  addSuppliersInventorySheet(workbook, analysis);

  // Sheet 13: MFG Part # Breakdown
  addMfgPartBreakdownSheet(workbook, analysis);

  // Sheet 14: Part #2 Breakdown
  addPart2BreakdownSheet(workbook, analysis);

  // Sheet 15: Failed SKUs (if any)
  addFailedSKUsSheet(workbook, analysis);

  return workbook;
}

/**
 * Add executive summary sheet with enhanced formatting
 */
function addSummarySheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const { summary, growthPercentage } = analysis;
  const successRate = ((summary.successfulSKUs / summary.totalSKUs) * 100).toFixed(2);

  const data = [
    ['POMPEII3 FORECAST ANALYSIS', '', ''],
    ['Executive Summary Dashboard', '', ''],
    ['Generated: ' + new Date().toLocaleString(), '', ''],
    [''],
    ['═══════════════════════════════════════════════════════════', '', ''],
    ['PROCESSING OVERVIEW', '', ''],
    ['═══════════════════════════════════════════════════════════', '', ''],
    ['Total SKUs Processed', summary.totalSKUs, ''],
    ['Successfully Analyzed', summary.successfulSKUs, '✓'],
    ['Failed Analysis', summary.failedSKUs, summary.failedSKUs > 0 ? '⚠' : '✓'],
    ['Success Rate', successRate + '%', parseFloat(successRate) >= 90 ? '✓' : '⚠'],
    ['Total Units to Produce', summary.totalQuantity, ''],
    [''],
    ['═══════════════════════════════════════════════════════════', '', ''],
    ['FINANCIAL SUMMARY', '', ''],
    ['═══════════════════════════════════════════════════════════', '', ''],
    ['Total Estimated Cost', '$' + summary.totalEstimatedCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ''],
    ['Average Cost Per Unit', '$' + summary.averageCostPerUnit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ''],
    [''],
    ['═══════════════════════════════════════════════════════════', '', ''],
    ['COST BREAKDOWN BY CATEGORY', 'Amount', '% of Total'],
    ['═══════════════════════════════════════════════════════════', '', ''],
    ['💎 Diamond Cost', '$' + summary.totalDiamondCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ((summary.totalDiamondCost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['💠 Gemstone Cost', '$' + summary.totalGemstoneCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ((summary.totalGemstoneCost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['🔧 Metal Cost', '$' + summary.totalMetalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ((summary.totalMetalCost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['👷 Labor Cost', '$' + summary.totalLaborCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ((summary.totalLaborCost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['⚙️ Part #2 Cost', '$' + summary.totalPart2Cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ((summary.totalPart2Cost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['🔩 MFG & Part # Cost', '$' + summary.totalPart3Cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ((summary.totalPart3Cost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
  ];

  if (growthPercentage !== undefined && summary.projectedCostWithGrowth !== undefined) {
    const additionalCost = summary.projectedCostWithGrowth - summary.totalEstimatedCost;
    data.push(
      [''],
      ['═══════════════════════════════════════════════════════════', '', ''],
      ['GROWTH PROJECTION ANALYSIS', '', ''],
      ['═══════════════════════════════════════════════════════════', '', ''],
      ['Growth Percentage Applied', growthPercentage + '%', ''],
      ['Projected Total Cost', '$' + summary.projectedCostWithGrowth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), ''],
      ['Additional Investment Required', '$' + additionalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), additionalCost > 10000 ? '⚠ High' : '✓ Moderate']
    );
  }

  data.push(
    [''],
    ['═══════════════════════════════════════════════════════════', '', ''],
    ['For detailed breakdowns, see:', '', ''],
    ['• Diamond Breakdown sheet for diamond analysis', '', ''],
    ['• Gemstone Breakdown sheet for gemstone details', '', ''],
    ['• Metal Breakdown sheet for metal requirements', '', ''],
    ['• MFG & Part # Breakdown sheet for manufacturing parts', '', ''],
    ['• Part #2 Breakdown sheet for secondary parts', '', ''],
    ['• Charts & Graphs sheet for visual analysis', '', '']
  );

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 45 },
    { wch: 25 },
    { wch: 18 }
  ];

  // Apply styling to headers
  styleHeaders(worksheet, COLORS.HEADER, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Executive Summary');
}

/**
 * Add Charts & Graphs sheet
 */
function addChartsSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const { summary, breakdowns } = analysis;

  const data = [
    ['CHARTS & VISUAL ANALYSIS'],
    [''],
    ['Note: This sheet contains data for visualization. Use Excel charting tools to create:'],
    ['- Pie charts for cost breakdown'],
    ['- Bar charts for material inventory'],
    ['- Line charts for growth projections'],
    [''],
    ['═══════════════════════════════════════════════════════════'],
    ['COST BREAKDOWN DATA (Use for Pie Chart)'],
    ['═══════════════════════════════════════════════════════════'],
    ['Category', 'Cost', 'Percentage'],
    ['Diamonds', summary.totalDiamondCost, ((summary.totalDiamondCost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['Gemstones', summary.totalGemstoneCost, ((summary.totalGemstoneCost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['Metal', summary.totalMetalCost, ((summary.totalMetalCost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['Labor', summary.totalLaborCost, ((summary.totalLaborCost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['Part #2', summary.totalPart2Cost, ((summary.totalPart2Cost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    ['MFG & Part #', summary.totalPart3Cost, ((summary.totalPart3Cost / summary.totalEstimatedCost) * 100).toFixed(2) + '%'],
    [''],
    ['═══════════════════════════════════════════════════════════'],
    ['DIAMOND TYPES (Use for Bar Chart)'],
    ['═══════════════════════════════════════════════════════════'],
    ['Diamond Type', 'Quantity', 'Total Cost'],
  ];

  // Add diamond breakdown data
  breakdowns.byDiamondType.forEach((value, type) => {
    data.push([type, value.quantity, '$' + value.cost.toFixed(2)]);
  });

  data.push(
    [''],
    ['═══════════════════════════════════════════════════════════'],
    ['GEMSTONE TYPES (Use for Bar Chart)'],
    ['═══════════════════════════════════════════════════════════'],
    ['Gemstone Type', 'Quantity', 'Total Cost']
  );

  // Add gemstone breakdown data
  breakdowns.byGemstoneType.forEach((value, type) => {
    data.push([type, value.quantity, '$' + value.cost.toFixed(2)]);
  });

  data.push(
    [''],
    ['═══════════════════════════════════════════════════════════'],
    ['METAL TYPES (Use for Bar Chart)'],
    ['═══════════════════════════════════════════════════════════'],
    ['Metal Type', 'Weight (g)', 'Total Cost']
  );

  // Add metal breakdown data
  breakdowns.byMetalType.forEach((value, type) => {
    data.push([type, value.weight.toFixed(2), '$' + value.cost.toFixed(2)]);
  });

  data.push(
    [''],
    ['═══════════════════════════════════════════════════════════'],
    ['MANUFACTURING COSTS (Use for Column Chart)'],
    ['═══════════════════════════════════════════════════════════'],
    ['Component', 'Cost'],
    ['Part #2', '$' + breakdowns.byManufacturing.part2.toFixed(2)],
    ['MFG & Part #', '$' + breakdowns.byManufacturing.part3.toFixed(2)],
    ['Labor', '$' + breakdowns.byManufacturing.labor.toFixed(2)]
  );

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 20 }
  ];

  // Apply styling
  styleHeaders(worksheet, COLORS.HEADER, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Charts & Graphs');
}

/**
 * Add SKU-wise breakdown sheet
 * Note: XLSX library accepts both numbers and strings in data arrays
 */
function addSKUBreakdownSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'SKU',
    'Quantity',
    'Unit Cost',
    'Total Cost',
    'Diamond Cost',
    'Gemstone Cost',
    'Metal Cost',
    'Labor Cost',
    'Part #2 Cost',
    'MFG & Part # Cost',
    'Projected Quantity',
    'Status',
    'Error (if any)'
  ];

  const data = [headers];

  analysis.processedSKUs.forEach(result => {
    if (result.success && result.costEstimation) {
      const unitCost = result.costEstimation.totalCost || 0;
      const qty = result.quantity;
      const projectedQty = Math.ceil(qty * growthMultiplier);
      
      // Extract Part 2 and Part 3 costs from metalCostDetails
      const part2Cost = result.costEstimation.metalCostDetails?.details?.part2Price || 0;
      const part3Cost = result.costEstimation.metalCostDetails?.details?.mfgPartPrice || 0;
      
      data.push([
        result.sku,
        qty,
        parseFloat(unitCost.toString()),
        parseFloat(unitCost.toString()) * qty,
        (result.costEstimation.diamondCost || 0) * qty,
        (result.costEstimation.gemstoneCost || 0) * qty,
        (result.costEstimation.materialCost === 'ERROR' ? 0 : result.costEstimation.materialCost || 0) * qty,
        (result.costEstimation.laborCost || 0) * qty,
        part2Cost * qty,
        part3Cost * qty,
        projectedQty,
        'Success',
        ''
      ] as any);
    } else {
      const qty = result.quantity;
      const projectedQty = Math.ceil(qty * growthMultiplier);
      
      data.push([
        result.sku,
        qty,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        projectedQty,
        'Failed',
        result.error || 'Unknown error'
      ] as any);
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths - added one more for Projected Quantity
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 40 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'SKU Breakdown');
}

/**
 * Helper function to extract diamond data sorted by size (largest first)
 * EXACT SAME LOGIC as diamond-cost-calculator.ts - calls actual pricing functions
 */
function extractDiamondData(result: ProcessedSKUResult) {
  const diamonds: any[] = [];
  
  if (!result.enrichedData?.diamond_details?.diamonds) {
    return diamonds;
  }

  // Import pricing functions and data access
  const { getNaturalDiamondData, getLabDiamondData } = require('./pricing-source');
  const { 
    getNumericCaratValue,
    getDiamondTypeFromLookupCode,
    normalizeDiamondType
  } = require('./diamond-cost-calculator');
  
  result.enrichedData.diamond_details.diamonds.forEach((diamond: any) => {
    // EXACT SAME FIELD ACCESS as diamond-cost-calculator.ts
    const quantity = (typeof diamond.quantity === 'number' && diamond.quantity > 0) ? diamond.quantity : 1;
    
    // Determine diamond type
    let diamondType = diamond.diamondType || 'Natural';
    if (diamond.lookupCode && typeof diamond.lookupCode === 'string') {
      diamondType = getDiamondTypeFromLookupCode(diamond.lookupCode);
    }
    
    const normalizedType = normalizeDiamondType(diamondType);
    const isLabDiamond = normalizedType === 'lab';
    
    // Get the pricing data array directly
    const pricingData = (isLabDiamond ? getLabDiamondData() : getNaturalDiamondData()) as any[];
    
    let productId = '';
    let caratPerUnit = 0;
    let sizeFromSheet = '';
    let matchedRow: any = null;
    
    // EXACT SAME PRICING HIERARCHY as diamond-cost-calculator.ts
    if (diamond.lookupCode && typeof diamond.lookupCode === 'string') {
      // Priority 1: Lookup code exact match
      const cleanLookupCode = diamond.lookupCode.replace(/\s+plus\s+/gi, "+").trim();
      matchedRow = pricingData.find((row: any) => row.productId === cleanLookupCode);
      
      if (matchedRow) {
        productId = matchedRow.productId;
        caratPerUnit = matchedRow.caratPerUnit || 0;
        sizeFromSheet = matchedRow.size || '';  // Use 'size' field
      }
    } else if (typeof diamond.width === 'number' && diamond.width > 0) {
      // Priority 2: Width-based matching
      let closestRow: any = null;
      let minDiff = Infinity;
      
      for (const row of pricingData) {
        if (!row.size) continue;
        
        // Parse MM value from size field
        const sizeClean = String(row.size).toLowerCase().replace(/\s*mm\s*/g, '').trim();
        let mmValue = 0;
        
        if (sizeClean.includes('-')) {
          const range = sizeClean.split('-');
          const min = parseFloat(range[0]);
          const max = parseFloat(range[1]);
          if (!isNaN(min) && !isNaN(max)) {
            mmValue = (min + max) / 2;
          }
        } else {
          mmValue = parseFloat(sizeClean);
        }
        
        if (mmValue > 0) {
          const diff = Math.abs(mmValue - diamond.width);
          if (diff < minDiff) {
            minDiff = diff;
            closestRow = row;
          }
        }
      }
      
      if (closestRow) {
        matchedRow = closestRow;
        productId = closestRow.productId;
        caratPerUnit = closestRow.caratPerUnit || 0;
        sizeFromSheet = closestRow.size || '';  // Use 'size' field
      }
    } else if (diamond.carat_value !== undefined && diamond.carat_value !== null) {
      // Priority 3: Carat-based rules
      const caratNumeric = getNumericCaratValue(diamond.carat_value);
      
      if (!isNaN(caratNumeric) && caratNumeric > 0) {
        // Find by carat value or productId numeric
        const targetKey = caratNumeric < 2 ? 'caratPerUnit' : 'numericProductId';
        
        // Add numeric product ID
        const dataWithNumeric = pricingData.map((row: any) => ({
          ...row,
          numericProductId: (() => {
            if (!row.productId) return null;
            const suffix = row.productId.replace(/^(ND|LD)/i, '');
            if (suffix.includes('/')) return null;
            const cleaned = suffix.startsWith('+') ? suffix.substring(1) : suffix;
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          })()
        }));
        
        // Find exact or next bigger
        let bestMatch: any = null;
        let nextBigger: any = null;
        let smallestDiff = Infinity;
        
        for (const row of dataWithNumeric) {
          const rowValue = targetKey === 'caratPerUnit' ? row.caratPerUnit : row.numericProductId;
          if (!rowValue || typeof rowValue !== 'number') continue;
          
          if (Math.abs(rowValue - caratNumeric) < 0.0001) {
            bestMatch = row;
            break;
          }
          
          const diff = rowValue - caratNumeric;
          if (diff > 0 && diff < smallestDiff) {
            smallestDiff = diff;
            nextBigger = row;
          }
        }
        
        matchedRow = bestMatch || nextBigger;
        if (matchedRow) {
          productId = matchedRow.productId;
          caratPerUnit = matchedRow.caratPerUnit || 0;
          sizeFromSheet = matchedRow.size || '';  // Use 'size' field
        }
      }
    }
    
    // Use size from pricing sheet (PRIMARY SOURCE)
    let sizeDisplay = '';
    let sizeNum = 0;
    
    if (sizeFromSheet) {
      sizeDisplay = sizeFromSheet;
      const match = sizeFromSheet.match(/(\d+\.?\d*)/);
      sizeNum = match ? parseFloat(match[1]) : 0;
    } else {
      // Fallback to enriched data
      if (typeof diamond.width === 'number' && diamond.width > 0) {
        sizeNum = diamond.width;
        sizeDisplay = `${diamond.width}`;
      } else if (diamond.size) {
        if (typeof diamond.size === 'number') {
          sizeNum = diamond.size;
          sizeDisplay = `${diamond.size}`;
        } else if (typeof diamond.size === 'string') {
          const match = diamond.size.match(/(\d+\.?\d*)/);
          if (match) {
            sizeNum = parseFloat(match[1]);
            sizeDisplay = diamond.size;
          }
        }
      }
      
      if (sizeNum === 0 && caratPerUnit > 0) {
        sizeNum = Math.pow(caratPerUnit * 6.5, 1/3);
        sizeDisplay = `~${sizeNum.toFixed(2)}`;
      }
    }
    
    diamonds.push({
      type: diamondType,
      size: sizeDisplay || 'N/A',
      sizeNum: sizeNum,
      quantity: quantity,
      caratValue: caratPerUnit || diamond.carat_value || '',
      shape: diamond.shape || '',
      lookupCode: productId || diamond.lookupCode || ''
    });
  });
  
  // Sort by size (largest first)
  diamonds.sort((a, b) => b.sizeNum - a.sizeNum);
  
  return diamonds;
}

/**
 * Helper function to extract gemstone data sorted by size (largest first)
 * EXACT SAME LOGIC as gemstone-cost-calculator.ts - directly accesses pricing data
 */
function extractGemstoneData(result: ProcessedSKUResult) {
  const gemstones: any[] = [];
  
  if (!result.enrichedData?.gemstone_details?.gemstones) {
    return gemstones;
  }

  // Import pricing data access
  const { getGemstoneData } = require('./pricing-source');
  
  // Helper functions - EXACT SAME as gemstone-cost-calculator.ts
  function normalizeString(str: string | undefined): string {
    return (str || '').trim().toLowerCase();
  }
  
  const BASE_GEMSTONE_TYPES = [
    'sapphire', 'amethyst', 'emerald', 'ruby', 'topaz', 'aquamarine', 
    'citrine', 'peridot', 'moissanite', 'tourmaline', 'morganite', 
    'garnet', 'opal'
  ];
  
  function normalizeGemstoneType(descriptiveName: string | undefined): string {
    const lowerName = normalizeString(descriptiveName);
    if (!lowerName) return '';
    for (const baseType of BASE_GEMSTONE_TYPES) {
      if (lowerName.includes(baseType)) {
        return baseType;
      }
    }
    return lowerName;
  }
  
  function parseSize(sizeStr: string): { x: number; y?: number } | null {
    if (!sizeStr) return null;
    const cleaned = normalizeString(sizeStr).replace(/mm/g, '').trim();
    const parts = cleaned.split('x').map(part => parseFloat(part.trim()));
    if (parts.some(isNaN)) return null;
    if (parts.length === 1) return { x: parts[0] };
    if (parts.length === 2) return { x: parts[0], y: parts[1] };
    return null;
  }
  
  // EXACT SAME MATCHING LOGIC as gemstone-cost-calculator.ts
  function findBestMatch(dataSet: any[], targetSize: { x: number; y?: number } | null, targetCarat: number | null, shape: string) {
    const shapeNormalized = normalizeString(shape);
    const candidates = dataSet.filter((d: any) => normalizeString(d.shape) === shapeNormalized);
    
    if (candidates.length === 0) {
      return { match: null };
    }
    
    // Priority 1: Exact size match
    if (targetSize) {
      for (const candidate of candidates) {
        const candidateSize = parseSize(candidate.size);
        if (!candidateSize) continue;
        
        const isExactX = candidateSize.x === targetSize.x;
        const isExactY = !targetSize.y || candidateSize.y === targetSize.y;
        
        if (isExactX && isExactY) {
          return { match: candidate };
        }
      }
      
      // Priority 2: Next larger size
      let nextLargerMatch = null;
      let smallestDiff = Infinity;
      
      for (const candidate of candidates) {
        const candidateSize = parseSize(candidate.size);
        if (!candidateSize) continue;
        
        const isLargerX = candidateSize.x >= targetSize.x;
        const isLargerY = !targetSize.y || (candidateSize.y && candidateSize.y >= targetSize.y);
        
        if (isLargerX && isLargerY) {
          const diff = (candidateSize.x - targetSize.x) + ((candidateSize.y || 0) - (targetSize.y || 0));
          if (diff < smallestDiff) {
            smallestDiff = diff;
            nextLargerMatch = candidate;
          }
        }
      }
      
      if (nextLargerMatch) {
        return { match: nextLargerMatch };
      }
    }
    
    // Priority 3: Carat-based fallback
    if (targetCarat && candidates.length > 0) {
      for (const candidate of candidates) {
        if (candidate.caratPerUnit === targetCarat) {
          return { match: candidate };
        }
      }
      
      // Next larger carat
      let nextLargerCarat = null;
      let smallestDiff = Infinity;
      for (const candidate of candidates) {
        if (typeof candidate.caratPerUnit !== 'number') continue;
        const diff = candidate.caratPerUnit - targetCarat;
        if (diff > 0 && diff < smallestDiff) {
          smallestDiff = diff;
          nextLargerCarat = candidate;
        }
      }
      if (nextLargerCarat) {
        return { match: nextLargerCarat };
      }
    }
    
    // Priority 4: Smallest available of same shape
    if (candidates.length > 0) {
      candidates.sort((a: any, b: any) => {
        const sizeA = parseSize(a.size)?.x || a.caratPerUnit || Infinity;
        const sizeB = parseSize(b.size)?.x || b.caratPerUnit || Infinity;
        return sizeA - sizeB;
      });
      return { match: candidates[0] };
    }
    
    return { match: null };
  }
  
  result.enrichedData.gemstone_details.gemstones.forEach((gemstone: any) => {
    // EXACT SAME FIELD ACCESS as gemstone-cost-calculator.ts
    const gemstoneType = normalizeGemstoneType(gemstone.gemstoneType);
    const gemstoneShape = normalizeString(gemstone.gemstoneShape);
    const gemstoneSize = gemstone.gemstoneSize || '';
    const gemstoneCarat = gemstone.gemstoneCarat || null;
    const quantity = Number(gemstone.quantity) || 1;
    
    // Get pricing data directly - EXACT SAME as gemstone-cost-calculator.ts
    const rawDataSet = getGemstoneData()[gemstoneType];
    let productID = '';
    let matchedCarat = gemstoneCarat;
    let sizeFromSheet = '';
    let matchedRow: any = null;
    
    if (rawDataSet && Array.isArray(rawDataSet)) {
      const dataSet = rawDataSet as any[];
      
      // CRITICAL: Parse the size FIRST using the EXACT same parseSize function
      const parsedSize = parseSize(gemstoneSize);
      
      // EXACT SAME MATCHING LOGIC as gemstone-cost-calculator.ts
      // Uses size to determine the match, which gives us productID and caratPerUnit
      const { match } = findBestMatch(dataSet, parsedSize, gemstoneCarat, gemstoneShape);
      
      if (match) {
        matchedRow = match;
        productID = match.productID || '';           // ProductID from matched row
        matchedCarat = match.caratPerUnit || gemstoneCarat;  // CaratPerUnit from matched row
        sizeFromSheet = match.size || '';            // Size from matched row
      }
    }
    
    // Use size from pricing sheet (PRIMARY SOURCE)
    let sizeDisplay = '';
    let sizeNum = 0;
    
    if (sizeFromSheet) {
      sizeDisplay = sizeFromSheet;
      const parsedMatchedSize = parseSize(sizeFromSheet);
      sizeNum = parsedMatchedSize ? parsedMatchedSize.x : 0;
    } else {
      // Fallback to enriched data
      sizeDisplay = gemstoneSize || '';
      const parsedSize = parseSize(gemstoneSize);
      sizeNum = parsedSize ? parsedSize.x : 0;
    }
    
    gemstones.push({
      type: gemstone.gemstoneType || '',
      size: sizeDisplay || '',
      sizeNum: sizeNum,
      quantity: quantity,
      carat: matchedCarat || '',
      shape: gemstone.gemstoneShape || '',
      lookupCode: productID || ''  // Use matched productID from pricing sheet
    });
  });
  
  // Sort by size (largest first)
  gemstones.sort((a, b) => b.sizeNum - a.sizeNum);
  
  return gemstones;
}

/**
 * Helper function to detect if product is earring
 */
function isEarring(result: ProcessedSKUResult): boolean {
  const title = (result.specifications?.Title || '').toLowerCase();
  const description = (result.specifications?.Description || '').toLowerCase();
  const category = (result.specifications?.Category || '').toLowerCase();
  
  return title.includes('earring') || 
         description.includes('earring') || 
         category.includes('earring') ||
         title.includes('stud');
}

/**
 * Sheet 3: All SKUs - Detailed with Single-Cell Arrays
 */
function addAllSKUsDetailedSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const headers = [
    'SKU', 'Title', 'Description', 'Exact Carat Total Weight', 'Right Weight', 
    'Width', 'Weight', 'Main Stone', 'Casting Weight', 'Supplier Name', 
    'MFG & Part #', 'Part #2',
    'Diamonds [(ID, carat, size, qty), ...]',
    'Gemstones [(ID, carat, size, qty), ...]',
    'Metal Purity', 'Metal Weight',
    'Metal Cost', 'Labor Cost', 'Diamond Cost', 'Gemstone Cost', 'Total Cost'
  ];

  const data = [headers];

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const spec = result.specifications || {};
    const enriched = result.enrichedData;
    const cost = result.costEstimation || {};

    data.push([
      result.sku,
      spec.Title || '',
      spec.Description || '',
      spec['Exact Carat Total Weight'] || spec.ExactCaratTotalWeight || '',
      spec['Right Weight'] || spec.RightWeight || '',
      spec.Width || '',
      spec.Weight || enriched?.metal_weight || '',
      enriched?.stone_used || spec.MainStone || '',
      spec['Casting Weight'] || spec.CastingWeight || '',
      spec['Supplier Name'] || spec.SupplierName || '',
      spec['MFG & Part #'] || spec.MfgPartNumber || '',
      spec['Part #2'] || spec.Part2 || '',
      // Single-cell diamond array
      formatDiamondsArray(result),
      // Single-cell gemstone array
      formatGemstonesArray(result),
      // Metal
      enriched?.metal_purity || '',
      enriched?.metal_weight || '',
      // Costs
      cost.materialCost === 'ERROR' ? 0 : (cost.materialCost || 0),
      cost.laborCost || 0,
      cost.diamondCost || 0,
      cost.gemstoneCost || 0,
      cost.totalCost || 0
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 15 }, { wch: 15 },
    { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
    { wch: 20 }, { wch: 15 },
    { wch: 60 }, // Diamonds array
    { wch: 60 }, // Gemstones array
    { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  
  // Apply header styling
  styleHeaders(worksheet, COLORS.HEADER, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'All SKUs Detailed');
}

/**
 * Sheet 4: Diamond Breakdown (Blue Theme)
 */
function addDiamondBreakdownSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'SKU', 'Title', 'Description', 'Supplier Name',
    'MFG & Part #', 'Part #2',
    'Diamonds [(ID, carat, size, qty), ...]',
    'Total Diamond Quantity', 'Diamond Cost', 'Total SKU Cost', 'Projected Qty'
  ];

  const data = [headers];

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const spec = result.specifications || {};
    const cost = result.costEstimation || {};
    const diamonds = extractDiamondData(result);
    
    if (diamonds.length === 0) return; // Skip if no diamonds

    const totalDiamonds = diamonds.reduce((sum, d) => sum + d.quantity, 0);
    const projectedQty = Math.ceil(totalDiamonds * growthMultiplier);

    data.push([
      result.sku,
      spec.Title || '',
      spec.Description || '',
      spec['Supplier Name'] || spec.SupplierName || '',
      spec['MFG & Part #'] || spec.MfgPartNumber || '',
      spec['Part #2'] || spec.Part2 || '',
      formatDiamondsArray(result),
      totalDiamonds,
      cost.diamondCost || 0,
      cost.totalCost || 0,
      projectedQty
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 25 },
    { wch: 20 }, { wch: 15 },
    { wch: 70 }, // Diamond array
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  
  // Apply blue theme for diamond sheet
  styleHeaders(worksheet, COLORS.DIAMOND, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '💎 Diamond Breakdown');
}

/**
 * Sheet 5: Gemstone Breakdown (Green Theme)
 */
function addGemstoneBreakdownSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'SKU', 'Title', 'Description', 'Supplier Name',
    'MFG & Part #', 'Part #2',
    'Gemstones [(ID, carat, size, qty), ...]',
    'Total Gemstone Quantity', 'Gemstone Cost', 'Total SKU Cost', 'Projected Qty'
  ];

  const data = [headers];

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const spec = result.specifications || {};
    const cost = result.costEstimation || {};
    const gemstones = extractGemstoneData(result);
    
    if (gemstones.length === 0) return; // Skip if no gemstones

    const totalGemstones = gemstones.reduce((sum, g) => sum + g.quantity, 0);
    const projectedQty = Math.ceil(totalGemstones * growthMultiplier);

    data.push([
      result.sku,
      spec.Title || '',
      spec.Description || '',
      spec['Supplier Name'] || spec.SupplierName || '',
      spec['MFG & Part #'] || spec.MfgPartNumber || '',
      spec['Part #2'] || spec.Part2 || '',
      formatGemstonesArray(result),
      totalGemstones,
      cost.gemstoneCost || 0,
      cost.totalCost || 0,
      projectedQty
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 25 },
    { wch: 20 }, { wch: 15 },
    { wch: 70 }, // Gemstone array
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  
  // Apply green theme for gemstone sheet
  styleHeaders(worksheet, COLORS.GEMSTONE, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '💠 Gemstone Breakdown');
}

/**
 * Sheet 6: Metal Breakdown (Orange Theme)
 */
function addMetalBreakdownSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'SKU', 'Title', 'Description', 'Supplier Name',
    'MFG & Part #', 'Part #2',
    'Metal Purity', 'Metal Weight (g)', 'Casting Weight', 'Metal Cost', 'Total SKU Cost', 'Projected Weight (g)'
  ];

  const data = [headers];

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const spec = result.specifications || {};
    const enriched = result.enrichedData;
    const cost = result.costEstimation || {};
    
    const metalWeight = parseFloat(enriched?.metal_weight || '0');
    const projectedWeight = metalWeight > 0 ? (metalWeight * growthMultiplier).toFixed(2) : '';

    data.push([
      result.sku,
      spec.Title || '',
      spec.Description || '',
      spec['Supplier Name'] || spec.SupplierName || '',
      spec['MFG & Part #'] || spec.MfgPartNumber || '',
      spec['Part #2'] || spec.Part2 || '',
      enriched?.metal_purity || '',
      enriched?.metal_weight || '',
      spec['Casting Weight'] || spec.CastingWeight || '',
      cost.materialCost === 'ERROR' ? 0 : (cost.materialCost || 0),
      cost.totalCost || 0,
      projectedWeight
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 25 },
    { wch: 20 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
  ];
  
  // Apply orange theme for metal sheet
  styleHeaders(worksheet, COLORS.METAL, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '🔧 Metal Breakdown');
}

/**
 * Sheet 7: Parts & Components (Amber Theme)
 */
function addPartsComponentsSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'Supplier', 'MFG & Part #', 'MFG Part Cost', 'Part #2', 'Part #2 Cost', 'Total Parts Cost', 'SKU Count', 'Projected SKU Count'
  ];

  const data = [headers];

  // Aggregate by supplier and parts
  const partsCost = new Map<string, { 
    mfgPart: string; 
    part2: string; 
    mfgCost: number;
    part2Cost: number;
    totalCost: number;
    count: number;
  }>();

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const spec = result.specifications || {};
    const cost = result.costEstimation || {};
    const supplier = spec['Supplier Name'] || spec.SupplierName || 'Unknown';
    const mfgPart = spec['MFG & Part #'] || '';
    const part2 = spec['Part #2'] || '';
    
    // Extract individual part costs
    const mfgPartCost = cost.metalCostDetails?.details?.mfgPartPrice || 0;
    const part2PartCost = cost.metalCostDetails?.details?.part2Price || 0;
    const metalCost = cost.materialCost === 'ERROR' ? 0 : (cost.materialCost || 0);

    const key = `${supplier}|${mfgPart}|${part2}`;
    const existing = partsCost.get(key) || { 
      mfgPart, 
      part2, 
      mfgCost: 0,
      part2Cost: 0,
      totalCost: 0,
      count: 0 
    };
    
    existing.mfgCost += mfgPartCost;
    existing.part2Cost += part2PartCost;
    existing.totalCost += metalCost;
    existing.count += 1;
    partsCost.set(key, existing);
  });

  partsCost.forEach((value, key) => {
    const [supplier, mfgPart, part2] = key.split('|');
    const projectedCount = Math.ceil(value.count * growthMultiplier);
    
    data.push([
      supplier,
      mfgPart || 'N/A',
      value.mfgCost,
      part2 || 'N/A',
      value.part2Cost,
      value.totalCost,
      value.count,
      projectedCount
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 18 }
  ];
  
  // Apply amber theme for parts sheet
  styleHeaders(worksheet, COLORS.PARTS, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '⚙️ Parts & Components');
}

/**
 * Sheet 8: Earring Pairs Analysis
 */
function addEarringPairsAnalysisSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'SKU', 'Title', 'Description', 'Supplier Name',
    'MFG & Part #', 'Part #2', 'Earring Type', 
    'Diamond Per Earring', 'Diamond Per Pair',
    'Gemstone Per Earring', 'Gemstones Per Pair',
    'Total Stone Per Earring', 'Total Stone Per Pair',
    'Diamonds [(ID, carat, size, qty), ...]',
    'Gemstones [(ID, carat, size, qty), ...]',
    'Metal Purity', 'Metal Weight (g)',
    'Metal Cost', 'Labor Cost', 'Diamond Cost', 'Gemstone Cost', 'Total Cost', 'Projected Stone Per Pair'
  ];

  const data = [headers];

  analysis.processedSKUs.forEach(result => {
    if (!result.success || !isEarring(result)) return;

    const spec = result.specifications || {};
    const enriched = result.enrichedData;
    const cost = result.costEstimation || {};
    const diamonds = extractDiamondData(result);
    const gemstones = extractGemstoneData(result);
    
    const totalDiamonds = diamonds.reduce((sum, d) => sum + d.quantity, 0);
    const totalGemstones = gemstones.reduce((sum, g) => sum + g.quantity, 0);
    const totalStones = totalDiamonds + totalGemstones;
    
    // Calculate per earring (divide by 2 for pairs)
    const diamondPerEarring = totalDiamonds / 2;
    const gemstonePerEarring = totalGemstones / 2;
    const stonePerEarring = totalStones / 2;
    const projectedStonePair = Math.ceil(totalStones * growthMultiplier);

    data.push([
      result.sku,
      spec.Title || '',
      spec.Description || '',
      spec['Supplier Name'] || spec.SupplierName || '',
      spec['MFG & Part #'] || spec.MfgPartNumber || '',
      spec['Part #2'] || spec.Part2 || '',
      'Pair', // Earring Type
      diamondPerEarring,
      totalDiamonds,
      gemstonePerEarring,
      totalGemstones,
      stonePerEarring,
      totalStones,
      formatDiamondsArray(result),
      formatGemstonesArray(result),
      enriched?.metal_purity || '',
      enriched?.metal_weight || '',
      cost.materialCost === 'ERROR' ? 0 : (cost.materialCost || 0),
      cost.laborCost || 0,
      cost.diamondCost || 0,
      cost.gemstoneCost || 0,
      cost.totalCost || 0,
      projectedStonePair
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 25 },
    { wch: 20 }, { wch: 15 }, { wch: 10 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 18 }, { wch: 18 },
    { wch: 70 }, // Diamonds array
    { wch: 70 }, // Gemstones array
    { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 }
  ];
  
  // Apply styling
  styleHeaders(worksheet, COLORS.HEADER, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Earring Pairs Analysis');
}

/**
 * Sheet 8: Diamond Inventory
 */
function addDiamondInventorySheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'LookUpID', 'Quantity', 'DiamondSize', 'DiamondType', 'DiamondShape', 'Projected Qty'
  ];

  const data = [headers];

  // Aggregate diamond inventory
  const inventory = new Map<string, { quantity: number; size: any; type: string; shape: string }>();

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const diamonds = extractDiamondData(result);
    diamonds.forEach(diamond => {
      const lookupId = diamond.lookupCode || `${diamond.type}-${diamond.size}-${diamond.shape}`;
      const existing = inventory.get(lookupId) || { quantity: 0, size: diamond.size, type: diamond.type, shape: diamond.shape };
      existing.quantity += diamond.quantity * result.quantity; // Multiply by SKU quantity
      inventory.set(lookupId, existing);
    });
  });

  inventory.forEach((value, lookupId) => {
    const projectedQty = Math.ceil(value.quantity * growthMultiplier);
    
    data.push([
      lookupId,
      value.quantity,
      value.size,
      value.type,
      value.shape,
      projectedQty
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  
  // Apply blue theme for diamond inventory
  styleHeaders(worksheet, COLORS.DIAMOND, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '💎 Diamond Inventory');
}

/**
 * Sheet 9: Gemstone Inventory
 */
function addGemstoneInventorySheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'LookUpProductId', 'Quantity', 'GemstoneSize', 'GemstoneType', 'GemstoneShape', 'Projected Qty'
  ];

  const data = [headers];

  // Aggregate gemstone inventory
  const inventory = new Map<string, { quantity: number; size: string; type: string; shape: string }>();

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const gemstones = extractGemstoneData(result);
    gemstones.forEach(gemstone => {
      const lookupId = gemstone.lookupCode || `${gemstone.type}-${gemstone.size}-${gemstone.shape}`;
      const existing = inventory.get(lookupId) || { quantity: 0, size: gemstone.size, type: gemstone.type, shape: gemstone.shape };
      existing.quantity += gemstone.quantity * result.quantity; // Multiply by SKU quantity
      inventory.set(lookupId, existing);
    });
  });

  inventory.forEach((value, lookupId) => {
    const projectedQty = Math.ceil(value.quantity * growthMultiplier);
    
    data.push([
      lookupId,
      value.quantity,
      value.size,
      value.type,
      value.shape,
      projectedQty
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }
  ];
  
  // Apply green theme for gemstone inventory
  styleHeaders(worksheet, COLORS.GEMSTONE, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '💠 Gemstone Inventory');
}

/**
 * Sheet 10: Metal Inventory
 */
function addMetalInventorySheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'Metal Purity', 'Metal Weight', 'Total Metal Weight', 'Total Metal Cost', 'Projected Weight (g)'
  ];

  const data = [headers];

  // Aggregate metal inventory by purity
  const inventory = new Map<string, { weight: number; cost: number }>();

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const enriched = result.enrichedData;
    const cost = result.costEstimation || {};
    const purity = enriched?.metal_purity || 'Unknown';
    const weight = parseFloat(enriched?.metal_weight || '0');
    const metalCost = cost.materialCost === 'ERROR' ? 0 : (cost.materialCost || 0);

    const existing = inventory.get(purity) || { weight: 0, cost: 0 };
    existing.weight += weight * result.quantity;
    existing.cost += metalCost * result.quantity;
    inventory.set(purity, existing);
  });

  inventory.forEach((value, purity) => {
    const projectedWeight = (value.weight * growthMultiplier).toFixed(2);
    
    data.push([
      purity,
      '', // Individual weight (not applicable in aggregate)
      value.weight,
      value.cost,
      projectedWeight
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 18 }
  ];
  
  // Apply orange theme for metal inventory
  styleHeaders(worksheet, COLORS.METAL, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '🔧 Metal Inventory');
}

/**
 * Sheet 11: Suppliers Inventory
 */
function addSuppliersInventorySheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'Supplier Name', 'MFG & Part #', 'MFG & Part # QTY', 'MFG & Part # Cost',
    'Part #2', 'Part #2 QTY', 'Part #2 Cost', 'Total Supplier Cost', 'Projected MFG QTY', 'Projected Part #2 QTY'
  ];

  const data = [headers];

  // Aggregate by supplier
  const suppliers = new Map<string, {
    mfgPart: string;
    mfgQty: number;
    mfgCost: number;
    part2: string;
    part2Qty: number;
    part2Cost: number;
  }>();

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const spec = result.specifications || {};
    const cost = result.costEstimation || {};
    const supplier = spec['Supplier Name'] || spec.SupplierName || 'Unknown';
    const mfgPart = spec['MFG & Part #'] || '';
    const part2 = spec['Part #2'] || '';
    const qty = result.quantity;
    
    // Extract Part 2 and Part 3 costs from metalCostDetails
    const part2Cost = (cost.metalCostDetails?.details?.part2Price || 0) * qty;
    const part3Cost = (cost.metalCostDetails?.details?.mfgPartPrice || 0) * qty;

    const key = supplier;
    const existing = suppliers.get(key) || {
      mfgPart: mfgPart,
      mfgQty: 0,
      mfgCost: 0,
      part2: part2,
      part2Qty: 0,
      part2Cost: 0
    };
    
    existing.mfgQty += qty;
    existing.mfgCost += part3Cost; // MFG cost from part 3
    existing.part2Qty += qty;
    existing.part2Cost += part2Cost;
    
    suppliers.set(key, existing);
  });

  suppliers.forEach((value, supplier) => {
    const totalCost = value.mfgCost + value.part2Cost;
    const projectedMfgQty = Math.ceil(value.mfgQty * growthMultiplier);
    const projectedPart2Qty = Math.ceil(value.part2Qty * growthMultiplier);
    
    data.push([
      supplier,
      value.mfgPart,
      value.mfgQty,
      value.mfgCost,
      value.part2,
      value.part2Qty,
      value.part2Cost,
      totalCost,
      projectedMfgQty,
      projectedPart2Qty
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 18 },
    { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 20 }
  ];
  
  // Apply orange theme for suppliers sheet
  styleHeaders(worksheet, COLORS.PARTS, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '📦 Suppliers Inventory');
}

/**
 * Sheet 13: MFG & Part # Breakdown
 */
function addMfgPartBreakdownSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'SKU', 'Title', 'Description', 'Supplier Name',
    'MFG & Part #', 'Quantity', 'Part Cost', 'Total SKU Cost', 'Projected Qty'
  ];

  const data = [headers];

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const spec = result.specifications || {};
    const cost = result.costEstimation || {};
    const mfgPart = spec['MFG & Part #'] || spec.MfgPartNumber || '';
    
    if (!mfgPart) return; // Skip if no MFG part number

    const qty = result.quantity;
    const partCost = cost.metalCostDetails?.details?.mfgPartPrice || 0;
    const projectedQty = Math.ceil(qty * growthMultiplier);

    data.push([
      result.sku,
      spec.Title || '',
      spec.Description || '',
      spec['Supplier Name'] || spec.SupplierName || '',
      mfgPart,
      qty,
      partCost,
      cost.totalCost || 0,
      projectedQty
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 25 },
    { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  
  // Apply same theme as suppliers sheet
  styleHeaders(worksheet, COLORS.PARTS, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '🔩 MFG & Part # Breakdown');
}

/**
 * Sheet 14: Part #2 Breakdown
 */
function addPart2BreakdownSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  
  const headers = [
    'SKU', 'Title', 'Description', 'Supplier Name',
    'Part #2', 'Quantity', 'Part Cost', 'Total SKU Cost', 'Projected Qty'
  ];

  const data = [headers];

  analysis.processedSKUs.forEach(result => {
    if (!result.success) return;

    const spec = result.specifications || {};
    const cost = result.costEstimation || {};
    const part2 = spec['Part #2'] || spec.Part2 || '';
    
    if (!part2) return; // Skip if no Part #2

    const qty = result.quantity;
    const partCost = cost.metalCostDetails?.details?.part2Price || 0;
    const projectedQty = Math.ceil(qty * growthMultiplier);

    data.push([
      result.sku,
      spec.Title || '',
      spec.Description || '',
      spec['Supplier Name'] || spec.SupplierName || '',
      part2,
      qty,
      partCost,
      cost.totalCost || 0,
      projectedQty
    ] as any);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 25 },
    { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  
  // Apply same theme as suppliers sheet
  styleHeaders(worksheet, COLORS.PARTS, 0);

  XLSX.utils.book_append_sheet(workbook, worksheet, '⚙️ Part #2 Breakdown');
}

/**
 * Add failed SKUs sheet
 */
function addFailedSKUsSheet(workbook: XLSX.WorkBook, analysis: ForecastAnalysis) {
  const growthMultiplier = analysis.growthPercentage ? (1 + analysis.growthPercentage / 100) : 1;
  const failedSKUs = analysis.processedSKUs.filter(r => !r.success);

  const data = [
    ['FAILED SKUs'],
    [''],
    ['SKU', 'Quantity', 'Error Message', 'Projected Qty']
  ];

  failedSKUs.forEach(result => {
    const projectedQty = Math.ceil(result.quantity * growthMultiplier);
    
    data.push([
      result.sku,
      result.quantity,
      result.error || 'Unknown error',
      projectedQty
    ] as any);
  });

  if (failedSKUs.length === 0) {
    data.push(['✅ No failed SKUs - All processed successfully!']);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 10 }, { wch: 60 }
  ];

  // Apply error color theme if there are failures
  if (failedSKUs.length > 0) {
    styleHeaders(worksheet, COLORS.ERROR, 2);
  } else {
    styleHeaders(worksheet, COLORS.SUCCESS, 2);
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, failedSKUs.length > 0 ? '⚠️ Failed SKUs' : '✅ All Successful');
}

/**
 * Convert workbook to buffer for download
 */
export function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string = 'forecast'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}-${timestamp}.xlsx`;
}
