import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

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
    // UUID-Format: 8-4-4-4-12 Zeichen (36 Zeichen mit Bindestrichen)
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

// GET /api/surveys/[id] - Details einer einzelnen Umfrage abrufen
export async function GET(
  request: NextRequest,
  context: unknown
) {
  // Params extrahieren für Next.js App Router
  const { params } = context as { params: { id: string } };
  const id = params.id;
  let survey = null;
  let session: any = null;
  
  console.log('GET-Anfrage für Umfrage erhalten, ID:', id);

  // ID validieren
  const { isValid, cleanId, errorMessage } = validateAndCleanId(id);
  
  if (!isValid || !cleanId) {
    return NextResponse.json(
      { error: errorMessage || 'Ungültige Umfrage-ID' },
      { status: 400 }
    );
  }
  
  console.log('Validierte Umfrage-ID:', cleanId);
  
  try {
    // Datenbank verbinden
    await dbConnect();
    
    // Modelle dynamisch importieren
    try {
      const { Survey: SurveyModel } = await import('@/models/Survey');
      const { Company: CompanyModel } = await import('@/models/Company');
      
      Survey = SurveyModel;
      Company = CompanyModel;
      
      console.log('Modelle für einzelne Umfrage erfolgreich importiert');
    } catch (importError) {
      console.error('Fehler beim Importieren der Modelle:', importError);
      return NextResponse.json({ error: 'Datenbankfehler beim Laden der Modelle' }, { status: 500 });
    }
    
    // Sitzung abrufen
    session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Umfrage abrufen
    if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      survey = await Survey.findById(cleanId).lean();
    } else {
      // Wenn die ID eine UUID ist, suchen wir über das id-Feld
      survey = await Survey.findOne({ id: cleanId }).lean();
    }
    
    if (!survey) {
      console.error(`Umfrage mit ID ${cleanId} wurde nicht gefunden`);
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }
    
    // Sicherstellen, dass blocks-Array vorhanden ist
    if (!survey.blocks || !Array.isArray(survey.blocks)) {
      survey.blocks = [];
      console.warn('Keine Blöcke in der Umfrage gefunden oder blocks ist kein Array');
    }
    
    // Prüfen, ob jeder Block eine ID hat und Fragen korrekt strukturiert sind
    survey.blocks.forEach((block: any) => {
      if (!block.id) {
        block.id = block._id ? block._id.toString() : new mongoose.Types.ObjectId().toString();
        console.warn('Block ohne ID gefunden, ID wurde generiert:', block.id);
      }
      
      // Sicherstellen, dass Fragen im Block korrekt strukturiert sind
      if (block.questions && Array.isArray(block.questions)) {
        block.questions.forEach((question: any) => {
          // Eindeutige ID für jede Frage sicherstellen
          if (!question.id) {
            question.id = question._id ? question._id.toString() : new mongoose.Types.ObjectId().toString();
          }
          
          // OrderId sicherstellen
          if (question.order === undefined || question.order === null) {
            question.order = 0;
          }
        });
      } else {
        block.questions = [];
      }
    });
    
    console.log(`Umfrage ${cleanId} geladen: ${survey.blocks.length} Blöcke`);
    if (survey.blocks.length > 0 && survey.blocks[0].questions && survey.blocks[0].questions.length > 0) {
      console.log('Beispielfrage aus Block:', survey.blocks[0].questions[0].text);
    }
    
    // Für die Unternehmensanzeige im Frontend beide Felder anzeigen
    console.log('AssignedCompanies nach Konvertierung:', survey.assignedCompanies || []);
    
    // Kombinierte Liste aller Unternehmen (MongoDB-IDs und spezielle Namen)
    const allCompanies = [
      ...(survey.assignedCompanies || []),
      ...(survey.specialCompanyNames || [])
    ];
    
    // Für die Rückgabe an das Frontend
    survey.assignedCompanies = allCompanies;

    // Prüfen, ob der Benutzer Zugriff auf diese Umfrage hat
    const isCompanyAdmin = session.user.role === 'company_admin';
    const isMeditecAdmin = session.user.role === 'meditec_admin';
    console.log('Benutzerrolle:', session.user.role);
    
    // Admin hat immer Zugriff
    if (isMeditecAdmin) {
      // Für Admin erfolgt keine weitere Prüfung
    } 
    // Für Unternehmensadmin prüfen wir die Zuordnung
    else if (isCompanyAdmin && session.user.companyId) {
      try {
        // Unternehmensname für die Suche in specialCompanyNames ermitteln
        const company = await Company.findById(session.user.companyId).lean();
        
        if (!company) {
          console.error('Unternehmen nicht gefunden:', session.user.companyId);
          return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 403 });
        }
        
        const companyName = company.name;
        
        // Zugriff erlauben, wenn das Unternehmen in assignedCompanies ODER in specialCompanyNames ist
        const originalAssignedCompanies = Array.isArray(survey.assignedCompanies) ? survey.assignedCompanies : [];
        const specialCompanyNames = Array.isArray(survey.specialCompanyNames) ? survey.specialCompanyNames : [];
        
        const hasAccessViaId = originalAssignedCompanies.some(companyId => 
          companyId && companyId.toString() === session.user.companyId?.toString()
        );
        
        const hasAccessViaName = specialCompanyNames.includes(companyName);
        
        if (!hasAccessViaId && !hasAccessViaName) {
          console.error('Zugriff verweigert für Unternehmen:', session.user.companyId, companyName);
          return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
        }
      } catch (error) {
        console.error('Fehler bei der Berechtigungsprüfung:', error);
        return NextResponse.json({ error: 'Fehler bei der Berechtigungsprüfung' }, { status: 500 });
      }
    } else {
      // Benutzer ohne Admin-Rolle haben keinen Zugriff
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
    }

    // Wandle die Mongoose-Daten in ein normales JavaScript-Objekt um
    const surveyData = JSON.parse(JSON.stringify(survey));
    
    // WICHTIG: Die ursprüngliche UUID der Umfrage bewahren, nicht mit der MongoDB-ID überschreiben
    // Wenn eine UUID vorhanden ist, verwenden wir diese, sonst die MongoDB-ID als Fallback
    const responseData = {
      ...surveyData,
      id: surveyData.id || (surveyData._id ? surveyData._id.toString() : undefined),
      _id: surveyData._id ? surveyData._id.toString() : undefined,
      
      // Konvertiere alle Objekt-IDs in Strings
      assignedCompanies: [
        ...(Array.isArray(surveyData.assignedCompanies) 
          ? surveyData.assignedCompanies.map((id: any) => 
              typeof id === 'object' && id._id ? id._id.toString() : id.toString())
          : []),
        ...(Array.isArray(surveyData.specialCompanyNames) ? surveyData.specialCompanyNames : [])
      ]
    };
    
    // Debug-Logs zur Fehlersuche
    console.log('UUID der Umfrage:', responseData.id);
    console.log('MongoDB-ID der Umfrage:', responseData._id);
    console.log('Blöcke:', responseData.blocks ? responseData.blocks.length : 0);
    console.log('AssignedCompanies nach Konvertierung:', responseData.assignedCompanies);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Fehler beim Abrufen der Umfrage:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Umfrage' }, { status: 500 });
  }
}

// PUT /api/surveys/[id] - Umfrage aktualisieren
export async function PUT(
  request: NextRequest,
  context: unknown
) {
  // Params extrahieren für Next.js App Router
  const { params } = context as { params: { id: string } };
  const id = params.id;
  
  console.log('PUT-Anfrage für Umfrage erhalten, ID:', id);
  
  // ID validieren und bereinigen
  const validation = validateAndCleanId(id);
  if (!validation.isValid) {
    console.error(`Fehler bei der ID-Validierung: ${validation.errorMessage}`);
    return NextResponse.json({ error: validation.errorMessage }, { status: 400 });
  }
  
  const cleanId = validation.cleanId!;
  console.log('Validierte Umfrage-ID für Update:', cleanId);
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Meditec-Admins dürfen Umfragen aktualisieren
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zur Aktualisierung von Umfragen' }, { status: 403 });
    }

    await dbConnect();

    // Umfrage finden - Hier unterscheiden wir zwischen MongoDB ObjectId und UUID
    let survey;
    
    // Wenn die ID eine MongoDB ObjectId ist (24 Zeichen Hex)
    if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      survey = await Survey.findById(cleanId);
    } else {
      // Wenn die ID eine UUID ist, suchen wir über das id-Feld
      survey = await Survey.findOne({ id: cleanId });
    }
    
    if (!survey) {
      console.error(`Umfrage mit ID ${cleanId} wurde nicht gefunden`);
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }

    // Daten aus der Anfrage extrahieren
    const data = await request.json();
    
    // Teilaktualisierung oder vollständige Aktualisierung unterscheiden
    if (data.status && Object.keys(data).length === 1) {
      // Nur Status-Update
      console.log(`Aktualisiere Status der Umfrage ${id} zu ${data.status}`);
      survey.status = data.status;
      survey.updatedAt = new Date();
    } else {
      // Vollständige Aktualisierung der Umfrage
      const { title, description, blocks, assignedCompanies, isAnonymous, startDate, endDate, status } = data;
      
      // Pflichtfelder validieren
      if (title !== undefined) survey.title = title;
      if (description !== undefined) survey.description = description;
      if (blocks !== undefined) survey.blocks = blocks;
      if (assignedCompanies !== undefined) survey.assignedCompanies = assignedCompanies;
      if (isAnonymous !== undefined) survey.isAnonymous = isAnonymous;
      if (startDate !== undefined) survey.startDate = startDate;
      if (endDate !== undefined) survey.endDate = endDate;
      if (status !== undefined) survey.status = status;
      
      survey.updatedAt = new Date();
    }

    await survey.save();
    
    // Umfrageobjekt mit korrekter ID für Frontend zurückgeben
    const updatedSurvey = survey.toObject();
    if (updatedSurvey._id) {
      updatedSurvey.id = updatedSurvey._id.toString();
    }
    
    console.log('Umfrage aktualisiert mit ID:', updatedSurvey.id);

    return NextResponse.json({
      message: 'Umfrage erfolgreich aktualisiert',
      survey: updatedSurvey
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Umfrage:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Umfrage' }, { status: 500 });
  }
}

// DELETE /api/surveys/[id] - Umfrage löschen
export async function DELETE(
  request: NextRequest,
  context: unknown
) {
  // Params extrahieren für Next.js App Router
  const { params } = context as { params: { id: string } };
  const id = params.id;
  
  console.log('DELETE-Anfrage für Umfrage erhalten, ID:', id);
  
  // ID validieren und bereinigen
  const validation = validateAndCleanId(id);
  if (!validation.isValid) {
    console.error(`Fehler bei der ID-Validierung: ${validation.errorMessage}`);
    return NextResponse.json({ error: validation.errorMessage }, { status: 400 });
  }
  
  const cleanId = validation.cleanId!;
  console.log('Validierte Umfrage-ID für Löschung:', cleanId);
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Meditec-Admins dürfen Umfragen löschen
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Löschen von Umfragen' }, { status: 403 });
    }

    await dbConnect();
    
    // Dynamisches Laden des Survey-Modells nach dem DB-Connect
    try {
      const { Survey: SurveyModel } = await import('@/models/Survey');
      Survey = SurveyModel;
      console.log('Survey-Modell für DELETE erfolgreich importiert');
    } catch (importError) {
      console.error('Fehler beim Importieren des Survey-Modells für DELETE:', importError);
      return NextResponse.json({ error: 'Datenbankfehler beim Laden des Modells' }, { status: 500 });
    }

    // Umfrage finden und löschen - Unterscheidung zwischen MongoDB ObjectId und UUID
    let survey;
    
    // Wenn die ID eine MongoDB ObjectId ist (24 Zeichen Hex)
    if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      survey = await Survey.findByIdAndDelete(cleanId);
    } else {
      // Wenn die ID eine UUID ist, suchen wir über das id-Feld und löschen
      survey = await Survey.findOneAndDelete({ id: cleanId });
    }
    
    if (!survey) {
      console.error(`Umfrage mit ID ${cleanId} wurde nicht gefunden`);
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Umfrage erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Umfrage:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Umfrage' }, { status: 500 });
  }
}
