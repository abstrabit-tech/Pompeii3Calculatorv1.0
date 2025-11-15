import { ForecastUpload } from '@/components/forecast/forecast-upload';
import { ForecastAnalysis } from '@/components/forecast/forecast-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileSpreadsheet, BarChart3, PieChart } from 'lucide-react';

export default function ForecastPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="h-10 w-10 text-primary" />
            Forecast Analysis & Batch Processing
          </h1>
          <p className="text-lg text-muted-foreground">
            Process up to 100 SKUs simultaneously with intelligent cost analysis, inventory tracking, and comprehensive Excel reports with 15 detailed sheets
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Batch Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Process multiple SKUs at once with quantities. Upload CSV or Excel files with SKU and quantity columns.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                15 Detailed Sheets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive Excel report with Executive Summary, Charts, Diamond/Gemstone/Metal breakdowns, Inventory tracking, Supplier analysis, MFG & Part # details, Part #2 details, and Earring-specific data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-5 w-5 text-primary" />
                Growth Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Apply growth percentages to see projected costs. Perfect for budget planning and forecasting.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Upload Component */}
        <ForecastUpload />

        {/* Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Follow these steps to generate your forecast analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Download Template or Prepare Your File</h4>
                  <p className="text-sm text-muted-foreground">
                    Download our template or prepare a CSV/Excel file with SKUs in column A and quantities in column B.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Upload and Configure</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload your file and optionally set a growth percentage for projections. Add your email if you want to receive the results.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Process and Download</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Process Forecast" and wait for the analysis to complete. The system will process each SKU using our existing cost calculation logic.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">Analyze Comprehensive Results</h4>
                  <p className="text-sm text-muted-foreground">
                    Download the comprehensive Excel report with multiple sheets including summary, SKU breakdown, diamond analysis, gemstone analysis, metal analysis, and manufacturing costs.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">📊 Comprehensive Excel Report with 15 Sheets:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                <li><strong>Executive Summary</strong> - High-level dashboard with total costs, success rates, and category breakdowns</li>
                <li><strong>Charts & Graphs</strong> - Visual data ready for Excel charting (pie charts, bar graphs, trend analysis)</li>
                <li><strong>🔍 SKU Breakdown</strong> - Complete SKU-wise cost breakdown with projected quantities</li>
                <li><strong>All SKUs Detailed</strong> - Complete dataset with all product details, diamonds/gemstones in single-cell arrays</li>
                <li><strong>💎 Diamond Breakdown</strong> - Diamond-focused analysis sorted by size (largest first)</li>
                <li><strong>💠 Gemstone Breakdown</strong> - Gemstone-specific details sorted by size</li>
                <li><strong>🔧 Metal Breakdown</strong> - Metal purity, weight, and cost analysis</li>
                <li><strong>⚙️ Parts & Components</strong> - Supplier-wise parts aggregation</li>
                <li><strong>Earring Pairs Analysis</strong> - Specialized earring data with per-earring calculations</li>
                <li><strong>💎 Diamond Inventory</strong> - Aggregated diamond requirements by lookup ID</li>
                <li><strong>💠 Gemstone Inventory</strong> - Total gemstone inventory needs</li>
                <li><strong>🔧 Metal Inventory</strong> - Metal requirements by purity</li>
                <li><strong>📦 Suppliers Inventory</strong> - Complete supplier cost breakdown</li>
                <li><strong>🔩 MFG & Part # Breakdown</strong> - Manufacturing part number details with costs</li>
                <li><strong>⚙️ Part #2 Breakdown</strong> - Secondary part number analysis with costs</li>
                <li><strong>❌ Failed SKUs</strong> - Error tracking with detailed messages</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                💡 <strong>Pro Tip:</strong> Each material sheet (diamonds, gemstones, metals, parts) is color-coded for easy navigation. 
                Diamonds/gemstones are displayed as [(ID, carat, size, qty), ...] in single cells, sorted by size.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI-Powered Forecast Analysis Section */}
        <ForecastAnalysis />
      </div>
    </div>
  );
}
