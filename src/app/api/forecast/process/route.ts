/**
 * API Route for processing forecast data
 * Handles batch SKU processing and generates Excel reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { processBatchSKUs, type SKUInput } from '@/services/forecast-processor';
import { generateForecastSpreadsheet, workbookToBuffer, generateFilename } from '@/services/spreadsheet-generator';
import { fetchAllFreshPricingData, updateCacheWithFreshData } from '@/services/pricing-source';

export const maxDuration = 300; // 5 minutes for large batches
export const dynamic = 'force-dynamic';

interface ProcessRequest {
  skuData: SKUInput[];
  growthPercentage?: number;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();
    const { skuData, growthPercentage, email } = body;

    // Validate input
    if (!skuData || !Array.isArray(skuData) || skuData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: skuData must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate SKU data structure
    for (const item of skuData) {
      if (!item.sku || typeof item.sku !== 'string') {
        return NextResponse.json(
          { error: 'Invalid SKU data: each item must have a valid SKU string' },
          { status: 400 }
        );
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for SKU ${item.sku}: must be a positive number` },
          { status: 400 }
        );
      }
    }

    // Limit batch size to prevent timeouts (adjust as needed)
    if (skuData.length > 100) {
      return NextResponse.json(
        { error: 'Batch size too large. Maximum 100 SKUs per request. For larger batches, please contact support.' },
        { status: 400 }
      );
    }

    console.log(`Processing forecast for ${skuData.length} SKUs...`);

    // Fetch fresh pricing data
    console.log('Fetching fresh pricing data...');
    const freshPricingData = await fetchAllFreshPricingData();
    updateCacheWithFreshData(freshPricingData);
    console.log('Fresh pricing data loaded successfully');

    // Process all SKUs
    const analysis = await processBatchSKUs(skuData, growthPercentage);

    console.log(`Processing complete. Success: ${analysis.summary.successfulSKUs}/${analysis.summary.totalSKUs}`);

    // Generate Excel spreadsheet
    const workbook = generateForecastSpreadsheet(analysis, {
      includeRawData: true,
      includeDetailedBreakdowns: true,
    });

    // Convert to buffer
    const buffer = workbookToBuffer(workbook);

    // If email is provided, send via email (implement later with cloud function)
    if (email) {
      console.log(`Email requested: ${email} (email functionality to be implemented)`);
      // TODO: Implement email sending via cloud function
    }

    // Return file as download
    const filename = generateFilename('forecast-analysis');
    
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Total-SKUs': analysis.summary.totalSKUs.toString(),
        'X-Successful-SKUs': analysis.summary.successfulSKUs.toString(),
        'X-Failed-SKUs': analysis.summary.failedSKUs.toString(),
      },
    });

  } catch (error) {
    console.error('Error processing forecast:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process forecast',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint for status/health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'forecast-processor',
    version: '1.0.0',
    maxBatchSize: 100,
  });
}
