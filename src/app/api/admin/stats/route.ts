import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { Company } from '@/models/Company';
import { Survey } from '@/models/Survey';
import { SurveyResponse } from '@/models/SurveyResponse';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    // Überprüfen der Authentifizierung und Autorisierung
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung für diese Ressource' }, { status: 403 });
    }
    
    // Verbindung zur Datenbank herstellen
    await dbConnect();
    
    // Parallele Abfragen für bessere Performance
    const [
      companies,
      surveys,
      responses,
      users
    ] = await Promise.all([
      Company.countDocuments({}),
      Survey.find({}).lean(),
      SurveyResponse.countDocuments({}),
      User.countDocuments({})
    ]);
    
    // Aktive Unternehmen zählen (hier definiert als Unternehmen mit mindestens einem aktiven Benutzer)
    const activeCompanies = await Company.countDocuments({ active: true });
    
    // Aktive Umfragen zählen (Status ist 'active' oder 'scheduled')
    const activeSurveys = surveys.filter(survey => 
      survey.status === 'active' || 
      survey.status === 'scheduled'
    ).length;
    
    return NextResponse.json({
      companies,
      activeCompanies,
      surveys: surveys.length,
      activeSurveys,
      responses,
      users
    });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    );
  }
}
