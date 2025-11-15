# Forecast Feature - Quick Start Guide

## What is the Forecast Feature?

The Forecast feature allows you to process multiple SKUs at once and get comprehensive cost analysis reports. Perfect for:
- Budget planning
- Cost forecasting
- Bulk SKU analysis
- Inventory cost estimation
- Growth projections

## Step-by-Step Guide

### Step 1: Prepare Your Data

Create a spreadsheet (CSV or Excel) with two columns:

| SKU          | Quantity |
|--------------|----------|
| ABC-123      | 10       |
| XYZ-456      | 25       |
| DEF-789      | 5        |

**Important**:
- Column A = SKU codes
- Column B = Quantities (must be positive numbers)
- First row should be headers (will be skipped)
- Save as `.csv`, `.xlsx`, or `.xls`

### Step 2: Access the Forecast Page

1. Click **Forecast** in the sidebar (graph icon)
2. You'll see the Forecast Analysis page

### Step 3: Upload Your File

1. Click **Download Template** if you need a sample format
2. Click **Choose File** or drag and drop your file
3. Wait for validation (you'll see a preview of first 10 SKUs)

### Step 4: Configure Options (Optional)

**Growth Percentage**:
- Enter a percentage (e.g., `10` for 10% growth)
- This will calculate projected costs with growth
- Leave blank if you don't need growth projections

**Email**:
- Enter your email to receive the report
- Currently for tracking - download happens automatically
- Future: Email delivery for large batches

### Step 5: Process

1. Click **Process Forecast**
2. Wait for processing (may take a few minutes for large batches)
3. Progress bar will show status
4. File will download automatically when complete

### Step 6: Review Results

The downloaded Excel file contains multiple sheets:

#### Summary Sheet
- Overall statistics
- Total costs by category
- Success/failure rates
- Growth projections

#### SKU Breakdown Sheet
- Cost details for each SKU
- Diamond, gemstone, metal, labor costs
- Total cost per SKU

#### Diamond Analysis Sheet
- Breakdown by diamond type (Natural/Lab)
- Quantities and costs
- Detailed diamond specifications

#### Gemstone Analysis Sheet
- Breakdown by gemstone type
- Quantities and costs
- Detailed gemstone specifications

#### Metal Analysis Sheet
- Breakdown by metal type
- Total weight and costs
- Cost per gram

#### Manufacturing Sheet
- Part 2 costs (Additional Parts)
- Part 3 costs (Finishing)
- Labor costs
- Per-SKU breakdown

#### Failed SKUs Sheet
- List of SKUs that couldn't be processed
- Error messages
- Empty if all successful

## Tips & Best Practices

### File Preparation
✅ **DO**:
- Use the provided template
- Ensure quantities are positive numbers
- Remove empty rows
- Use valid SKU codes from your inventory

❌ **DON'T**:
- Include special characters in quantities
- Leave quantity cells empty
- Mix SKUs from different catalogs
- Upload files larger than 100 SKUs (use batches)

### Batch Sizes
- **Small (1-10 SKUs)**: ~1-2 minutes
- **Medium (10-50 SKUs)**: ~3-5 minutes
- **Large (50-100 SKUs)**: ~5-10 minutes

For batches over 100 SKUs, split into multiple files.

### Growth Projections
- Use realistic growth percentages (typically 5-20%)
- Percentage applies to total estimated cost
- Useful for:
  - Annual budget planning
  - Multi-year forecasts
  - Market expansion scenarios

### Troubleshooting

**"File parsing error"**
- Check file format (.csv, .xlsx, .xls)
- Ensure proper column structure
- Remove special characters

**"Invalid quantity"**
- Quantities must be positive numbers
- No decimals in quantity column
- Remove any text from quantity cells

**"SKU not found"**
- Verify SKU exists in ChannelAdvisor
- Check for typos in SKU codes
- Ensure SKU is active

**"Processing timeout"**
- Reduce batch size
- Check internet connection
- Try processing in smaller chunks

**Some SKUs failed**
- Check "Failed SKUs" sheet for error details
- Successful SKUs are still included in report
- Fix errors and re-run failed SKUs separately

## Examples

### Example 1: Simple Forecast
```csv
SKU,Quantity
RING-001,10
NECK-002,15
BRAC-003,5
```

Result: Basic cost analysis for 30 total items

### Example 2: Growth Projection
Same file, but add **Growth Percentage: 15**

Result: Shows current costs + 15% growth projection

### Example 3: Large Batch
```csv
SKU,Quantity
RING-001,100
RING-002,75
RING-003,50
... (up to 100 rows)
```

Result: Comprehensive analysis with all breakdowns

## Advanced Features

### Email Delivery (Coming Soon)
For very large batches:
1. Enter your email
2. Submit job
3. Receive email with report when complete

### API Integration
For programmatic access:
```bash
POST /api/forecast/process
Content-Type: application/json

{
  "skuData": [
    {"sku": "ABC-123", "quantity": 10},
    {"sku": "XYZ-456", "quantity": 25}
  ],
  "growthPercentage": 10
}
```

## FAQs

**Q: How many SKUs can I process at once?**
A: Currently limited to 100 SKUs per request. For larger batches, split into multiple files.

**Q: Can I process the same SKU multiple times?**
A: Yes, each row is processed independently. Useful for different quantity scenarios.

**Q: What if I don't have quantities?**
A: Use `1` as the quantity to get per-unit costs.

**Q: Can I edit the template?**
A: Yes, but maintain the column structure (SKU in A, Quantity in B).

**Q: How accurate are the cost estimates?**
A: Estimates use the same logic as the SKU Analyzer, pulling from live pricing data.

**Q: Can I export to PDF?**
A: Currently Excel only. You can open the Excel file and save as PDF.

**Q: Is my data saved?**
A: No, processing is done in real-time. Reports are generated on-demand.

## Support

Need help? 
- Review the Failed SKUs sheet for error details
- Check the main [Forecast Documentation](./FORECAST_FEATURE.md)
- Contact the development team

## Next Steps

After reviewing your forecast:
1. Use insights for budget planning
2. Identify high-cost SKUs
3. Analyze material distribution
4. Plan inventory based on costs
5. Share reports with stakeholders

Happy Forecasting! 📊
