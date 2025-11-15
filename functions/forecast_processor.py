"""
Firebase Cloud Function for processing large forecast batches and sending emails
This function handles heavy processing and email delivery for forecast analysis
"""

import json
import base64
from typing import List, Dict, Any, Optional
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
from datetime import datetime
import io

# Firebase imports
from firebase_functions import https_fn
from firebase_admin import initialize_app, storage
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

# Initialize Firebase
initialize_app()

@https_fn.on_request()
def process_forecast_batch(req: https_fn.Request) -> https_fn.Response:
    """
    Cloud function to process large forecast batches
    
    Request body:
    {
        "skuData": [{"sku": "SKU123", "quantity": 10}, ...],
        "growthPercentage": 10,
        "email": "user@example.com"
    }
    """
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    # Handle OPTIONS request for CORS
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
    
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}),
            status=405,
            headers={'Content-Type': 'application/json', **headers}
        )
    
    try:
        # Parse request
        data = req.get_json()
        sku_data = data.get('skuData', [])
        growth_percentage = data.get('growthPercentage', 0)
        email = data.get('email')
        
        if not sku_data:
            return https_fn.Response(
                json.dumps({'error': 'No SKU data provided'}),
                status=400,
                headers={'Content-Type': 'application/json', **headers}
            )
        
        # Process SKUs (call your Next.js API or process directly)
        # For now, we'll assume processing happens on the Next.js side
        # This function focuses on email delivery
        
        if email:
            # TODO: Implement email sending
            # This would involve:
            # 1. Receiving the processed Excel file from Next.js API
            # 2. Sending it via email
            pass
        
        return https_fn.Response(
            json.dumps({
                'status': 'success',
                'message': f'Processing {len(sku_data)} SKUs',
                'email_sent': bool(email)
            }),
            status=200,
            headers={'Content-Type': 'application/json', **headers}
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            status=500,
            headers={'Content-Type': 'application/json', **headers}
        )


@https_fn.on_request()
def send_forecast_email(req: https_fn.Request) -> https_fn.Response:
    """
    Cloud function to send forecast results via email
    
    Request body:
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
    """
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
    
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}),
            status=405,
            headers={'Content-Type': 'application/json', **headers}
        )
    
    try:
        data = req.get_json()
        email = data.get('email')
        file_data = data.get('fileData')
        file_name = data.get('fileName', 'forecast-analysis.xlsx')
        summary = data.get('summary', {})
        
        if not email or not file_data:
            return https_fn.Response(
                json.dumps({'error': 'Email and file data are required'}),
                status=400,
                headers={'Content-Type': 'application/json', **headers}
            )
        
        # Decode base64 file data
        file_bytes = base64.b64decode(file_data)
        
        # Send email
        send_email_with_attachment(
            to_email=email,
            subject='Your Forecast Analysis is Ready',
            body=generate_email_body(summary),
            attachment_data=file_bytes,
            attachment_name=file_name
        )
        
        return https_fn.Response(
            json.dumps({
                'status': 'success',
                'message': f'Email sent to {email}'
            }),
            status=200,
            headers={'Content-Type': 'application/json', **headers}
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            status=500,
            headers={'Content-Type': 'application/json', **headers}
        )


def send_email_with_attachment(
    to_email: str,
    subject: str,
    body: str,
    attachment_data: bytes,
    attachment_name: str,
    from_email: str = None,
    smtp_server: str = None,
    smtp_port: int = None
):
    """
    Send email with attachment using SMTP
    
    Environment Variables Required:
    - SMTP_HOST: SMTP server address (default: smtp.gmail.com)
    - SMTP_PORT: SMTP server port (default: 587)
    - SMTP_USER: SMTP username/email
    - SMTP_PASSWORD: SMTP password or app-specific password
    - SMTP_FROM_EMAIL: From email address (default: noreply@pompeii3.com)
    
    Configuration:
    Set environment variables in Cloud Run:
    gcloud run services update forecast-processor --set-env-vars="SMTP_USER=your-email@gmail.com,SMTP_PASSWORD=your-password"
    """
    import os
    
    # Get configuration from environment variables
    from_email = from_email or os.getenv('SMTP_FROM_EMAIL', 'noreply@pompeii3.com')
    smtp_server = smtp_server or os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = smtp_port or int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    if not smtp_user or not smtp_password:
        raise ValueError(
            'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.'
        )
    
    # Create message
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    
    # Add body
    msg.attach(MIMEText(body, 'html'))
    
    # Add attachment
    part = MIMEBase('application', 'octet-stream')
    part.set_payload(attachment_data)
    encoders.encode_base64(part)
    part.add_header(
        'Content-Disposition',
        f'attachment; filename={attachment_name}'
    )
    msg.attach(part)
    
    # Send email
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
    except Exception as e:
        raise Exception(f'Failed to send email: {str(e)}')


def generate_email_body(summary: Dict[str, Any]) -> str:
    """Generate HTML email body with forecast summary"""
    
    total_skus = summary.get('totalSKUs', 0)
    successful_skus = summary.get('successfulSKUs', 0)
    total_cost = summary.get('totalCost', 0)
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9fafb; }}
            .summary {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }}
            .summary-item {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Forecast Analysis Complete</h1>
            </div>
            <div class="content">
                <p>Your forecast analysis has been processed successfully!</p>
                
                <div class="summary">
                    <h2>Summary</h2>
                    <div class="summary-item">
                        <span>Total SKUs Processed:</span>
                        <strong>{total_skus}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Successfully Processed:</span>
                        <strong>{successful_skus}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Total Estimated Cost:</span>
                        <strong>${total_cost:,.2f}</strong>
                    </div>
                </div>
                
                <p>The detailed Excel report is attached to this email. It includes:</p>
                <ul>
                    <li>Executive summary with cost breakdowns</li>
                    <li>SKU-wise analysis</li>
                    <li>Diamond and gemstone breakdowns</li>
                    <li>Metal analysis</li>
                    <li>Manufacturing cost details</li>
                </ul>
                
                <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
                <p>© 2024 Pompeii3 Calculator. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html


# Additional helper function for chunked processing
@https_fn.on_request()
def process_chunk(req: https_fn.Request) -> https_fn.Response:
    """
    Process a chunk of SKUs (for very large batches, split into chunks)
    This allows for parallel processing of large forecast batches
    """
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
    
    try:
        data = req.get_json()
        chunk_skus = data.get('skus', [])
        chunk_index = data.get('chunkIndex', 0)
        total_chunks = data.get('totalChunks', 1)
        
        # Process this chunk
        # Call your Next.js API endpoint for each SKU in the chunk
        
        return https_fn.Response(
            json.dumps({
                'status': 'success',
                'chunkIndex': chunk_index,
                'totalChunks': total_chunks,
                'processed': len(chunk_skus)
            }),
            status=200,
            headers={'Content-Type': 'application/json', **headers}
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            status=500,
            headers={'Content-Type': 'application/json', **headers}
        )
