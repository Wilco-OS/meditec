import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// POST /api/test-email - Testet den E-Mail-Versand mit SendGrid
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { to = 'chat@wilco.space' } = data; // Standard-Empfänger, kann aber überschrieben werden
    
    // SendGrid API-Key setzen
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
    
    // E-Mail-Nachricht erstellen
    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'tool@meditec-online.com', // Verwende die konfigurierte Absenderadresse
      subject: 'SendGrid Test von Meditec Pulse',
      text: 'Dies ist eine Test-E-Mail, die mit SendGrid über die Meditec-Pulse-Anwendung gesendet wurde.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #003865;">SendGrid Test erfolgreich!</h2>
          <p>Dies ist eine Test-E-Mail, die mit SendGrid über die Meditec-Pulse-Anwendung gesendet wurde.</p>
          <p>Zeitstempel: ${new Date().toISOString()}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Diese E-Mail wurde automatisch gesendet, um die SendGrid-Integration zu testen.</p>
        </div>
      `
    };
    
    // E-Mail senden
    const result = await sgMail.send(msg);
    
    console.log('Test-E-Mail erfolgreich gesendet:', {
      to,
      messageId: result[0]?.messageId,
      statusCode: result[0]?.statusCode
    });
    
    return NextResponse.json({
      success: true,
      message: `Test-E-Mail erfolgreich an ${to} gesendet`,
      details: {
        statusCode: result[0]?.statusCode,
        headers: result[0]?.headers
      }
    });
  } catch (error: unknown) {
    console.error('Fehler beim Senden der Test-E-Mail:', error);
    
    // Fehlerdetails für bessere Diagnose
    let errorDetails = {};
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        stack: error.stack
      };
      
      // SendGrid-spezifische Fehlerdetails
      const sgError = error as { response?: { body?: unknown } };
      if (sgError.response && sgError.response.body) {
        errorDetails = {
          ...errorDetails,
          sendGridError: sgError.response.body
        };
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Senden der Test-E-Mail',
      error: errorDetails
    }, { status: 500 });
  }
}
