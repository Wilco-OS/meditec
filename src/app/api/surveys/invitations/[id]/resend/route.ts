import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { SurveyInvitation } from '@/models/SurveyInvitation';
import { Survey } from '@/models/Survey';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import { SurveyStatus } from '@/types/survey';
import { sendEmail } from '@/lib/email';

// POST: Einladung erneut senden
export async function POST(
  request: NextRequest,
  context: unknown
) {
  // Context in das erwartete Format umwandeln
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const invitationId = params.id;
    if (!invitationId) {
      return NextResponse.json({ error: 'Einladungs-ID fehlt' }, { status: 400 });
    }

    await dbConnect();

    // Einladung abrufen
    const invitation = await SurveyInvitation.findById(invitationId);
    if (!invitation) {
      return NextResponse.json({ error: 'Einladung nicht gefunden' }, { status: 404 });
    }

    // Berechtigungsprüfung
    const user = await User.findById(session.user.id);
    const isAdmin = user.role === 'admin';
    const isCompanyAdmin = user.role === 'company_admin';
    
    if (isCompanyAdmin) {
      // Prüfen, ob die Einladung zum Unternehmen des Administrators gehört
      if (invitation.companyId.toString() !== user.company.toString()) {
        return NextResponse.json({ error: 'Keine Berechtigung zum erneuten Senden dieser Einladung' }, { status: 403 });
      }
    } else if (!isAdmin) {
      return NextResponse.json({ error: 'Keine Berechtigung zum erneuten Senden von Einladungen' }, { status: 403 });
    }

    // Umfrage und Unternehmen abrufen
    const survey = await Survey.findById(invitation.surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }

    const company = await Company.findById(invitation.companyId);
    
    // Einladung aktualisieren
    invitation.sentAt = new Date();
    if (invitation.status === 'expired') {
      invitation.status = 'pending';
    }
    
    await invitation.save();

    // E-Mail erneut senden
    await sendInvitationEmail(invitation, survey, company);

    return NextResponse.json({ 
      success: true, 
      message: 'Einladung erfolgreich erneut gesendet' 
    });
  } catch (error) {
    console.error('Fehler beim erneuten Senden der Einladung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// Hilfsfunktion zum Senden der Einladungs-E-Mails
async function sendInvitationEmail(
  invitation: any, // Mongoose Document für SurveyInvitation 
  survey: any, // Mongoose Document für Survey
  company: any // Mongoose Document für Company
) {
  const surveyUrl = `${process.env.NEXTAUTH_URL}/surveys/participate/${invitation.surveyId}?code=${invitation.invitationCode}`;
  
  const companyName = company ? company.name : 'Meditec';
  
  const emailSubject = `Einladung zur Umfrage: ${survey.title}`;
  
  const emailContent = `
    <h2>Umfrage-Einladung</h2>
    <p>Hallo ${invitation.name},</p>
    <p>Sie wurden eingeladen, an der Umfrage "${survey.title}" von ${companyName} teilzunehmen.</p>
    <p>Um an der Umfrage teilzunehmen, klicken Sie bitte auf den folgenden Link:</p>
    <p><a href="${surveyUrl}">An der Umfrage teilnehmen</a></p>
    <p>Oder geben Sie diesen Code ein: <strong>${invitation.invitationCode}</strong></p>
    <p>Vielen Dank für Ihre Teilnahme!</p>
    <p>Mit freundlichen Grüßen,<br>Das ${companyName}-Team</p>
  `;
  
  try {
    await sendEmail({
      to: invitation.email,
      subject: emailSubject,
      html: emailContent,
    });
    
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der Einladungs-E-Mail:', error);
    return false;
  }
}
