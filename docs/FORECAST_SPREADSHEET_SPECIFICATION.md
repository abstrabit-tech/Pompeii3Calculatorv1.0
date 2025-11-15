# Forecast Feature - Complete Spreadsheet Documentation

## Overview

The forecast feature generates a comprehensive Excel workbook with **12 detailed sheets**, providing complete analysis across all dimensions of jewelry cost estimation.

## Complete Sheet List

### 1. **Summary** - Executive Overview
High-level metrics and cost breakdowns.

### 2. **All SKUs Detailed** - Complete 32+ Column Dataset
Every SKU with all 32 data points including multiple diamonds/gemstones.

### 3. **Diamond Breakdown** - Diamond-Focused Analysis
All SKUs with diamonds, including detailed diamond specifications.

### 4. **Gemstone Breakdown** - Gemstone-Focused Analysis
All SKUs with gemstones, including detailed gemstone specifications.

### 5. **Metal Breakdown** - Metal Analysis
Metal purity, weight, and costs for all SKUs.

### 6. **Parts & Components** - Manufacturing Parts
Supplier-wise breakdown of parts and associated costs.

### 7. **Earring Pairs Analysis** - Specialized Earring Data
Detailed analysis for earring pairs with per-earring calculations.

### 8. **Diamond Inventory** - Aggregated Diamond Stock
Total diamond inventory by type, size, shape with lookup IDs.

### 9. **Gemstone Inventory** - Aggregated Gemstone Stock
Total gemstone inventory by type, size, shape with lookup IDs.

### 10. **Metal Inventory** - Aggregated Metal Stock
Total metal inventory by purity with weights and costs.

### 11. **Suppliers Inventory** - Supplier Analysis
Complete supplier breakdown with part numbers, quantities, and costs.

### 12. **Failed SKUs** - Error Tracking
List of SKUs that failed processing with error details.

---

## Detailed Sheet Specifications

### Sheet 1: Summary
**Purpose**: Executive dashboard with key metrics

**Columns**:
- Total SKUs Processed
- Successful SKUs
- Failed SKUs
- Success Rate
- Total Quantity
- Total Estimated Cost
- Average Cost Per Unit
- Cost Breakdown by Category (Diamond, Gemstone, Metal, Labor, Part 2, Part 3)
- Growth Projection (if applicable)

---

### Sheet 2: All SKUs Detailed
**Purpose**: Complete dataset with all 32+ data points

**Columns** (45 total):
1. SKU
2. Title
3. Description
4. Exact Carat Total Weight
5. Right Weight
6. Width
7. Weight
8. Main Stone
9. Casting Weight
10. Supplier Name
11. MFG & Part #
12. Part #2
13-24. **Diamond Data** (sorted by size, largest first):
    - DiamondType1, DiamondType2
    - DiamondSize1, DiamondSize2
    - DiamondQuantity1, DiamondQuantity2
    - DiamondCaratValue1, DiamondCaratValue2
    - DiamondShape1, DiamondShape2
    - DiamondLookUp1, DiamondLookUp2
    - TotalDiamonds
25-36. **Gemstone Data** (sorted by size, largest first):
    - GemstoneType1, GemstoneType2
    - GemstoneSize1, GemstoneSize2
    - GemstoneQuantity1, GemstoneQuantity2
    - GemstoneCarat1, GemstoneCarat2
    - GemstoneShape1, GemstoneShape2
    - GemstoneLookUp1, GemstoneLookUp2
    - TotalGemstones
37-40. **Metal Data**:
    - MetalPurity1, MetalPurity2
    - MetalWeight1, MetalWeight2
41-44. **Cost Data**:
    - Metal Cost
    - Labor Cost
    - Diamond Cost
    - Gemstone Cost

**Key Features**:
- ✅ Multiple diamonds/gemstones sorted by size (largest first)
- ✅ Separate columns for up to 2 diamond types
- ✅ Separate columns for up to 2 gemstone types
- ✅ All 32 original columns included
- ✅ Extended with additional breakdown columns

---

### Sheet 3: Diamond Breakdown
**Purpose**: Focus on SKUs containing diamonds

**Columns** (26 total):
- SKU, Title, Description
- Product details (Carat Weight, Right Weight, Width, Weight, Main Stone, Casting Weight)
- Supplier info (Supplier Name, MFG & Part #, Part #2)
- **Diamond Details**:
  - DiamondType1, DiamondType2
  - DiamondSize1, DiamondSize2
  - DiamondQuantity1, DiamondQuantity2
  - DiamondCaratValue1, DiamondCaratValue2
  - DiamondShape1, DiamondShape2
  - DiamondLookUp1, DiamondLookUp2
  - TotalDiamonds
- Diamond Cost

**Filtering**: Only includes SKUs with diamonds

---

### Sheet 4: Gemstone Breakdown
**Purpose**: Focus on SKUs containing gemstones

**Columns** (26 total):
- SKU, Title, Description
- Product details
- Supplier info
- **Gemstone Details**:
  - GemstoneType1, GemstoneType2
  - GemstoneSize1, GemstoneSize2
  - GemstoneQuantity1, GemstoneQuantity2
  - GemstoneCarat1, GemstoneCarat2
  - GemstoneShape1, GemstoneShape2
  - GemstoneLookupId1, GemstoneLookupId2
  - TotalGemstones
- Gemstone Cost

**Filtering**: Only includes SKUs with gemstones

---

### Sheet 5: Metal Breakdown
**Purpose**: Metal analysis for all SKUs

**Columns** (15 total):
- SKU, Title, Description
- Product details
- Supplier info
- **Metal Details**:
  - Metal Purity
  - Metal Weight
  - Metal Cost

---

### Sheet 6: Parts & Components
**Purpose**: Supplier parts aggregation

**Columns**:
- Supplier Name
- MFG & Part #
- Part #2
- Metal Cost (aggregated)

**Aggregation**: Groups by supplier and part numbers

---

### Sheet 7: Earring Pairs Analysis
**Purpose**: Specialized analysis for earring SKUs

**Columns** (38 total):
- SKU, Title, Description
- Product details
- Supplier info
- **Earring Specific**:
  - Earring Type (Pair/Single)
  - Gemstone Per Earring
  - Gemstones Per Pair
  - Diamond Per Earring
  - Diamond Per Pair
  - Total Stone Per Earring
  - Total Stone Per Pair
  - Setting Type
  - Back Type
  - Notes
- Diamond details (Type, Quantity, Carat, Shape)
- Gemstone details (Type, Quantity, Size, Shape, Carat)
- Metal details (Purity, Weight)
- Costs (Metal, Labor, Diamond, Gemstone)

**Detection**: Automatically identifies earrings from title/description
**Calculations**: Per-earring values calculated by dividing pair totals by 2

---

### Sheet 8: Diamond Inventory
**Purpose**: Aggregated diamond inventory across all SKUs

**Columns**:
- LookUpID (unique identifier)
- Quantity (total across all SKUs)
- DiamondSize
- DiamondType (Natural/Lab)
- DiamondShape

**Aggregation**: 
- Groups by LookUpID (or Type-Size-Shape)
- Multiplies quantities by SKU order quantities
- Provides total inventory requirements

**Use Case**: Order diamonds from suppliers based on total needs

---

### Sheet 9: Gemstone Inventory
**Purpose**: Aggregated gemstone inventory across all SKUs

**Columns**:
- LookUpProductId (unique identifier)
- Quantity (total across all SKUs)
- GemstoneSize
- GemstoneType
- GemstoneShape

**Aggregation**:
- Groups by LookUpProductId
- Multiplies quantities by SKU order quantities
- Provides total inventory requirements

**Use Case**: Order gemstones from suppliers based on total needs

---

### Sheet 10: Metal Inventory
**Purpose**: Aggregated metal inventory by purity

**Columns**:
- Metal Purity (14K, 18K, etc.)
- Metal Weight (individual - not used in aggregate)
- Total Metal Weight (sum across all SKUs)
- Total Metal Cost

**Aggregation**:
- Groups by metal purity
- Sums weights and costs
- Accounts for SKU quantities

**Use Case**: Order raw metal materials by purity type

---

### Sheet 11: Suppliers Inventory
**Purpose**: Complete supplier cost breakdown

**Columns**:
- Supplier Name
- MFG & Part # (main manufacturing part)
- MFG & Part # QTY (quantity ordered)
- MFG & Part # Cost (total cost for MFG parts)
- Part #2 (secondary part number)
- Part #2 QTY (quantity ordered)
- Part #2 Cost (total cost for Part #2)
- Total Supplier Cost (combined cost)

**Aggregation**:
- Groups by supplier
- Sums quantities and costs
- Separates MFG part and Part #2 costs

**Use Case**: Vendor management, supplier negotiations, cost tracking

---

### Sheet 12: Failed SKUs
**Purpose**: Error tracking and troubleshooting

**Columns**:
- SKU
- Quantity
- Error Message

**Content**:
- Lists SKUs that failed processing
- Provides detailed error messages
- Shows "No failed SKUs" if all successful

**Use Case**: Identify and fix problematic SKUs

---

## Data Extraction Rules

### Multiple Diamonds/Gemstones Sorting

When a SKU contains multiple diamond or gemstone types:

1. **Extract all types** from enriched data
2. **Sort by size** (largest first)
3. **Populate columns sequentially**:
   - Type1 = largest
   - Type2 = second largest
   - Additional types omitted (can be extended)

**Example**:
```
Diamond 1: 5mm Natural Round
Diamond 2: 3mm Lab Marquise
Diamond 3: 2mm Natural Princess

Result:
DiamondType1 = Natural, DiamondSize1 = 5
DiamondType2 = Lab, DiamondSize2 = 3
(Diamond 3 not shown in Type1/Type2 columns)
```

### Field Extraction Sources

| Column | Primary Source | Fallback Sources |
|--------|---------------|------------------|
| SKU | `result.sku` | - |
| Title | `specifications.Title` | - |
| Description | `specifications.Description` | - |
| Exact Carat Total Weight | `specifications['Exact Carat Total Weight']` | `specifications.ExactCaratTotalWeight` |
| Right Weight | `specifications['Right Weight']` | `specifications.RightWeight` |
| Width | `specifications.Width` | - |
| Weight | `specifications.Weight` | `enrichedData.metal_weight` |
| Main Stone | `enrichedData.stone_used` | `specifications.MainStone` |
| Casting Weight | `specifications['Casting Weight']` | `specifications.CastingWeight` |
| Supplier Name | `specifications['Supplier Name']` | `specifications.SupplierName` |
| MFG & Part # | `specifications['MFG & Part #']` | `specifications.MfgPartNumber` |
| Part #2 | `specifications['Part #2']` | `specifications.Part2` |
| Diamond Data | `enrichedData.diamond_details.diamonds[]` | - |
| Gemstone Data | `enrichedData.gemstone_details.gemstones[]` | - |
| Metal Purity | `enrichedData.metal_purity` | - |
| Metal Weight | `enrichedData.metal_weight` | - |
| Costs | `costEstimation.*` | - |

### Earring Detection Logic

A SKU is classified as an earring if ANY of these conditions are true:
- Title contains "earring" (case-insensitive)
- Description contains "earring" (case-insensitive)
- Category contains "earring" (case-insensitive)
- Title contains "stud" (case-insensitive)

**Per-Earring Calculations**:
- Diamond Per Earring = Total Diamonds ÷ 2
- Gemstone Per Earring = Total Gemstones ÷ 2
- Total Stone Per Earring = (Total Diamonds + Total Gemstones) ÷ 2

---

## Usage Examples

### Example 1: Ordering Diamonds

1. Open **Diamond Inventory** sheet
2. Sort by `LookUpID` or `DiamondType`
3. See total quantities needed
4. Order from suppliers using LookUpIDs

### Example 2: Supplier Analysis

1. Open **Suppliers Inventory** sheet
2. See all suppliers with total costs
3. Identify highest-cost suppliers
4. Negotiate bulk discounts

### Example 3: Earring Production

1. Open **Earring Pairs Analysis** sheet
2. View per-earring stone counts
3. Plan production accordingly
4. Ensure matching pairs

### Example 4: Metal Purchasing

1. Open **Metal Inventory** sheet
2. See total weight by purity
3. Calculate material orders
4. Track metal costs

### Example 5: Complete SKU Analysis

1. Open **All SKUs Detailed** sheet
2. Filter by specific criteria
3. Export to separate file
4. Share with stakeholders

---

## Advanced Features

### Conditional Formatting (Future)

Potential enhancements:
- Color-code high-cost items
- Highlight failed SKUs
- Flag low-quantity items

### Charts (Future)

Potential visualizations:
- Cost distribution pie charts
- Diamond type bar charts
- Supplier cost comparisons
- Metal inventory gauges

### Pivot Tables (Future)

Potential pivot analyses:
- Cost by supplier
- Stones by type
- Metal by purity
- Earring vs non-earring

---

## Technical Implementation

### Sort Logic

```typescript
// Diamond sorting by size
diamonds.sort((a, b) => {
  const sizeA = typeof a.size === 'number' ? a.size : parseFloat(String(a.size)) || 0;
  const sizeB = typeof b.size === 'number' ? b.size : parseFloat(String(b.size)) || 0;
  return sizeB - sizeA; // Descending (largest first)
});
```

### Inventory Aggregation

```typescript
// Diamond inventory aggregation
const inventory = new Map<string, { quantity: number; ... }>();
diamonds.forEach(diamond => {
  const lookupId = diamond.lookupCode || `${type}-${size}-${shape}`;
  const existing = inventory.get(lookupId) || { quantity: 0, ... };
  existing.quantity += diamond.quantity * result.quantity; // Multiply by SKU qty
  inventory.set(lookupId, existing);
});
```

### Earring Detection

```typescript
function isEarring(result: ProcessedSKUResult): boolean {
  const title = (result.specifications?.Title || '').toLowerCase();
  const description = (result.specifications?.Description || '').toLowerCase();
  const category = (result.specifications?.Category || '').toLowerCase();
  
  return title.includes('earring') || 
         description.includes('earring') || 
         category.includes('earring') ||
         title.includes('stud');
}
```

---

## Column Width Optimization

All sheets have optimized column widths:
- SKU: 15
- Title: 40
- Description: 50
- Costs: 15
- Quantities: 10
- Standard fields: 15

---

## File Size Considerations

**Estimated File Size**:
- 10 SKUs: ~50 KB
- 50 SKUs: ~200 KB
- 100 SKUs: ~400 KB

**Factors**:
- Number of SKUs
- Description lengths
- Number of diamonds/gemstones per SKU
- Number of failed SKUs

---

## Best Practices

### For Users
1. ✅ Review **Summary** sheet first for overview
2. ✅ Check **Failed SKUs** for any errors
3. ✅ Use **All SKUs Detailed** for complete data export
4. ✅ Use inventory sheets for procurement
5. ✅ Share relevant sheets with specific teams

### For Developers
1. ✅ Maintain consistent column ordering
2. ✅ Handle missing data gracefully
3. ✅ Sort multi-value fields consistently
4. ✅ Aggregate intelligently (multiply by quantities)
5. ✅ Document all extraction logic

---

## Summary

**Total Sheets**: 12
**Total Columns** (across all sheets): 200+
**Data Points Per SKU**: 32+
**Aggregation Types**: 5 (Diamond, Gemstone, Metal, Supplier, Parts)
**Specialized Analyses**: 2 (Earrings, Failed SKUs)

This comprehensive spreadsheet structure provides complete visibility into:
- ✅ Individual SKU costs and details
- ✅ Material inventory requirements
- ✅ Supplier cost breakdowns
- ✅ Specialized product analysis (earrings)
- ✅ Error tracking and quality control

**Perfect for**: Inventory management, procurement, cost analysis, production planning, and vendor management.
