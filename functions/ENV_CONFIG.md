# Environment Variables Configuration

This document provides instructions for configuring environment variables for the forecast processor cloud functions.

## Required Environment Variables

```bash
SMTP_HOST=smtp.gmail.com          # SMTP server address
SMTP_PORT=587                      # SMTP server port
SMTP_USER=your-email@gmail.com     # SMTP username
SMTP_PASSWORD=your-app-password    # SMTP password or app-specific password
SMTP_FROM_EMAIL=noreply@pompeii3.com  # From email address
```

## Configuration Steps

### For Google Cloud Run:

```bash
gcloud run services update forecast-processor \
  --set-env-vars="SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=your-email@gmail.com,SMTP_PASSWORD=your-app-password,SMTP_FROM_EMAIL=noreply@pompeii3.com" \
  --region=us-central1
```

### For Firebase Cloud Functions:

```bash
firebase functions:config:set \
  email.smtp_host="smtp.gmail.com" \
  email.smtp_port="587" \
  email.smtp_user="your-email@gmail.com" \
  email.smtp_password="your-app-password" \
  email.from_email="noreply@pompeii3.com"
```

## Gmail Configuration

If using Gmail as the SMTP server:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/security
   - Select "2-Step Verification"
   - Scroll to "App passwords"
   - Generate a new app password for "Mail"
3. Use the generated 16-character password as `SMTP_PASSWORD`

## Alternative Email Providers

### SendGrid:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Amazon SES:
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

### Mailgun:
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-smtp-password
```

## Testing Configuration

Test the email configuration:

```bash
curl -X POST https://your-cloud-function-url/send_forecast_email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fileData": "base64-encoded-test-data",
    "fileName": "test.xlsx",
    "summary": {
      "totalSKUs": 10,
      "successfulSKUs": 10,
      "totalCost": 1000
    }
  }'
```

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use secret management services** for production:
   - Google Secret Manager
   - AWS Secrets Manager
   - Azure Key Vault
3. **Rotate credentials regularly**
4. **Use environment-specific configurations**
5. **Enable audit logging** for email sending
6. **Implement rate limiting** to prevent abuse

## Troubleshooting

### Common Issues:

1. **Authentication Error (535)**:
   - Verify SMTP_USER and SMTP_PASSWORD are correct
   - For Gmail, ensure App Password is used (not regular password)
   - Check if 2FA is enabled

2. **Connection Timeout**:
   - Verify SMTP_HOST and SMTP_PORT
   - Check firewall rules allow outbound SMTP traffic
   - Verify Cloud Function has internet access

3. **Email Not Received**:
   - Check spam/junk folder
   - Verify recipient email address
   - Check email provider logs for bounce messages
   - Verify DNS records (SPF, DKIM, DMARC)

4. **Environment Variables Not Loading**:
   ```bash
   # Check current environment variables
   gcloud run services describe forecast-processor --format="value(spec.template.spec.containers[0].env)"
   ```

## Monitoring

Monitor email delivery:

```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND textPayload:email" --limit=50

# Monitor for errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=20
```

## Local Development

Create a `.env` file for local testing:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@pompeii3.com
```

Load environment variables in local development:

```python
import os
from dotenv import load_dotenv

load_dotenv()
```

## Deployment Example

Complete deployment with environment variables:

```bash
# Deploy to Cloud Run with environment variables
gcloud run deploy forecast-processor \
  --source ./functions \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300 \
  --set-env-vars="SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=your-email@gmail.com,SMTP_PASSWORD=your-app-password,SMTP_FROM_EMAIL=noreply@pompeii3.com"
```

## Environment Variable Management

### View Current Variables:
```bash
gcloud run services describe forecast-processor \
  --format="yaml(spec.template.spec.containers[0].env)"
```

### Update Variables:
```bash
gcloud run services update forecast-processor \
  --update-env-vars="SMTP_PASSWORD=new-password"
```

### Remove Variables:
```bash
gcloud run services update forecast-processor \
  --remove-env-vars="OLD_VAR_NAME"
```
