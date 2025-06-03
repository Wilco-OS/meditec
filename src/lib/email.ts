// Importieren der SendGrid-API statt Nodemailer
import sgMail from '@sendgrid/mail';

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string; // Textversion der E-Mail für E-Mail-Clients ohne HTML-Unterstützung
  from?: string;
};

/**
 * Sendet eine Einladungs-E-Mail an einen neuen Mitarbeiter
 */
type EmployeeInviteOptions = {
  email: string;
  name: string;
  companyName: string;
  invitationCode: string;
  senderName: string;
};

export async function sendEmployeeInvitation(options: EmployeeInviteOptions) {
  const { email, name, companyName, invitationCode, senderName } = options;
  
  const inviteLink = `${process.env.NEXTAUTH_URL}/activate-account?code=${invitationCode}`;
  
  const html = generateEmployeeInviteEmail(
    name,
    companyName,
    inviteLink,
    invitationCode,
    senderName
  );
  
  return sendEmail({
    to: email,
    subject: `Einladung zum Meditec Pulse-Portal von ${companyName}`,
    html
  });
}

/**
 * Generiert eine HTML-E-Mail für neue Mitarbeiter
 */
function generateEmployeeInviteEmail(
  employeeName: string,
  companyName: string,
  inviteLink: string,
  inviteCode: string,
  senderName: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #003865;
          color: #fff;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #003865;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          margin-top: 30px;
        }
        .code {
          font-family: monospace;
          background-color: #eee;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 16px;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Einladung zu Meditec Pulse</h1>
        </div>
        <div class="content">
          <h2>Hallo ${employeeName},</h2>
          <p>Sie wurden von <strong>${senderName}</strong> eingeladen, dem Meditec Pulse-Portal für <strong>${companyName}</strong> beizutreten.</p>
          <p>Um Ihren Account zu aktivieren und Ihr Passwort zu setzen, klicken Sie bitte auf den folgenden Link:</p>
          <a href="${inviteLink}" class="button">Account aktivieren</a>
          
          <p>Alternativ können Sie die folgende URL in Ihrem Browser öffnen und den Einladungscode eingeben:</p>
          <p>URL: <a href="${process.env.NEXTAUTH_URL}/activate-account">${process.env.NEXTAUTH_URL}/activate-account</a></p>
          <p>Ihr Einladungscode: <span class="code">${inviteCode}</span></p>
          
          <p>Dieser Link ist aus Sicherheitsgründen 7 Tage gültig.</p>
          
          <p>Mit freundlichen Grüßen,<br>Ihr Meditec-Team</p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch erstellt. Bitte antworten Sie nicht darauf.</p>
          <p>&copy; ${new Date().getFullYear()} Meditec Pulse. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sendet eine E-Mail über den konfigurierten Mail-Service
 */
export async function sendEmail({ to, subject, html, text, from }: EmailOptions) {
  const fromAddress = from || process.env.EMAIL_FROM || 'noreply@meditec-pulse.de';
  
  // Überprüfen, ob die E-Mail-Adresse im richtigen Format ist
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error('Ungültige E-Mail-Adresse:', to);
    throw new Error(`Ungültige E-Mail-Adresse: ${to}`);
  }
  
  // Prüfen, ob echte E-Mails gesendet werden sollen
  const shouldSendRealEmails = process.env.SEND_REAL_EMAILS === 'true';
  
  // In der Entwicklungsumgebung E-Mails simulieren, es sei denn SEND_REAL_EMAILS ist auf true gesetzt
  if (process.env.NODE_ENV === 'development' && !shouldSendRealEmails) {
    console.log('================================');
    console.log('📧 ENTWICKLUNGS-E-MAIL:');
    console.log('Von:', fromAddress);
    console.log('An:', to);
    console.log('Betreff:', subject);
    console.log('Inhalt (HTML):', html.substring(0, 200) + '...');
    console.log('================================');
    // In der Entwicklungsumgebung einen Erfolg simulieren
    return { accepted: [to], rejected: [], response: 'OK (Development Mode)' };
  }

  // Überprüfen, ob der SendGrid-API-Schlüssel gesetzt ist
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API-Schlüssel fehlt. Bitte überprüfen Sie die Umgebungsvariable: SENDGRID_API_KEY');
    throw new Error('E-Mail-Konfiguration unvollständig');
  }

  // SendGrid API-Schlüssel setzen
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // Erstellen der E-Mail-Nachricht
  const msg = {
    to,
    from: fromAddress, // Muss eine verifizierte Absenderadresse sein
    subject,
    text: text || html.replace(/<[^>]*>/g, ''), // Fallback-Textversion, wenn keine angegeben wurde
    html
  };
  
  try {
    // E-Mail senden
    const result = await sgMail.send(msg);
    
    console.log(`E-Mail erfolgreich gesendet an: ${to}`);
    return result;
  } catch (error: unknown) {
    console.error('Fehler beim Senden der E-Mail:', error);
    
    // Detaillierte Fehlerinformationen protokollieren
    if (error instanceof Error) {
      console.error('Fehlerdetails:', error.message);
      if (error.stack) {
        console.error('Stack:', error.stack);
      }
      
      // SendGrid-spezifische Fehlerdetails protokollieren
      // Da TypeScript die Properties nicht kennt, müssen wir sie typen
      const sgError = error as { response?: { body?: unknown } };
      if (sgError.response && sgError.response.body) {
        console.error('SendGrid-Fehlerdetails:', sgError.response.body);
      }
    }
    
    throw error;
  }
}

/**
 * Sendet eine Einladungs-E-Mail an einen Teilnehmer einer Umfrage
 */
type SurveyInvitationEmailOptions = {
  email: string;
  name: string;
  invitationCode: string;
  surveyTitle: string;
  surveyDescription?: string;
  companyName: string;
  customMessage?: string;
};

export async function sendSurveyInvitation(options: SurveyInvitationEmailOptions) {
  const { email, name, invitationCode, surveyTitle, surveyDescription, companyName, customMessage } = options;
  
  // Link zur Teilnahmeseite mit dem Einladungscode
  const participationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/surveys/participate?code=${invitationCode}`;
  
  const html = generateSurveyInvitationEmail(
    name,
    surveyTitle,
    surveyDescription || '',
    companyName,
    participationLink,
    invitationCode,
    customMessage || ''
  );
  
  return sendEmail({
    to: email,
    subject: `Einladung zur Umfrage "${surveyTitle}" von ${companyName}`,
    html
  });
}

/**
 * Sendet eine Einladung für eine Umfrage basierend auf dem Einladungsobjekt
 * Diese Funktion wird in der API-Route zum Versenden von Einladungen verwendet
 */
export async function sendInvitationEmail(
  invitation: any,
  survey: any,
  companyName: string,
  customMessage?: string
) {
  return sendSurveyInvitation({
    email: invitation.email,
    name: invitation.name,
    invitationCode: invitation.invitationCode,
    surveyTitle: survey.title,
    surveyDescription: survey.description,
    companyName,
    customMessage
  });
}

/**
 * Generiert eine HTML-E-Mail für Umfrageeinladungen
 */
function generateSurveyInvitationEmail(
  recipientName: string,
  surveyTitle: string,
  surveyDescription: string,
  companyName: string,
  participationLink: string,
  invitationCode: string,
  customMessage: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #003865;
          color: #fff;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #003865;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          margin-top: 30px;
        }
        .code {
          font-family: monospace;
          background-color: #eee;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 16px;
          letter-spacing: 2px;
        }
        .message {
          padding: 15px;
          background-color: #e9f7ff;
          border-left: 4px solid #003865;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Umfrage-Einladung</h1>
        </div>
        <div class="content">
          <p>Hallo ${recipientName},</p>
          <p>Sie wurden eingeladen, an der folgenden Umfrage teilzunehmen:</p>
          
          <h2>${surveyTitle}</h2>
          ${surveyDescription ? `<p>${surveyDescription}</p>` : ''}
          
          <p>Diese Umfrage wird von <strong>${companyName}</strong> durchgeführt.</p>
          
          ${customMessage ? `<div class="message"><p>${customMessage}</p></div>` : ''}
          
          <p>Um an der Umfrage teilzunehmen, klicken Sie bitte auf den folgenden Button:</p>
          
          <a href="${participationLink}" class="button">An der Umfrage teilnehmen</a>
          
          <p>Oder geben Sie den folgenden Code auf der Teilnahmeseite ein:</p>
          <p class="code">${invitationCode}</p>
          
          <p>Der Link und Code sind nur für Sie bestimmt und sollten nicht weitergegeben werden.</p>
        </div>
        <div class="footer">
          <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht auf diese Nachricht.</p>
          <p>&copy; ${new Date().getFullYear()} Meditec Pulse. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generiert eine HTML-E-Mail für neue Unternehmensadministratoren
 */
export function generateCompanyAdminInviteEmail(
  adminName: string, 
  companyName: string,
  inviteLink: string,
  inviteCode: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #003865;
          color: #fff;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #003865;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          margin-top: 30px;
        }
        .code {
          font-family: monospace;
          background-color: #eee;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 16px;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Willkommen bei Meditec Pulse</h1>
        </div>
        <div class="content">
          <h2>Hallo ${adminName},</h2>
          <p>Sie wurden als Administrator für <strong>${companyName}</strong> im Meditec Pulse-Portal registriert.</p>
          <p>Um Ihren Account zu aktivieren und Ihr Passwort zu setzen, klicken Sie bitte auf den folgenden Link:</p>
          <a href="${inviteLink}" class="button">Account aktivieren</a>
          
          <p>Alternativ können Sie die folgende URL in Ihrem Browser öffnen und den Einladungscode eingeben:</p>
          <p>URL: <a href="${process.env.NEXTAUTH_URL}/activate-account">${process.env.NEXTAUTH_URL}/activate-account</a></p>
          <p>Ihr Einladungscode: <span class="code">${inviteCode}</span></p>
          
          <p>Dieser Link ist aus Sicherheitsgründen 7 Tage gültig.</p>
          
          <p>Mit freundlichen Grüßen,<br>Ihr Meditec-Team</p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch erstellt. Bitte antworten Sie nicht darauf.</p>
          <p>&copy; ${new Date().getFullYear()} Meditec Pulse. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
