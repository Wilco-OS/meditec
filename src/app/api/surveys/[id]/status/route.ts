import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { SurveyStatus } from '@/types/survey';

// Modelle werden nach der DB-Verbindung dynamisch importiert
let Survey: any;
let Company: any;

// Hilfsfunktion zur Überprüfung der ID-Gültigkeit
function validateAndCleanId(id: string | undefined): { isValid: boolean; cleanId: string | null; errorMessage: string | null } {
  if (!id) {
    return { isValid: false, cleanId: null, errorMessage: 'Fehlende Umfrage-ID' };
  }

  // Umfassendere Validierung für alle möglichen ungültigen Fälle
  if (
    id === 'undefined' || 
    id === 'null' || 
    id.trim() === '' || 
    id === '[object Object]' ||
    id === 'NaN' ||
    id.includes('undefined') ||
    /^\s*$/.test(id) // Nur Leerzeichen
  ) {
    console.error('API: Ungültige Umfrage-ID abgelehnt:', id);
    return { isValid: false, cleanId: null, errorMessage: 'Ungültige Umfrage-ID' };
  }

  // ID bereinigen
  const cleanId = id.trim();

  // ID-Format für MongoDB validieren (24 Zeichen Hexadezimal)
  if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) {
    // Für MongoDB ObjectId-Format ungültig, aber wir prüfen, ob es eine gültige UUID ist
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(cleanId)) {
      console.log('API: UUID-Format für Umfrage-ID akzeptiert:', cleanId);
      return { isValid: true, cleanId, errorMessage: null };
    }
    
    console.error('API: Umfrage-ID hat weder gültiges MongoDB ObjectId-Format noch UUID-Format:', cleanId);
    return { isValid: false, cleanId: null, errorMessage: 'Umfrage-ID hat ungültiges Format' };
  }

  console.log('API: Gültige MongoDB ObjectId für Umfrage-ID akzeptiert:', cleanId);
  return { isValid: true, cleanId, errorMessage: null };
}

// PATCH /api/surveys/[id]/status - Status einer Umfrage aktualisieren
export async function PATCH(
  request: NextRequest,
  context: unknown
) {
  // Params extrahieren für Next.js App Router
  const { params } = context as { params: { id: string } };
  const id = params.id;
  
  console.log('PATCH-Anfrage für Umfragestatus erhalten, ID:', id);

  // ID validieren
  const { isValid, cleanId, errorMessage } = validateAndCleanId(id);
  
  if (!isValid || !cleanId) {
    return NextResponse.json(
      { error: errorMessage || 'Ungültige Umfrage-ID' },
      { status: 400 }
    );
  }
  
  try {
    // Sitzung abrufen und authentifizieren
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    // Datenbank verbinden
    await dbConnect();
    
    // Modelle dynamisch importieren
    try {
      const { Survey: SurveyModel } = await import('@/models/Survey');
      const { Company: CompanyModel } = await import('@/models/Company');
      
      Survey = SurveyModel;
      Company = CompanyModel;
      
      console.log('Modelle für Status-Update erfolgreich importiert');
    } catch (importError) {
      console.error('Fehler beim Importieren der Modelle:', importError);
      return NextResponse.json({ error: 'Datenbankfehler beim Laden der Modelle' }, { status: 500 });
    }
    
    // Anfrageinhalt abrufen
    const body = await request.json();
    const { status } = body;
    
    if (!status || !Object.values(SurveyStatus).includes(status as SurveyStatus)) {
      return NextResponse.json({ error: 'Ungültiger Status' }, { status: 400 });
    }
    
    // Umfrage finden
    let survey;
    if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      survey = await Survey.findById(cleanId);
    } else {
      survey = await Survey.findOne({ id: cleanId });
    }
    
    if (!survey) {
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }
    
    // Berechtigungsprüfung basierend auf Benutzerrolle
    const userRole = session.user.role;
    const isMeditecAdmin = userRole === 'meditec_admin';
    const isCompanyAdmin = userRole === 'company_admin';
    
    // Prüfen, ob der Unternehmensadmin zum zugewiesenen Unternehmen gehört
    let hasCompanyAccess = false;
    
    if (isCompanyAdmin && session.user.companyId) {
      const assignedCompanies = Array.isArray(survey.assignedCompanies) ? 
        survey.assignedCompanies.map((id: string) => id.toString()) : 
        [];
        
      hasCompanyAccess = assignedCompanies.includes(session.user.companyId.toString());
      
      // Falls nicht direkt gefunden, prüfe auch in specialCompanyNames
      if (!hasCompanyAccess && Array.isArray(survey.specialCompanyNames)) {
        const company = await Company.findById(session.user.companyId);
        if (company) {
          hasCompanyAccess = survey.specialCompanyNames.includes(company.name);
        }
      }
    }
    
    // Regeln für Statusübergänge basierend auf der Rolle
    let isAllowed = false;
    
    if (isMeditecAdmin) {
      // Meditec-Admin darf den Status von Entwurf auf "Für Unternehmen freigegeben" setzen
      // und umgekehrt
      if (
        (survey.status === SurveyStatus.DRAFT && status === SurveyStatus.SCHEDULED) ||
        (survey.status === SurveyStatus.SCHEDULED && status === SurveyStatus.DRAFT) ||
        (survey.status === SurveyStatus.ACTIVE && status === SurveyStatus.DRAFT)
      ) {
        isAllowed = true;
      }
    } else if (isCompanyAdmin && hasCompanyAccess) {
      // Unternehmensadmin darf nur freigegebene Umfragen aktivieren und aktive beenden
      if (
        (survey.status === SurveyStatus.SCHEDULED && status === SurveyStatus.ACTIVE) ||
        (survey.status === SurveyStatus.ACTIVE && status === SurveyStatus.COMPLETED)
      ) {
        isAllowed = true;
      }
    }
    
    if (!isAllowed) {
      return NextResponse.json({ 
        error: 'Keine Berechtigung für diese Statusänderung' 
      }, { status: 403 });
    }
    
    // Status aktualisieren
    survey.status = status;
    survey.updatedAt = new Date();
    
    // Für die Audit-Nachverfolgung auch speichern, wer den Status geändert hat
    survey.lastStatusChangeBy = session.user.id;
    survey.lastStatusChangeAt = new Date();
    
    await survey.save();
    
    console.log(`Umfragestatus aktualisiert: ${survey.id}, Neuer Status: ${status}`);
    
    return NextResponse.json({
      message: 'Umfragestatus erfolgreich aktualisiert',
      surveyId: survey.id || survey._id,
      status: survey.status
    });
    
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Umfragestatus:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Umfragestatus' }, { status: 500 });
  }
}
