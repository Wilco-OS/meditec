import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { SurveyInvitation } from '@/models/SurveyInvitation';
import { Survey } from '@/models/Survey';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '@/lib/email';

// Funktion zum Generieren eines eindeutigen Einladungscodes
function generateInvitationCode() {
  // Erstellt einen kürzeren, benutzerfreundlichen Code
  return uuidv4().substring(0, 8).toUpperCase();
}

// GET: Einladungen für eine bestimmte Umfrage abrufen
export async function GET(
  request: NextRequest,
  context: unknown
) {
  // Params extrahieren für Next.js App Router
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    // Survey-ID aus params extrahieren
    const surveyId = params.id;
    if (!surveyId) {
      return NextResponse.json({ error: 'Umfrage-ID fehlt' }, { status: 400 });
    }

    await dbConnect();

    // Zuerst die Umfrage abrufen, um sicherzustellen, dass der Benutzer Zugriff hat
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }

    // Prüfen, ob der Benutzer die Berechtigung hat, die Einladungen zu sehen
    const user = await User.findById(session.user.id);
    
    if (!user) {
      console.error('Benutzer nicht gefunden:', session.user.id);
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }
    
    console.log('Benutzerrolle:', user.role);
    const isAdmin = user.role === 'admin' || user.role === 'meditec_admin';
    const isCompanyAdmin = user.role === 'company_admin';
    
    // Admin hat immer Zugriff
    if (isAdmin) {
      console.log('Admin-Zugriff gewährt');
      // Keine weiteren Prüfungen für Admins
    } 
    // Für Unternehmensadmins müssen wir prüfen, ob die Umfrage ihrem Unternehmen zugewiesen ist
    else if (isCompanyAdmin && user.companyId) {
      const companyId = user.companyId;
      console.log('Prüfe Unternehmenszugriff für:', companyId);
      
      // Prüfen, ob die Umfrage dem Unternehmen zugewiesen ist
      // Wir müssen die ObjectIds als Strings vergleichen
      const hasAccessViaId = Array.isArray(survey.assignedCompanies) && 
        survey.assignedCompanies.some(id => id && id.toString() === companyId.toString());
      
      // Holen des Unternehmensnamens für die zweite Prüfung
      const company = await Company.findById(companyId);
      const companyName = company ? company.name : '';
      
      const hasAccessViaName = Array.isArray(survey.specialCompanyNames) && 
        survey.specialCompanyNames.includes(companyName);
      
      console.log('Zugriffsergebnis:', { hasAccessViaId, hasAccessViaName, companyName });
      
      if (!hasAccessViaId && !hasAccessViaName) {
        console.log('Zugriff verweigert für Unternehmen:', companyId, companyName);
        return NextResponse.json({ error: 'Keine Berechtigung für diese Umfrage' }, { status: 403 });
      }
    } else {
      console.log('Weder Admin noch Unternehmensadmin mit gültiger Unternehmens-ID');
      return NextResponse.json({ error: 'Keine Berechtigung zum Anzeigen von Einladungen' }, { status: 403 });
    }
    
    // Unternehmens-ID für die Einladungsfilterung
    let companyId = isCompanyAdmin ? user.companyId : null;

    // Einladungen abrufen
    console.log('Suche Einladungen für Umfrage:', surveyId, isCompanyAdmin ? `mit companyId ${companyId}` : 'ohne Unternehmensfilter');
    
    // Erneut sicherstellen, dass die Datenbankverbindung besteht
    await dbConnect();
    
    // TypeScript-Interface für die Query
    interface InvitationQuery {
      surveyId: string;
      companyId?: string;
    }
    
    const query: InvitationQuery = { surveyId };
    
    // Für Unternehmensadmins filtern wir nach deren Unternehmen
    if (isCompanyAdmin && companyId) {
      query.companyId = companyId;
    }
    
    try {
      const invitations = await SurveyInvitation.find(query).sort({ sentAt: -1 });
      console.log(`${invitations.length} Einladungen gefunden`);
      return NextResponse.json({ invitations });
    } catch (error) {
      console.error('Fehler beim Abfragen der Einladungen:', error);
      return NextResponse.json(
        { error: 'Fehler beim Abfragen der Einladungen' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Einladungen:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST: Neue Einladungen für eine Umfrage erstellen
export async function POST(
  request: NextRequest,
  context: unknown
) {
  // Params extrahieren für Next.js App Router
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    // Survey-ID aus params extrahieren
    const surveyId = params.id;
    if (!surveyId) {
      return NextResponse.json({ error: 'Umfrage-ID fehlt' }, { status: 400 });
    }

    const body = await request.json();
    const { participants, message } = body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Teilnehmer angegeben' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Umfrage abrufen
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }

    // Berechtigungen prüfen
    const user = await User.findById(session.user.id);
    
    if (!user) {
      console.error('Benutzer nicht gefunden:', session.user.id);
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }
    
    console.log('Benutzerrolle beim Erstellen von Einladungen:', user.role);
    const isAdmin = user.role === 'admin' || user.role === 'meditec_admin';
    const isCompanyAdmin = user.role === 'company_admin';
    
    let companyId: string | null = null;
    let companyName: string = '';
    
    // Admin hat immer Zugriff
    if (isAdmin) {
      console.log('Admin-Zugriff gewährt');
      // Admins müssen eine companyId angeben, für das die Einladungen erstellt werden sollen
      companyId = body.companyId;
      
      if (!companyId) {
        return NextResponse.json({ error: 'Admins müssen eine Unternehmens-ID angeben' }, { status: 400 });
      }
      
      // Company-Name für E-Mail-Template holen
      const company = await Company.findById(companyId);
      if (!company) {
        return NextResponse.json({ error: 'Angegebenes Unternehmen nicht gefunden' }, { status: 404 });
      }
      companyName = company.name;
    } 
    // Für Unternehmensadmins müssen wir prüfen, ob die Umfrage ihrem Unternehmen zugewiesen ist
    else if (isCompanyAdmin && user.companyId) {
      companyId = user.companyId;
      console.log('Prüfe Unternehmenszugriff für:', companyId);
      
      // Holen des Unternehmens für den Namen
      const company = await Company.findById(companyId);
      if (!company) {
        return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
      }
      companyName = company.name;
      
      // Prüfen, ob die Umfrage dem Unternehmen zugewiesen ist
      const hasAccessViaId = Array.isArray(survey.assignedCompanies) && companyId != null && 
        survey.assignedCompanies.some(id => id && id.toString() === companyId.toString());
      
      const hasAccessViaName = Array.isArray(survey.specialCompanyNames) && 
        survey.specialCompanyNames.includes(companyName);
      
      if (!hasAccessViaId && !hasAccessViaName) {
        console.log('Zugriff verweigert für Unternehmen:', companyId, companyName);
        return NextResponse.json({ error: 'Keine Berechtigung für diese Umfrage' }, { status: 403 });
      }
    } else {
      console.log('Weder Admin noch Unternehmensadmin mit gültiger Unternehmens-ID');
      return NextResponse.json({ error: 'Keine Berechtigung zum Erstellen von Einladungen' }, { status: 403 });
    }

    // Einladungen erstellen und E-Mails senden
    const createdInvitations = [];
    
    console.log('Verwende Unternehmens-ID für Einladungen:', companyId);
    
    if (!companyId) {
      return NextResponse.json({ error: 'Keine Unternehmens-ID verfügbar' }, { status: 400 });
    }

    for (const participant of participants) {
      const { name, email, departmentId } = participant;
      
      if (!name || !email) {
        continue; // Ungültige Teilnehmer überspringen
      }
      
      // Prüfen, ob die angegebene Abteilung zum Unternehmen gehört (falls eine angegeben wurde)
      if (departmentId) {
        try {
          const companyWithDept = await Company.findOne({
            _id: companyId,
            'departments._id': departmentId
          });
          
          if (!companyWithDept) {
            console.warn(`Abteilung ${departmentId} gehört nicht zum Unternehmen ${companyId}, wird ignoriert.`);
            // Wir setzen departmentId nicht, aber brechen nicht ab - die Einladung wird ohne Abteilung erstellt
          }
        } catch (error) {
          console.error('Fehler bei der Überprüfung der Abteilungszugehörigkeit:', error);
          // Wir setzen die Abteilung trotzdem, da wir den Prozess nicht unterbrechen wollen
        }
      }
      
      // Prüfen, ob bereits eine Einladung für diese E-Mail und Umfrage existiert
      const existingInvitation = await SurveyInvitation.findOne({
        email,
        surveyId,
        companyId,
      });
      
      if (existingInvitation) {
        // Aktualisiere vorhandene Einladung und sende erneut
        existingInvitation.name = name;
        existingInvitation.status = 'pending';
        existingInvitation.sentAt = new Date();
        
        // Abteilung aktualisieren, falls angegeben
        if (departmentId) {
          existingInvitation.departmentId = departmentId;
        }
        
        await existingInvitation.save();
        createdInvitations.push(existingInvitation);
        
        // E-Mail erneut senden
        await sendInvitationEmail(existingInvitation, survey, { name: companyName }, message);
      } else {
        // Neue Einladung erstellen
        const invitationCode = generateInvitationCode();
        
        // Einladungsdaten vorbereiten
        const invitationData: any = {
          email,
          name,
          surveyId,
          companyId,
          invitationCode,
          status: 'pending',
          sentAt: new Date(),
        };
        
        // Abteilung hinzufügen, falls vorhanden und gültig
        if (departmentId) {
          invitationData.departmentId = departmentId;
        }
        
        const invitation = await SurveyInvitation.create(invitationData);
        
        createdInvitations.push(invitation);
        
        // E-Mail senden
        await sendInvitationEmail(invitation, survey, { name: companyName }, message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${createdInvitations.length} Einladungen erfolgreich erstellt`,
      invitationIds: createdInvitations.map(inv => inv._id)
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Einladungen:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// Typdefinitionen für die Funktion
interface InvitationEmailParams {
  surveyId: string;
  email: string;
  name: string;
  invitationCode: string;
  [key: string]: any; // Für andere mögliche Eigenschaften
}

interface SurveyData {
  title: string;
  [key: string]: any; // Für andere mögliche Eigenschaften
}

interface CompanyData {
  name: string;
  [key: string]: any; // Für andere mögliche Eigenschaften
}

// Hilfsfunktion zum Senden der Einladungs-E-Mails
async function sendInvitationEmail(
  invitation: InvitationEmailParams, 
  survey: SurveyData, 
  company: CompanyData | null, 
  customMessage: string = ''
) {
  const surveyUrl = `${process.env.NEXTAUTH_URL}/surveys/participate/${invitation.surveyId}?code=${invitation.invitationCode}`;
  
  const companyName = company ? company.name : 'Meditec';
  
  const emailSubject = `Einladung zur Umfrage: ${survey.title}`;
  
  let emailContent = `
    <h2>Umfrage-Einladung</h2>
    <p>Hallo ${invitation.name},</p>
    <p>Sie wurden eingeladen, an der Umfrage "${survey.title}" von ${companyName} teilzunehmen.</p>
  `;
  
  if (customMessage) {
    emailContent += `<p>${customMessage}</p>`;
  }
  
  emailContent += `
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
