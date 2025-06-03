import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { Survey } from '@/models/Survey';

export async function GET(req: NextRequest) {
  try {
    // Authentifizierung und Autorisierung prüfen
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung für diese Ressource' }, { status: 403 });
    }
    
    // Verbindung zur Datenbank herstellen
    await dbConnect();
    
    // Die neuesten 5 Umfragen abrufen, sortiert nach Erstellungsdatum
    const recentSurveys = await Survey.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Daten transformieren und zurückgeben
    const formattedSurveys = recentSurveys.map(survey => ({
      id: survey._id ? survey._id.toString() : '',
      title: survey.title,
      status: survey.status,
      createdAt: survey.createdAt,
      assignedCompanies: Array.isArray(survey.assignedCompanies) ? survey.assignedCompanies : [],
      blocks: survey.blocks?.length || 0 // Anzahl der Blöcke für Übersicht
    }));
    
    return NextResponse.json({ surveys: formattedSurveys });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der neuesten Umfragen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der neuesten Umfragen' },
      { status: 500 }
    );
  }
}
