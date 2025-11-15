# Forecast Cloud Functions

This directory contains Python Cloud Functions for the Forecast feature.

## Functions

### 1. `process_forecast_batch`
Handles large batch processing of SKUs for forecast analysis.

**Endpoint**: `https://your-region-your-project.cloudfunctions.net/process_forecast_batch`

**Request Body**:
```json
{
  "skuData": [
    {"sku": "SKU123", "quantity": 10},
    {"sku": "SKU456", "quantity": 25}
  ],
  "growthPercentage": 10,
  "email": "user@example.com"
}
```

### 2. `send_forecast_email`
Sends processed forecast results via email.

**Endpoint**: `https://your-region-your-project.cloudfunctions.net/send_forecast_email`

**Request Body**:
```json
{
  "email": "user@example.com",
  "fileData": "base64_encoded_excel_file",
  "fileName": "forecast-analysis.xlsx",
  "summary": {
    "totalSKUs": 50,
    "successfulSKUs": 48,
    "totalCost": 12345.67
  }
}
```

### 3. `process_chunk`
Processes a chunk of SKUs for parallel processing of very large batches.

## Deployment

### Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase Functions (Python): `firebase init functions`

### Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:send_forecast_email
```

## Configuration

### Email SMTP Settings
Configure email credentials using Firebase environment config:

```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
firebase functions:config:set email.from="noreply@pompeii3.com"
```

**Note**: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### Environment Variables
You can also use Firebase Secret Manager for sensitive data:

```bash
firebase functions:secrets:set EMAIL_PASSWORD
```

## Local Development

### Test locally with Functions Framework

```bash
# Install dependencies
cd functions
pip install -r requirements.txt

# Run locally
firebase emulators:start --only functions
```

## Usage in Next.js App

### Example: Send Email After Processing

```typescript
// In your Next.js API route
const sendEmail = async (email: string, fileBuffer: Buffer, summary: any) => {
  const fileBase64 = fileBuffer.toString('base64');
  
  const response = await fetch(
    'https://your-region-your-project.cloudfunctions.net/send_forecast_email',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        fileData: fileBase64,
        fileName: 'forecast-analysis.xlsx',
        summary
      })
    }
  );
  
  return response.json();
};
```

## Features

- ✅ Email delivery with Excel attachments
- ✅ HTML email templates with forecast summary
- ✅ Chunked processing for large batches
- ✅ CORS support for web clients
- ✅ Error handling and logging
- ✅ Secure credential management

## Future Enhancements

- [ ] Integration with SendGrid or Mailgun for better email delivery
- [ ] Cloud Storage integration for large file handling
- [ ] Webhook support for async processing updates
- [ ] Rate limiting and quota management
- [ ] Advanced email templates with charts
