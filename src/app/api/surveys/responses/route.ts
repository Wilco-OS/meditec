import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SurveyResponse } from '@/models/SurveyResponse';
import { Survey } from '@/models/Survey';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/surveys/responses - Alle Antworten mit Filter abrufen
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Admins dürfen alle Antworten sehen
    const isMeditecAdmin = session.user.role === 'meditec_admin';
    const isCompanyAdmin = session.user.role === 'company_admin';
    
    if (!isMeditecAdmin && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Abrufen von Umfrageantworten' }, { status: 403 });
    }

    await dbConnect();

    // URL-Parameter für Filteroption extrahieren
    const searchParams = req.nextUrl.searchParams;
    const surveyId = searchParams.get('surveyId');
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 50;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const skip = (page - 1) * limit;

    // Basis-Query
    const queryObj: any = {};

    // Filter anwenden
    if (surveyId) {
      if (!mongoose.Types.ObjectId.isValid(surveyId)) {
        return NextResponse.json({ error: 'Ungültige Umfrage-ID' }, { status: 400 });
      }
      queryObj.surveyId = surveyId;
    }

    if (userId && isMeditecAdmin) { // Nur Meditec-Admins dürfen nach Benutzer filtern
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ error: 'Ungültige Benutzer-ID' }, { status: 400 });
      }
      queryObj.userId = userId;
    }

    // Unternehmensadmins sehen nur Antworten ihres Unternehmens
    if (isCompanyAdmin) {
      queryObj.companyId = session.user.companyId;
    } else if (companyId && isMeditecAdmin) { // Nur Meditec-Admins dürfen nach Unternehmen filtern
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
      }
      queryObj.companyId = companyId;
    }

    // Antworten abrufen mit Pagination
    const responses = await SurveyResponse.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email') // Benutzerinformationen
      .populate('surveyId', 'title') // Umfrageinformationen
      .lean();

    // Gesamtanzahl für Pagination
    const total = await SurveyResponse.countDocuments(queryObj);

    return NextResponse.json({ 
      responses, 
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      } 
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Umfrageantworten:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Umfrageantworten' }, { status: 500 });
  }
}

// POST /api/surveys/responses - Neue Umfrageantwort einreichen
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await connectToDatabase();

    const data = await req.json();
    const { surveyId, answers } = data;

    if (!surveyId || !answers) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      return NextResponse.json({ error: 'Ungültige Umfrage-ID' }, { status: 400 });
    }

    // Prüfen, ob die Umfrage existiert und aktiv ist
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }
    
    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'Umfrage ist nicht aktiv' }, { status: 400 });
    }

    // Prüfen, ob der Benutzer berechtigt ist, an dieser Umfrage teilzunehmen
    const isEmployeeOfAssignedCompany = survey.assignedCompanies.some(
      companyId => companyId.toString() === session.user.companyId?.toString()
    );
    
    if (!isEmployeeOfAssignedCompany) {
      return NextResponse.json({ error: 'Keine Berechtigung zur Teilnahme an dieser Umfrage' }, { status: 403 });
    }

    // Prüfen, ob der Benutzer bereits an dieser Umfrage teilgenommen hat
    const existingResponse = await SurveyResponse.findOne({
      surveyId,
      userId: session.user.id
    });

    if (existingResponse) {
      return NextResponse.json({ error: 'Sie haben bereits an dieser Umfrage teilgenommen' }, { status: 400 });
    }

    // Neue Antwort erstellen
    const newResponse = new SurveyResponse({
      surveyId,
      userId: survey.isAnonymous ? null : session.user.id, // Bei anonymen Umfragen keinen Benutzer speichern
      companyId: session.user.companyId,
      answers,
      completedAt: new Date()
    });

    await newResponse.save();

    return NextResponse.json({ 
      message: 'Umfrageantwort erfolgreich eingereicht',
      responseId: newResponse._id
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Einreichen der Umfrageantwort:', error);
    return NextResponse.json({ error: 'Fehler beim Einreichen der Umfrageantwort' }, { status: 500 });
  }
}
