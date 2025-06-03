import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import { Survey } from '@/models/Survey';
import { SurveyResponse } from '@/models/SurveyResponse';
import dbConnect from '@/lib/dbConnect';

// GET /api/company/dashboard - Dashboard-Daten für das Unternehmen abrufen
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Unternehmensadmins dürfen auf das Dashboard zugreifen
    if (session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Zugriff auf das Dashboard' }, { status: 403 });
    }

    // Sicherstellen, dass eine Unternehmens-ID vorhanden ist
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Kein Unternehmen zugewiesen' }, { status: 400 });
    }

    await dbConnect();

    // 1. Grundlegende Unternehmensinformationen abrufen
    const company = await Company.findById(session.user.companyId).lean();
    
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // Typsichere Konvertierung
    const companyData = company as any;

    // 2. Anzahl der Mitarbeiter
    const totalEmployees = await User.countDocuments({
      companyId: session.user.companyId
    });

    const activeEmployees = await User.countDocuments({
      companyId: session.user.companyId,
      active: true
    });

    // 3. Anzahl der Abteilungen
    const departmentsCount = companyData.departments?.length || 0;

    // 4. Umfrage-Statistiken
    // Firmenname für spezielle Zuweisung ermitteln
    const companyName = companyData.name;
    
    const activeSurveys = await Survey.countDocuments({
      $or: [
        { assignedCompanies: session.user.companyId },
        { specialCompanyNames: companyName }
      ],
      status: 'active'
    });

    const completedSurveys = await Survey.countDocuments({
      $or: [
        { assignedCompanies: session.user.companyId },
        { specialCompanyNames: companyName }
      ],
      status: 'completed'
    });

    // 5. Letzte Umfrageaktivität
    const recentSurveys = await Survey.find({
      $or: [
        { assignedCompanies: session.user.companyId },
        { specialCompanyNames: companyName }
      ],
      status: { $in: ['active', 'completed'] }
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('title status createdAt updatedAt')
    .lean();

    // 6. Teilnahmequote (response rate) der letzten aktiven Umfragen
    const surveyResponseRates = await calculateResponseRates(session.user.companyId);

    // Dashboard-Daten zurückgeben
    return NextResponse.json({
      companyName: companyData.name,
      companyId: companyData._id,
      stats: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees,
        },
        departments: departmentsCount,
        surveys: {
          active: activeSurveys,
          completed: completedSurveys,
          total: activeSurveys + completedSurveys
        }
      },
      recentActivity: {
        surveys: recentSurveys.map(survey => ({
          id: survey._id,
          title: survey.title,
          status: survey.status,
          createdAt: survey.createdAt,
          updatedAt: survey.updatedAt
        }))
      },
      responseRates: surveyResponseRates
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Daten:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Dashboard-Daten' }, { status: 500 });
  }
}

// Berechnung der Teilnahmequote für Umfragen
async function calculateResponseRates(companyId: string) {
  // Unternehmen holen, um den Namen zu bekommen
  const company = await Company.findById(companyId).lean();
  const companyName = company ? (company as any).name : '';
  
  // Die 5 neuesten aktiven oder kürzlich abgeschlossenen Umfragen holen
  const recentSurveys = await Survey.find({
    $or: [
      { assignedCompanies: companyId },
      { specialCompanyNames: companyName }
    ],
    status: { $in: ['active', 'completed'] }
  })
  .sort({ updatedAt: -1 })
  .limit(5)
  .lean();
  
  // Response-Raten berechnen
  const responseRates = await Promise.all(
    recentSurveys.map(async (survey) => {
      try {
        // Sicherstellen, dass die Datenbankverbindung vor jeder Abfrage besteht
        await dbConnect();
        
        // Anzahl der Mitarbeiter, die zur Teilnahme berechtigt waren
        const eligibleEmployees = await User.countDocuments({
          companyId,
          active: true
        });
        
        // Anzahl der tatsächlichen Teilnahmen
        const responses = await SurveyResponse.countDocuments({
          surveyId: survey._id,
          userId: { $exists: true }, // Nur vollständige Antworten zählen
          companyId
        });
        
        // Response-Rate berechnen (Prozent)
        const responseRate = eligibleEmployees > 0 
          ? Math.round((responses / eligibleEmployees) * 100) 
          : 0;
        
        console.log(`Response-Rate für Umfrage ${survey.title}: ${responseRate}% (${responses}/${eligibleEmployees})`);
        
        return {
          surveyId: survey._id,
          title: survey.title,
          responseRate
        };
      } catch (error) {
        console.error(`Fehler bei Berechnung der Response-Rate für Umfrage ${survey._id}:`, error);
        return {
          surveyId: survey._id,
          title: survey.title || 'Unbekannte Umfrage',
          responseRate: 0
        };
      }
      
      return {
        surveyId: survey._id,
        title: survey.title,
        status: survey.status,
        eligible: eligibleEmployees,
        responses,
        responseRate
      };
    })
  );
  
  return responseRates;
}
