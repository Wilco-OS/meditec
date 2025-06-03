import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Sicherstellen, dass wir das Modell erst nach dem DB-Connect verwenden
let Survey: any;

// GET /api/surveys - Liste aller Umfragen abholen (mit Filtern)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Verbindung zur Datenbank herstellen
    await dbConnect();
    
    // Survey-Modell dynamisch importieren, nachdem die Datenbankverbindung hergestellt wurde
    try {
      const { Survey: SurveyModel } = await import('@/models/Survey');
      Survey = SurveyModel; // Das globale Survey-Modell aktualisieren
      console.log('Survey-Modell erfolgreich importiert');
    } catch (importError) {
      console.error('Fehler beim Importieren des Survey-Modells:', importError);
      return NextResponse.json({ error: 'Datenbankfehler beim Laden des Survey-Modells' }, { status: 500 });
    }

    // URL-Parameter für Filteroption extrahieren
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const skip = (page - 1) * limit;

    // Basis-Query
    const queryObj: any = {};

    // Status-Filter
    if (status) {
      queryObj.status = status;
    }

    // Unternehmens-Filter
    if (companyId) {
      queryObj.assignedCompanies = companyId;
    }

    // Je nach Rolle unterschiedliche Berechtigungen
    if (session.user.role === 'company_admin') {
      // Unternehmensname für die Suche in specialCompanyNames ermitteln
      const company = await (await import('@/models/Company')).Company.findById(session.user.companyId).lean();
      const companyName = company ? company.name : '';
      
      // Unternehmensadmins sehen nur Umfragen für ihr Unternehmen
      // und nur mit Status 'scheduled' (freigegeben) oder 'active' (aktiviert)
      delete queryObj.assignedCompanies; // Falls vorher gesetzt, entfernen wir es
      delete queryObj.status; // Falls vorher gesetzt, entfernen wir es
      
      // Kombinierte Abfrage: Unternehmenszugehörigkeit UND relevanter Status
      queryObj.$and = [
        { 
          $or: [
            { assignedCompanies: session.user.companyId },
            { specialCompanyNames: companyName }
          ]
        },
        {
          status: { $in: ['scheduled', 'active', 'completed'] } // Nur freigegebene, aktive oder abgeschlossene Umfragen
        }
      ];
      
      console.log('Unternehmens-Admin Query:', JSON.stringify(queryObj));
    }

    // Umfragen abrufen mit Pagination
    const surveysData = await Survey.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Gesamtanzahl für Pagination
    const total = await Survey.countDocuments(queryObj);
    
    // ID-Felder korrekt mappen für das Frontend
    const surveys = surveysData.map(survey => ({
      ...survey,
      id: survey._id ? survey._id.toString() : undefined
    }));
    
    console.log('API: Umfragen erfolgreich abgerufen, Anzahl:', surveys.length);
    if (surveys.length > 0) {
      console.log('Erste Umfrage ID:', surveys[0].id);
    }

    return NextResponse.json({ 
      surveys, 
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      } 
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Umfragen:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Umfragen' }, { status: 500 });
  }
}

// POST /api/surveys - Neue Umfrage erstellen
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Meditec-Admins dürfen Umfragen erstellen
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zur Erstellung von Umfragen' }, { status: 403 });
    }

    await dbConnect();
    
    // Survey-Modell dynamisch importieren
    try {
      const { Survey: SurveyModel } = await import('@/models/Survey');
      Survey = SurveyModel; // Das globale Survey-Modell aktualisieren
      console.log('Survey-Modell für POST erfolgreich importiert');
    } catch (importError) {
      console.error('Fehler beim Importieren des Survey-Modells:', importError);
      return NextResponse.json({ error: 'Datenbankfehler beim Laden des Survey-Modells' }, { status: 500 });
    }

    const data = await req.json();
    const { id, title, description, blocks, assignedCompanies, isAnonymous, startDate, endDate, status } = data;
    
    // Wichtig: Die vom Frontend übergebene UUID verwenden, wenn vorhanden
    const surveyId = id || undefined;
    console.log('Vom Frontend übergebene UUID:', surveyId);

    // TEMPORÄR: Protokollierung hinzufügen, um den Inhalt der Anfrage zu sehen
    console.log('API: Neue Umfrage wird erstellt');
    console.log('Titel:', title);
    console.log('Blocks:', blocks ? blocks.length : 'nicht definiert');
    console.log('Unternehmen:', assignedCompanies ? assignedCompanies.length : 'nicht definiert');
    
    // Nur minimale Validierung durchführen
    if (!title) {
      console.log('API: Validierungsfehler - Kein Titel');
      return NextResponse.json({ error: 'Der Titel ist ein Pflichtfeld' }, { status: 400 });
    }

    // WICHTIG: Rest der Validierung temporär deaktiviert für Debugging
    
    // Sicherstellen, dass blocks ein Array ist
    const validBlocks = Array.isArray(blocks) ? blocks : [];
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      console.log('API: Warnung - Keine Blöcke definiert, erstelle leeren Block');
      // Automatisch einen leeren Block erstellen, anstatt einen Fehler zu werfen
      validBlocks.push({
        id: new Date().getTime().toString(),
        title: 'Automatisch erstellter Block',
        questions: [] 
      });
    }
    
    // Sicherstellen, dass jeder Block ein questions-Array hat und jede Frage ein order-Feld
    validBlocks.forEach((block, blockIndex) => {
      if (!block.questions) {
        console.log(`API: Block ${block.title} hat kein questions-Array, wird korrigiert`);
        block.questions = [];
      }
      
      // Sicherstellen, dass jede Frage ein order-Feld hat
      if (Array.isArray(block.questions)) {
        block.questions.forEach((question: any, questionIndex: number) => {
          if (question.order === undefined || question.order === null) {
            console.log(`API: Frage ${questionIndex} in Block ${blockIndex} hat kein order-Feld, wird korrigiert`);
            question.order = questionIndex;
          }
        });
      }
    });
    
    // Unternehmenszuweisung vorbereiten und validieren
    let processedCompanies: string[] = [];
    let specialCompanyNames: string[] = [];
    
    if (Array.isArray(assignedCompanies) && assignedCompanies.length > 0) {
      console.log('Zu verarbeitende Unternehmens-IDs:', assignedCompanies);
      
      assignedCompanies.forEach(id => {
        // Leere IDs filtern
        if (!id || typeof id !== 'string' || id.trim() === '') {
          console.log(`Leere oder ungültige Unternehmens-ID übersprungen: ${id}`);
          return;
        }
        
        // Prüfen, ob es sich um eine gültige MongoDB ObjectId handelt
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
          processedCompanies.push(id);
          console.log(`Gültige MongoDB ObjectId hinzugefügt: ${id}`);
        } else {
          // Für Nicht-MongoDB-IDs speichern wir den Namen separat
          specialCompanyNames.push(id);
          console.log(`Spezielle Unternehmens-ID als Name gespeichert: ${id}`);
        }
      });
      
      console.log(`Verarbeitet: ${processedCompanies.length} MongoDB-IDs und ${specialCompanyNames.length} spezielle Namen`);
    } else {
      console.log('Keine Unternehmen zugewiesen');
    }

    const newSurvey = new Survey({
      id: surveyId, // Die vom Frontend übergebene UUID verwenden
      title,
      description,
      blocks: validBlocks,
      assignedCompanies: processedCompanies, // Gültige MongoDB ObjectIDs
      specialCompanyNames: specialCompanyNames, // Spezielle Unternehmensnamen als Array
      isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
      startDate,
      endDate,
      status: status || 'draft',
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Neue Umfrage wird mit ID erstellt:', surveyId);

    await newSurvey.save();
    
    // Umfrageobjekt konvertieren und ID-Feld korrekt mappen
    const savedSurvey = newSurvey.toObject();
    // Die generierte MongoDB ID als String verwenden
    const mongoId = savedSurvey._id ? savedSurvey._id.toString() : undefined;
    // Die ID im Frontend-Objekt auf surveyId oder mongoId setzen
    savedSurvey.id = surveyId || mongoId;
    
    // Wichtig: Sicherstellen, dass die ID auch im Datenbankmodell gespeichert wird
    const finalId = surveyId || mongoId; // Die finale ID für das Speichern in der Datenbank
    if (finalId) {
      // Wir müssen die id im Datensatz aktualisieren, damit wir sie später finden können
      await Survey.findByIdAndUpdate(savedSurvey._id, { id: finalId });
      console.log('ID im Datenbankmodell gespeichert:', finalId);
    }
    
    console.log('Umfrage mit folgender ID erstellt:', finalId);

    return NextResponse.json({ 
      message: 'Umfrage erfolgreich erstellt',
      survey: savedSurvey
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Umfrage:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen der Umfrage' }, { status: 500 });
  }
}
