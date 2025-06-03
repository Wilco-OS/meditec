import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Survey } from '@/models/Survey';
import { SurveyInvitation } from '@/models/SurveyInvitation';
import { SurveyResponse } from '@/models/SurveyResponse';
import { SurveyStatus } from '@/types/survey';

// POST: Antworten zur Umfrage einreichen (mit Einladungscode)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { surveyId, invitationId, answers } = body;

    if (!surveyId || !invitationId || !answers) {
      return NextResponse.json(
        { error: 'Umfrage-ID, Einladungs-ID und Antworten sind erforderlich' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Einladung überprüfen
    const invitation = await SurveyInvitation.findById(invitationId);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Einladung nicht gefunden' },
        { status: 404 }
      );
    }

    // Sicherstellen, dass die Einladung zur angegebenen Umfrage gehört
    if (invitation.surveyId.toString() !== surveyId) {
      return NextResponse.json(
        { error: 'Einladung gehört nicht zu dieser Umfrage' },
        { status: 400 }
      );
    }

    // Prüfen, ob die Einladung bereits verwendet wurde
    if (invitation.status === 'completed') {
      return NextResponse.json(
        { error: 'Diese Einladung wurde bereits verwendet' },
        { status: 400 }
      );
    }

    // Umfrage abrufen und Status überprüfen
    const survey = await Survey.findOne({
      _id: surveyId,
      status: SurveyStatus.ACTIVE
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Umfrage nicht gefunden oder nicht aktiv' },
        { status: 404 }
      );
    }

    // Antwort speichern
    const response = await SurveyResponse.create({
      surveyId,
      answers,
      respondentType: 'invitation',
      respondentId: invitation._id,
      companyId: invitation.companyId,
      respondentInfo: {
        name: invitation.name,
        email: invitation.email
      },
      completedAt: new Date()
    });

    // Einladungsstatus aktualisieren
    invitation.status = 'completed';
    invitation.completedAt = new Date();
    await invitation.save();

    // Erfolgsantwort senden
    return NextResponse.json({
      success: true,
      message: 'Antworten erfolgreich gespeichert',
      responseId: response._id
    });
  } catch (error) {
    console.error('Fehler beim Einreichen der Umfrageantworten:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
