'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface SKUData {
  sku: string;
  quantity: number;
}

interface ForecastUploadProps {
  onProcess?: (data: SKUData[], growthPercentage: number) => Promise<void>;
}

// Helper function to format milliseconds to readable time
function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function ForecastUpload({ onProcess }: ForecastUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [growthPercentage, setGrowthPercentage] = useState<number>(0);
  const [skuData, setSkuData] = useState<SKUData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [processingStats, setProcessingStats] = useState({
    startTime: 0,
    processedCount: 0,
    totalCount: 0,
    avgTimePerSKU: 0,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setSuccess(null);

    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      parseCSVFile(uploadedFile);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseExcelFile(uploadedFile);
    } else {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      setFile(null);
    }
  };

  const parseCSVFile = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const parsedData = parseFileData(results.data as string[][]);
          setSkuData(parsedData);
          setSuccess(`Successfully loaded ${parsedData.length} SKUs from CSV`);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
          setFile(null);
        }
      },
      error: (error) => {
        setError(`CSV parsing error: ${error.message}`);
        setFile(null);
      },
    });
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        const parsedData = parseFileData(jsonData);
        setSkuData(parsedData);
        setSuccess(`Successfully loaded ${parsedData.length} SKUs from Excel`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
        setFile(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setFile(null);
    };
    reader.readAsBinaryString(file);
  };

  const parseFileData = (data: any[][]): SKUData[] => {
    if (!data || data.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const skuList: SKUData[] = [];
    
    // Skip header row, start from index 1
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) continue;
      
      const sku = String(row[0]).trim();
      const quantity = parseInt(String(row[1] || '1'));

      if (!sku) continue;
      
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for SKU ${sku} at row ${i + 1}. Must be a positive number.`);
      }

      skuList.push({ sku, quantity });
    }

    if (skuList.length === 0) {
      throw new Error('No valid SKU data found in file');
    }

    return skuList;
  };

  const handleProcess = async () => {
    if (skuData.length === 0) {
      setError('Please upload a file with SKU data first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setProgress(0);
    
    const startTime = Date.now();
    setProcessingStats({
      startTime,
      processedCount: 0,
      totalCount: skuData.length,
      avgTimePerSKU: 0,
    });

    // Simulate progress during API call with realistic timing
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% until completion
        return prev + 2;
      });
      
      // Update timing stats based on elapsed time
      const elapsed = Date.now() - startTime;
      const estimatedProgress = Math.min(90, (elapsed / (skuData.length * 50000)) * 100); // Assume 50s per SKU
      setProgress(estimatedProgress);
      
      setProcessingStats(prev => ({
        ...prev,
        processedCount: Math.floor((estimatedProgress / 100) * skuData.length),
        avgTimePerSKU: elapsed / Math.max(1, Math.floor((estimatedProgress / 100) * skuData.length)),
      }));
    }, 200); // Update every 200ms for smoother animation

    try {
      if (onProcess) {
        await onProcess(skuData, growthPercentage);
        setProgress(100);
        setProcessingStats(prev => ({
          ...prev,
          processedCount: skuData.length,
        }));
        setSuccess('Forecast analysis completed successfully!');
      } else {
        // Default processing - call API endpoint
        setProgress(10);
        const response = await fetch('/api/forecast/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            skuData,
            growthPercentage,
            email: email || undefined,
          }),
        });

        setProgress(70);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process forecast');
        }

        setProgress(85);

        // Download the generated file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forecast-analysis-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setProgress(100);
        setProcessingStats(prev => ({
          ...prev,
          processedCount: skuData.length,
        }));
        setSuccess(`✅ Forecast analysis completed! ${skuData.length} SKUs processed. File downloaded successfully.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during processing');
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
      // Keep progress at 100% if successful, reset to 0 if error
      setTimeout(() => {
        if (!error) {
          setProgress(0);
          setProcessingStats({ startTime: 0, processedCount: 0, totalCount: 0, avgTimePerSKU: 0 });
        }
      }, 5000);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['SKU', 'Quantity'],
      ['EXAMPLE-SKU-001', '10'],
      ['EXAMPLE-SKU-002', '25'],
      ['EXAMPLE-SKU-003', '5'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    XLSX.writeFile(workbook, 'forecast-template.xlsx');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Forecast Data</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with SKU and Quantity columns. Column A should contain SKUs, 
            Column B should contain quantities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload File (CSV or Excel)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="growth-percentage">Growth Percentage (Optional)</Label>
            <Input
              id="growth-percentage"
              type="number"
              min="0"
              max="1000"
              step="0.1"
              value={growthPercentage === 0 ? '' : growthPercentage}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || value === null) {
                  setGrowthPercentage(0);
                } else {
                  const parsed = parseFloat(value);
                  setGrowthPercentage(isNaN(parsed) ? 0 : parsed);
                }
              }}
              placeholder="Enter growth percentage (e.g., 10 for 10%)"
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              Enter a growth percentage to see projected costs with growth
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              Receive the processed file via email (for large batches)
            </p>
          </div>

          {skuData.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Loaded {skuData.length} SKUs. Total quantity: {skuData.reduce((sum, item) => sum + item.quantity, 0)}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium">{Math.round(progress)}%</span>
                <div className="flex items-center gap-4">
                  <span>
                    {processingStats.processedCount} / {processingStats.totalCount} SKUs
                  </span>
                  <span>
                    {formatTime(Date.now() - processingStats.startTime)} elapsed
                  </span>
                  {processingStats.avgTimePerSKU > 0 && processingStats.processedCount > 0 && (
                    <>
                      <span>
                        ~{formatTime(processingStats.avgTimePerSKU)} per SKU
                      </span>
                      <span className="text-primary">
                        ~{formatTime((processingStats.totalCount - processingStats.processedCount) * processingStats.avgTimePerSKU)} remaining
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                Processing SKUs... This may take a few minutes for large batches.
              </p>
            </div>
          )}

          <Button
            onClick={handleProcess}
            disabled={skuData.length === 0 || isProcessing}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Process Forecast
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {skuData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>First 10 SKUs from uploaded file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">SKU</th>
                    <th className="text-right p-2">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {skuData.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.sku}</td>
                      <td className="text-right p-2">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {skuData.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2">
                  ... and {skuData.length - 10} more SKUs
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
