import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Survey } from '@/models/Survey';
import { SurveyStatus } from '@/types/survey';

// GET: Öffentliche Umfragedaten abrufen (ohne Authentifizierung)
export async function GET(
  req: NextRequest,
  context: unknown
) {
  // Context in das erwartete Format umwandeln
  const { params } = context as { params: { id: string } };
  try {
    const surveyId = params.id;
    if (!surveyId) {
      return NextResponse.json({ error: 'Umfrage-ID fehlt' }, { status: 400 });
    }

    await dbConnect();

    // Umfrage abrufen, aber nur aktive oder abgeschlossene Umfragen
    const survey = await Survey.findOne({
      _id: surveyId,
      status: { $in: [SurveyStatus.ACTIVE, SurveyStatus.COMPLETED] }
    });

    if (!survey) {
      return NextResponse.json({ error: 'Umfrage nicht gefunden oder nicht verfügbar' }, { status: 404 });
    }

    // Umfragedaten zurückgeben, aber nur die notwendigen Felder
    // Sensible Daten wie interne Notizen werden nicht zurückgegeben
    return NextResponse.json({
      _id: survey._id,
      title: survey.title,
      description: survey.description,
      blocks: survey.blocks,
      status: survey.status,
      isAnonymous: survey.isAnonymous,
      startDate: survey.startDate,
      endDate: survey.endDate,
      createdAt: survey.createdAt,
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der öffentlichen Umfrage:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
