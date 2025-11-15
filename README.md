# Pompeii3 Calculator

A comprehensive jewelry cost estimation and forecast analysis platform.

## Features

### 1. SKU Analyzer
Analyze individual SKUs with detailed cost breakdowns including:
- Diamond cost calculations (Natural and Lab)
- Gemstone pricing
- Metal cost calculations
- Labor cost estimation
- Part 2 and Part 3 cost analysis
- Visual product analysis

### 2. Forecast Analysis (NEW!)
Batch process multiple SKUs with comprehensive reporting:
- **File Upload**: Support for CSV and Excel files
- **Batch Processing**: Process up to 100 SKUs at once
- **Growth Projections**: Apply growth percentages for budget forecasting
- **Detailed Reports**: Multi-sheet Excel reports with:
  - Executive summary
  - SKU-wise breakdown
  - Diamond analysis by type
  - Gemstone analysis
  - Metal analysis
  - Manufacturing cost breakdown (Part 2, Part 3, Labor)
  - Failed SKUs report
- **Email Delivery**: Optional email delivery for large batches

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account (for cloud functions)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env.local` file:

```env
# Add your environment variables here
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
# ... other Firebase config
```

## Usage

### SKU Analyzer
1. Navigate to the SKU Analyzer page
2. Enter a SKU
3. Click "Analyze"
4. View comprehensive cost breakdown

### Forecast Analysis
1. Navigate to Forecast page
2. Download the template (optional)
3. Upload CSV/Excel with SKUs and quantities:
   - Column A: SKU
   - Column B: Quantity
4. Optionally add growth percentage
5. Click "Process Forecast"
6. Download the generated Excel report

## Documentation

- [Forecast Feature Documentation](./docs/FORECAST_FEATURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Multiple Critical Fixes](./docs/MULTIPLE_CRITICAL_FIXES.md)

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **AI**: Google Genkit for product enrichment
- **Data Processing**: XLSX, PapaParse
- **Backend**: Next.js API Routes, Firebase Cloud Functions (Python)
- **Database/Storage**: Firebase

## Project Structure

```
src/
├── app/
│   ├── forecast/          # Forecast analysis page
│   ├── api/
│   │   └── forecast/      # Forecast API endpoints
│   └── page.tsx           # SKU Analyzer page
├── components/
│   ├── forecast/          # Forecast components
│   ├── sku-analyzer/      # SKU analyzer components
│   └── ui/                # Shared UI components
├── services/
│   ├── forecast-processor.ts        # Batch SKU processing
│   ├── spreadsheet-generator.ts     # Excel report generation
│   ├── diamond-cost-calculator.ts   # Diamond pricing
│   ├── gemstone-cost-calculator.ts  # Gemstone pricing
│   ├── metal-cost-calculator.ts     # Metal pricing
│   └── labor-cost-calculator.ts     # Labor estimation
└── ai/
    └── flows/             # AI enrichment flows

functions/                 # Python Cloud Functions
├── forecast_processor.py  # Email delivery & batch processing
└── requirements.txt
```

## API Endpoints

### Forecast Processing
- **POST** `/api/forecast/process` - Process batch of SKUs
- **GET** `/api/forecast/process` - Health check

### Cloud Functions
- `process_forecast_batch` - Handle large batches
- `send_forecast_email` - Email delivery
- `process_chunk` - Parallel processing

## Development

### Running Locally

```bash
# Start Next.js dev server
npm run dev

# Start Genkit dev server
npm run genkit:dev

# Run in watch mode
npm run genkit:watch
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Deployment

### Deploy to Vercel

```bash
vercel deploy
```

### Deploy Firebase Functions

```bash
cd functions
firebase deploy --only functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Copyright © 2024 Pompeii3. All rights reserved.

## Support

For issues or questions, please contact the development team.
