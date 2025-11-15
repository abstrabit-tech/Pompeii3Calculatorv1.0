'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  PieChart,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ForecastAnalysisData {
  summary: string;
  insights: Array<{
    category: 'cost' | 'growth' | 'inventory' | 'risk' | 'opportunity';
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  trends: {
    costTrend: 'increasing' | 'stable' | 'decreasing';
    inventoryTrend: 'overstocked' | 'balanced' | 'understocked';
    riskLevel: 'low' | 'moderate' | 'high';
  };
  chartData: {
    costBreakdownData: Array<{
      category: string;
      value: number;
      percentage: number;
    }>;
    topSKUsData: Array<{
      sku: string;
      cost: number;
      quantity: number;
    }>;
  };
  // Enhanced data for better visualizations
  totalCost?: number;
  totalSKUs?: number;
  successRate?: number;
  growthRate?: number;
  projectedCost?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const GRADIENT_COLORS = {
  blue: ['#3b82f6', '#60a5fa', '#93c5fd'],
  green: ['#10b981', '#34d399', '#6ee7b7'],
  orange: ['#f59e0b', '#fbbf24', '#fcd34d'],
  red: ['#ef4444', '#f87171', '#fca5a5'],
  purple: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
};

export function ForecastAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ForecastAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(uploadedFile);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a forecast Excel file first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/forecast/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze forecast');
      }

      const analysisData: ForecastAnalysisData = await response.json();
      setAnalysis(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cost':
        return <BarChart3 className="h-4 w-4" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4" />;
      case 'inventory':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'risk':
        return <AlertCircle className="h-4 w-4" />;
      case 'opportunity':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-6 w-6" />
          AI-Powered Forecast Analysis
        </CardTitle>
        <CardDescription>
          Upload your generated forecast Excel file to get AI-powered insights, trends, and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="flex-1"
            />
            <Button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Analyze Forecast
                </>
              )}
            </Button>
          </div>

          {file && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Ready to analyze: <strong>{file.name}</strong>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Cost</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        ${analysis.totalCost?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                      </p>
                    </div>
                    <BarChart3 className="h-10 w-10 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Total SKUs</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {analysis.totalSKUs || 0}
                      </p>
                    </div>
                    <FileSpreadsheet className="h-10 w-10 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Success Rate</p>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                        {analysis.successRate?.toFixed(1) || '0.0'}%
                      </p>
                    </div>
                    <CheckCircle2 className="h-10 w-10 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Growth Rate</p>
                      <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {analysis.growthRate?.toFixed(1) || '0.0'}%
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-orange-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <AlertDescription className="font-medium text-blue-900 ml-2">
                {analysis.summary}
              </AlertDescription>
            </Alert>

          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="charts">Cost Analysis</TabsTrigger>
              <TabsTrigger value="breakdown">Component Breakdown</TabsTrigger>
              <TabsTrigger value="trends">Trends & Forecasts</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            {/* Trends Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cost Trend</span>
                    {analysis.trends.costTrend === 'increasing' ? (
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold mt-2 capitalize">
                    {analysis.trends.costTrend}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Inventory</span>
                    <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold mt-2 capitalize">
                    {analysis.trends.inventoryTrend}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Level</span>
                    <AlertCircle
                      className={`h-5 w-5 ${
                        analysis.trends.riskLevel === 'high'
                          ? 'text-red-500'
                          : analysis.trends.riskLevel === 'moderate'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`}
                    />
                  </div>
                  <p className="text-2xl font-bold mt-2 capitalize">
                    {analysis.trends.riskLevel}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-4">
              {analysis.insights.map((insight, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getCategoryIcon(insight.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant={getSeverityVariant(insight.severity) as any}>
                            {insight.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Charts Tab - Renamed to Cost Analysis */}
            <TabsContent value="charts" className="space-y-6">
              {/* Cost Breakdown Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown by Category</CardTitle>
                  <CardDescription>Distribution of costs across different components</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RePieChart>
                      <Pie
                        data={analysis.chartData.costBreakdownData}
                        dataKey="value"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={60}
                        label={(entry) => `${entry.percentage.toFixed(1)}%`}
                        labelLine={true}
                      >
                        {analysis.chartData.costBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top SKUs Bar Chart */}
              {analysis.chartData.topSKUsData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 SKUs by Cost</CardTitle>
                    <CardDescription>Highest cost items in your forecast</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={450}>
                      <BarChart data={analysis.chartData.topSKUsData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <defs>
                          <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          </linearGradient>
                          <linearGradient id="quantityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="sku" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === 'Total Cost') return `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                            return value;
                          }}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar yAxisId="left" dataKey="cost" fill="url(#costGradient)" name="Total Cost" radius={[8, 8, 0, 0]} />
                        <Bar yAxisId="right" dataKey="quantity" fill="url(#quantityGradient)" name="Quantity" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* NEW: Component Breakdown Tab */}
            <TabsContent value="breakdown" className="space-y-6">
              {/* Cost Components Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Cost Component Analysis</CardTitle>
                  <CardDescription>Comprehensive breakdown of all cost elements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {analysis.chartData.costBreakdownData.map((item, index) => (
                      <Card key={index} className="border-2" style={{ borderColor: COLORS[index % COLORS.length] + '40' }}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">{item.category}</span>
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          </div>
                          <p className="text-2xl font-bold mb-1">
                            ${item.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.percentage.toFixed(1)}% of total
                          </p>
                          <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${item.percentage}%`, 
                                backgroundColor: COLORS[index % COLORS.length] 
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Horizontal Stacked Bar Chart */}
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart
                      layout="vertical"
                      data={[{ name: 'Total Cost' }]}
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      {analysis.chartData.costBreakdownData.map((item, index) => (
                        <Bar 
                          key={index}
                          dataKey={() => item.value}
                          stackId="a"
                          fill={COLORS[index % COLORS.length]}
                          name={item.category}
                        />
                      ))}
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* SKU Distribution Analysis */}
              {analysis.chartData.topSKUsData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cost Distribution Area Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>SKU Cost Distribution</CardTitle>
                      <CardDescription>Cumulative cost across top SKUs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analysis.chartData.topSKUsData}>
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="sku" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          />
                          <Area type="monotone" dataKey="cost" stroke="#8b5cf6" fillOpacity={1} fill="url(#areaGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Quantity vs Cost Scatter */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quantity vs. Cost Analysis</CardTitle>
                      <CardDescription>Relationship between quantity and total cost</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analysis.chartData.topSKUsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="sku" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                          <YAxis yAxisId="left" orientation="left" label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="right" orientation="right" label={{ value: 'Quantity', angle: 90, position: 'insideRight' }} />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              if (name === 'Cost') return `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                              return value;
                            }}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          />
                          <Legend />
                          <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#ec4899" strokeWidth={2} name="Quantity" dot={{ r: 4 }} />
                          <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#14b8a6" strokeWidth={2} name="Cost" dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Cost Efficiency Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Efficiency Analysis</CardTitle>
                  <CardDescription>Average costs and efficiency metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysis.totalSKUs && analysis.totalCost && (
                      <>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Avg Cost per SKU</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            ${(analysis.totalCost / analysis.totalSKUs).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </p>
                        </div>
                        
                        {analysis.chartData.costBreakdownData.map((item, index) => {
                          if (index >= 3) return null; // Show only top 3
                          return (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Avg {item.category} per SKU
                              </p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                ${(item.value / (analysis.totalSKUs || 1)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </p>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends & Forecasts Tab */}
            <TabsContent value="trends" className="space-y-6">
              {/* Growth Projection Chart */}
              {analysis.projectedCost && analysis.totalCost && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Growth Projection</CardTitle>
                    <CardDescription>Current vs. Projected costs with growth rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={[
                          { name: 'Current Cost', value: analysis.totalCost, fill: '#3b82f6' },
                          { name: 'Projected Cost', value: analysis.projectedCost, fill: '#10b981' }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {[
                            { name: 'Current Cost', value: analysis.totalCost, fill: '#3b82f6' },
                            { name: 'Projected Cost', value: analysis.projectedCost, fill: '#10b981' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Trend Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`border-2 ${
                  analysis.trends.costTrend === 'increasing' ? 'border-red-200 bg-red-50' :
                  analysis.trends.costTrend === 'stable' ? 'border-blue-200 bg-blue-50' :
                  'border-green-200 bg-green-50'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Cost Trend</span>
                      {analysis.trends.costTrend === 'increasing' ? (
                        <TrendingUp className="h-6 w-6 text-red-500" />
                      ) : analysis.trends.costTrend === 'stable' ? (
                        <BarChart3 className="h-6 w-6 text-blue-500" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                    <p className="text-3xl font-bold capitalize mb-2">
                      {analysis.trends.costTrend}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.trends.costTrend === 'increasing' && 'Costs are rising - review supplier pricing'}
                      {analysis.trends.costTrend === 'stable' && 'Costs are stable - maintain current strategy'}
                      {analysis.trends.costTrend === 'decreasing' && 'Costs are decreasing - good optimization'}
                    </p>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${
                  analysis.trends.inventoryTrend === 'overstocked' ? 'border-yellow-200 bg-yellow-50' :
                  analysis.trends.inventoryTrend === 'balanced' ? 'border-green-200 bg-green-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Inventory Status</span>
                      <FileSpreadsheet className={`h-6 w-6 ${
                        analysis.trends.inventoryTrend === 'overstocked' ? 'text-yellow-500' :
                        analysis.trends.inventoryTrend === 'balanced' ? 'text-green-500' :
                        'text-red-500'
                      }`} />
                    </div>
                    <p className="text-3xl font-bold capitalize mb-2">
                      {analysis.trends.inventoryTrend}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.trends.inventoryTrend === 'overstocked' && 'Consider reducing order quantities'}
                      {analysis.trends.inventoryTrend === 'balanced' && 'Inventory levels are optimal'}
                      {analysis.trends.inventoryTrend === 'understocked' && 'Increase inventory to meet demand'}
                    </p>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${
                  analysis.trends.riskLevel === 'high' ? 'border-red-200 bg-red-50' :
                  analysis.trends.riskLevel === 'moderate' ? 'border-yellow-200 bg-yellow-50' :
                  'border-green-200 bg-green-50'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Risk Level</span>
                      <AlertCircle className={`h-6 w-6 ${
                        analysis.trends.riskLevel === 'high' ? 'text-red-500' :
                        analysis.trends.riskLevel === 'moderate' ? 'text-yellow-500' :
                        'text-green-500'
                      }`} />
                    </div>
                    <p className="text-3xl font-bold capitalize mb-2">
                      {analysis.trends.riskLevel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.trends.riskLevel === 'high' && 'Immediate attention required'}
                      {analysis.trends.riskLevel === 'moderate' && 'Monitor closely for changes'}
                      {analysis.trends.riskLevel === 'low' && 'Low risk - forecast is stable'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              {analysis.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${getPriorityColor(rec.priority)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge variant="outline" className="capitalize">
                            {rec.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
