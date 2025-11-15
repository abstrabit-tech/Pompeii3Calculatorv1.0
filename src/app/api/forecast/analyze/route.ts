/**
 * API Route for AI-powered forecast analysis
 * Analyzes uploaded forecast Excel files and provides insights
 */

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { analyzeForecastFlow } from '@/ai/flows/analyze-forecast';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Extract data from Executive Summary sheet (try both with and without emoji)
    const summarySheet = workbook.Sheets['📊 Executive Summary'] || workbook.Sheets['Executive Summary'];
    if (!summarySheet) {
      console.log('Available sheets:', Object.keys(workbook.Sheets));
      return NextResponse.json(
        { error: 'Invalid forecast file: Missing Executive Summary sheet. Available sheets: ' + Object.keys(workbook.Sheets).join(', ') },
        { status: 400 }
      );
    }

    // Parse the summary data
    const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 }) as any[][];
    
    console.log('Summary sheet data (first 20 rows):', summaryData.slice(0, 20));
    
    // Extract key metrics - adjusted for actual Excel structure
    const extractValue = (row: number, col: number): number => {
      const value = summaryData[row]?.[col];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const cleaned = value.replace(/[$,]/g, '');
        return parseFloat(cleaned) || 0;
      }
      return 0;
    };

    // Find rows by searching for labels
    const findRowByLabel = (searchText: string): number => {
      for (let i = 0; i < summaryData.length; i++) {
        const cellValue = String(summaryData[i]?.[0] || '').toLowerCase();
        if (cellValue.includes(searchText.toLowerCase())) {
          return i;
        }
      }
      return -1;
    };

    // Extract metrics using the row finder
    let totalSKUs = 0;
    let successfulSKUs = 0;
    let failedSKUs = 0;
    let totalCost = 0;
    let diamondCost = 0;
    let gemstoneCost = 0;
    let metalCost = 0;
    let laborCost = 0;
    let part2Cost = 0;
    let part3Cost = 0;
    let growthPercentage = 0;
    let projectedCost = 0;

    // Parse using row finder
    const totalSKUsRow = findRowByLabel('Total SKUs Processed');
    if (totalSKUsRow >= 0) totalSKUs = extractValue(totalSKUsRow, 1);
    
    const successfulRow = findRowByLabel('Successfully Analyzed');
    if (successfulRow >= 0) successfulSKUs = extractValue(successfulRow, 1);
    
    const failedRow = findRowByLabel('Failed Analysis');
    if (failedRow >= 0) failedSKUs = extractValue(failedRow, 1);
    
    const totalCostRow = findRowByLabel('Total Estimated Cost');
    if (totalCostRow >= 0) totalCost = extractValue(totalCostRow, 1);
    
    const diamondRow = findRowByLabel('Diamond Cost');
    if (diamondRow >= 0) diamondCost = extractValue(diamondRow, 1);
    
    const gemstoneRow = findRowByLabel('Gemstone Cost');
    if (gemstoneRow >= 0) gemstoneCost = extractValue(gemstoneRow, 1);
    
    const metalRow = findRowByLabel('Metal Cost');
    if (metalRow >= 0) metalCost = extractValue(metalRow, 1);
    
    const laborRow = findRowByLabel('Labor Cost');
    if (laborRow >= 0) laborCost = extractValue(laborRow, 1);
    
    const part2Row = findRowByLabel('Part 2 Cost');
    if (part2Row >= 0) part2Cost = extractValue(part2Row, 1);
    
    const part3Row = findRowByLabel('Part 3 Cost');
    if (part3Row >= 0) part3Cost = extractValue(part3Row, 1);
    
    const growthRow = findRowByLabel('Growth Percentage Applied');
    if (growthRow >= 0) {
      const rawValue = summaryData[growthRow]?.[1];
      if (typeof rawValue === 'string' && rawValue.includes('%')) {
        growthPercentage = parseFloat(rawValue.replace('%', '')) || 0;
      } else {
        growthPercentage = extractValue(growthRow, 1);
      }
    }
    
    const projectedRow = findRowByLabel('Projected Total Cost');
    if (projectedRow >= 0) projectedCost = extractValue(projectedRow, 1);

    console.log('Extracted values:', {
      totalSKUs,
      successfulSKUs,
      failedSKUs,
      totalCost,
      diamondCost,
      gemstoneCost,
      metalCost,
      laborCost,
      part2Cost,
      part3Cost,
      growthPercentage,
      projectedCost,
    });

    // Extract top SKUs from SKU Breakdown sheet
    const skuSheet = workbook.Sheets['🔍 SKU Breakdown'] || workbook.Sheets['SKU Breakdown'];
    const topSKUs: Array<{ sku: string; quantity: number; totalCost: number }> = [];
    
    if (skuSheet) {
      const skuData = XLSX.utils.sheet_to_json(skuSheet) as any[];
      skuData.forEach((row) => {
        if (row.SKU && row.Quantity && row['Total SKU Cost']) {
          topSKUs.push({
            sku: String(row.SKU),
            quantity: Number(row.Quantity) || 0,
            totalCost: Number(row['Total SKU Cost']) || 0,
          });
        }
      });
      // Sort by cost and take top 10
      topSKUs.sort((a, b) => b.totalCost - a.totalCost);
    }

    console.log('Top SKUs extracted:', topSKUs.length);

    // Calculate total costs including parts
    const calculatedTotalCost = totalCost || (diamondCost + gemstoneCost + metalCost + laborCost + part2Cost + part3Cost);

    // Call AI flow for analysis
    const analysis = await analyzeForecastFlow({
      forecastData: {
        totalSKUs,
        successfulSKUs,
        failedSKUs,
        totalCost: calculatedTotalCost,
        diamondCost,
        gemstoneCost,
        metalCost,
        laborCost,
        growthPercentage: growthPercentage || undefined,
        projectedCost: projectedCost || undefined,
      },
      topSKUs: topSKUs.slice(0, 10),
      costBreakdown: {
        diamonds: diamondCost,
        gemstones: gemstoneCost,
        metals: metalCost,
        labor: laborCost + part2Cost + part3Cost, // Include part costs in labor
      },
    });

    // Add enhanced metrics to the response
    const enhancedAnalysis = {
      ...analysis,
      totalCost: calculatedTotalCost,
      totalSKUs,
      successRate: totalSKUs > 0 ? (successfulSKUs / totalSKUs) * 100 : 0,
      growthRate: growthPercentage || 0,
      projectedCost: projectedCost || calculatedTotalCost,
    };

    return NextResponse.json(enhancedAnalysis);
  } catch (err) {
    console.error('Forecast analysis error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to analyze forecast' },
      { status: 500 }
    );
  }
}
