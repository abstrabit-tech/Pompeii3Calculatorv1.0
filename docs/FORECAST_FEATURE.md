# Forecast Feature Documentation

## Overview

The Forecast feature allows users to upload multiple SKUs with quantities in a CSV or Excel file, process them through the existing cost calculation logic, and receive a comprehensive analysis report with detailed breakdowns.

## Features

### 1. File Upload & Processing
- **Supported Formats**: CSV (.csv), Excel (.xlsx, .xls)
- **Input Structure**: 
  - Column A: SKU
  - Column B: Quantity
- **Batch Size**: Up to 100 SKUs per request (can be increased)
- **Template**: Download template available in the UI

### 2. Growth Projection
- Optional growth percentage input
- Calculates projected costs with growth
- Useful for budget planning and forecasting

### 3. Comprehensive Analysis Output

The generated Excel file contains multiple sheets:

#### Sheet 1: Executive Summary
- Total SKUs processed
- Success/failure rates
- Total costs by category (Diamond, Gemstone, Metal, Labor, Part 2, Part 3)
- Percentage breakdown
- Growth projections (if applicable)

#### Sheet 2: SKU Breakdown
- SKU-wise cost analysis
- Quantity and unit costs
- Total costs per SKU
- All cost components (diamonds, gemstones, metal, labor, parts)
- Status and error messages

#### Sheet 3: Diamond Analysis
- Breakdown by diamond type (Natural/Lab)
- Total quantities and costs
- Average cost per unit
- Detailed diamond bill for each SKU with:
  - Diamond type, shape, size, carat
  - Quantity, unit price, total price

#### Sheet 4: Gemstone Analysis
- Breakdown by gemstone type
- Total quantities and costs
- Detailed gemstone bill for each SKU with:
  - Gemstone type, shape, size, carat
  - Quantity, unit price, total price

#### Sheet 5: Metal Analysis
- Breakdown by metal type
- Total weight and costs
- Average cost per gram
- Detailed metal breakdown per SKU with:
  - Metal type, purity, weight
  - Price per gram, total cost

#### Sheet 6: Manufacturing Breakdown
- Part 2 costs (Additional Parts)
- Part 3 costs (Finishing)
- Labor costs
- Percentage breakdown
- Detailed per-SKU manufacturing costs

#### Sheet 7: Failed SKUs
- List of SKUs that failed processing
- Error messages for each failure
- Empty if all SKUs processed successfully

#### Sheet 8: Raw Data (Optional)
- Complete product specifications
- Title, description, supplier info
- Metal and stone details

## Architecture

### Frontend Components

#### `/src/app/forecast/page.tsx`
Main forecast page with:
- Feature overview cards
- Upload interface
- Instructions and documentation

#### `/src/components/forecast/forecast-upload.tsx`
Upload component with:
- File upload handling (CSV/Excel)
- File parsing and validation
- Growth percentage input
- Email input (optional)
- Preview of uploaded data
- Progress tracking
- Error and success handling

### Backend Services

#### `/src/services/forecast-processor.ts`
Core processing service:
- `processSingleSKU()`: Process individual SKU with full cost calculation
- `processBatchSKUs()`: Process multiple SKUs sequentially
- `generateForecastAnalysis()`: Generate comprehensive analysis from results

**Key Functions**:
```typescript
export async function processSingleSKU(skuInput: SKUInput): Promise<ProcessedSKUResult>
export async function processBatchSKUs(skuInputs: SKUInput[], growthPercentage?: number): Promise<ForecastAnalysis>
```

#### `/src/services/spreadsheet-generator.ts`
Excel report generation:
- `generateForecastSpreadsheet()`: Create complete workbook
- Individual sheet generators for each analysis type
- Formatting and styling
- Column width optimization

**Key Functions**:
```typescript
export function generateForecastSpreadsheet(analysis: ForecastAnalysis, options?: SpreadsheetGeneratorOptions): XLSX.WorkBook
export function workbookToBuffer(workbook: XLSX.WorkBook): Buffer
export function generateFilename(prefix?: string): string
```

### API Routes

#### `/src/app/api/forecast/process/route.ts`
Main API endpoint:
- **Method**: POST
- **Input**: 
  ```json
  {
    "skuData": [{"sku": "SKU123", "quantity": 10}],
    "growthPercentage": 10,
    "email": "user@example.com"
  }
  ```
- **Output**: Excel file download
- **Features**:
  - Input validation
  - Batch size limits
  - Fresh pricing data fetch
  - Sequential SKU processing
  - Excel generation
  - File download response

- **Method**: GET
- **Output**: Health check and API info

### Cloud Functions (Python)

#### `/functions/forecast_processor.py`
Python cloud functions for:
1. **process_forecast_batch**: Handle large batches
2. **send_forecast_email**: Email delivery with attachments
3. **process_chunk**: Parallel processing for very large batches

**Email Configuration**:
```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

## Data Flow

1. **User Upload**:
   - User uploads CSV/Excel file
   - File is parsed client-side using `xlsx` or `papaparse`
   - Data validated and previewed

2. **Submission**:
   - SKU data sent to `/api/forecast/process`
   - API validates input and batch size
   - Fresh pricing data loaded

3. **Processing**:
   - Each SKU processed sequentially:
     - Fetch from ChannelAdvisor
     - Enrich specifications (AI)
     - Estimate costs (AI + calculators)
     - Extract breakdowns
   - Results aggregated into analysis

4. **Report Generation**:
   - Forecast analysis compiled
   - Excel workbook created with all sheets
   - Formatting and calculations applied

5. **Delivery**:
   - File converted to buffer
   - Sent as download response
   - Optionally emailed (via cloud function)

## Usage Examples

### Basic Upload
1. Click "Download Template"
2. Fill in SKUs and quantities
3. Upload file
4. Click "Process Forecast"
5. Download generated report

### With Growth Projection
1. Upload SKU file
2. Enter growth percentage (e.g., 15 for 15%)
3. Process forecast
4. See projected costs in summary sheet

### Email Delivery (Future)
1. Upload SKU file
2. Enter email address
3. Process forecast
4. Receive email with attached report

## Error Handling

### Client-Side
- File format validation
- Empty file detection
- Invalid quantity detection
- CSV/Excel parsing errors
- Network errors

### Server-Side
- Input validation
- Batch size limits
- SKU not found errors
- API failures
- Calculation errors
- Individual SKU failures (continue processing)

### Error Recovery
- Failed SKUs reported in separate sheet
- Partial results still generated
- Detailed error messages included

## Performance Considerations

### Current Limits
- **Max SKUs per request**: 100
- **Timeout**: 5 minutes (configured in route)
- **Processing**: Sequential (prevents API overload)

### Optimization Strategies
1. **Sequential Processing**: Prevents overwhelming external APIs
2. **Fresh Pricing Cache**: Loaded once per request
3. **Error Continuation**: Don't fail entire batch on single error
4. **Stream Processing**: Future enhancement for very large batches

### For Large Batches (100+)
Use Python cloud functions:
- Split into chunks
- Process in parallel
- Aggregate results
- Email delivery

## Future Enhancements

### Planned Features
- [ ] Real-time progress updates (WebSocket/SSE)
- [ ] Email delivery integration
- [ ] Cloud storage for large files
- [ ] Historical analysis comparison
- [ ] Export to PDF option
- [ ] Interactive charts in Excel
- [ ] Batch scheduling
- [ ] API rate limiting
- [ ] Caching for repeated SKUs
- [ ] Parallel processing option

### Advanced Analytics
- [ ] Cost trend analysis
- [ ] Supplier comparison
- [ ] Material price forecasting
- [ ] Seasonal adjustments
- [ ] Multi-scenario modeling
- [ ] Custom breakdowns
- [ ] Data visualization dashboard

## Testing

### Manual Testing
1. **Small Batch**: Test with 5-10 SKUs
2. **Large Batch**: Test with 50-100 SKUs
3. **Invalid SKUs**: Test error handling
4. **Growth Percentage**: Test projections
5. **File Formats**: Test CSV and Excel
6. **Edge Cases**: Empty quantities, special characters

### Automated Testing
```typescript
// Example test structure
describe('Forecast Processor', () => {
  it('should process single SKU successfully', async () => {
    const result = await processSingleSKU({ sku: 'TEST-001', quantity: 10 });
    expect(result.success).toBe(true);
  });
  
  it('should handle batch processing', async () => {
    const analysis = await processBatchSKUs([...skuInputs]);
    expect(analysis.summary.totalSKUs).toBe(skuInputs.length);
  });
});
```

## Troubleshooting

### Common Issues

**File Upload Fails**
- Check file format (must be .csv, .xlsx, or .xls)
- Ensure file has header row
- Verify SKUs are in column A, quantities in column B

**Processing Timeout**
- Reduce batch size
- Check network connectivity
- Verify API endpoints are accessible

**Invalid Cost Calculations**
- Verify pricing data is accessible
- Check SKU exists in ChannelAdvisor
- Review error messages in Failed SKUs sheet

**Email Not Received**
- Verify email configuration in cloud functions
- Check spam folder
- Ensure cloud function is deployed

## Deployment

### Prerequisites
```bash
npm install xlsx papaparse @types/papaparse
```

### Build and Deploy
```bash
# Build Next.js app
npm run build

# Deploy to Firebase/Vercel
firebase deploy
# or
vercel deploy

# Deploy cloud functions (optional)
cd functions
firebase deploy --only functions
```

## API Reference

### POST /api/forecast/process

**Request**:
```json
{
  "skuData": [
    {
      "sku": "string",
      "quantity": number
    }
  ],
  "growthPercentage": number (optional),
  "email": "string" (optional)
}
```

**Response**:
- Success: Excel file download (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
- Error: JSON with error details

**Headers**:
- `X-Total-SKUs`: Total number of SKUs processed
- `X-Successful-SKUs`: Number of successfully processed SKUs
- `X-Failed-SKUs`: Number of failed SKUs

### GET /api/forecast/process

**Response**:
```json
{
  "status": "ok",
  "endpoint": "forecast-processor",
  "version": "1.0.0",
  "maxBatchSize": 100
}
```

## Support

For issues or questions:
1. Check the Failed SKUs sheet for error messages
2. Review logs in Firebase Console
3. Contact development team

## License

Copyright © 2024 Pompeii3. All rights reserved.
