import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Survey } from '@/models/Survey';
import { SurveyInvitation } from '@/models/SurveyInvitation';
import { SurveyStatus } from '@/types/survey';

// GET: Einladungscode verifizieren und Umfragedaten zurückgeben
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const surveyId = searchParams.get('surveyId');
    const code = searchParams.get('code');

    if (!surveyId || !code) {
      return NextResponse.json(
        { error: 'Umfrage-ID und Einladungscode sind erforderlich' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Einladung anhand des Codes suchen
    const invitation = await SurveyInvitation.findOne({
      surveyId,
      invitationCode: code.trim(),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Ungültiger Einladungscode für diese Umfrage' },
        { status: 404 }
      );
    }

    // Umfrage abrufen
    const survey = await Survey.findOne({
      _id: surveyId,
      status: { $in: [SurveyStatus.ACTIVE, SurveyStatus.COMPLETED] }
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Umfrage nicht gefunden oder nicht aktiv' },
        { status: 404 }
      );
    }

    // Öffentliche Umfragedaten zurückgeben und die Einladungsinformationen
    return NextResponse.json({
      invitation: {
        _id: invitation._id,
        name: invitation.name,
        email: invitation.email,
        status: invitation.status,
        sentAt: invitation.sentAt,
        completedAt: invitation.completedAt,
      },
      survey: {
        _id: survey._id,
        title: survey.title,
        description: survey.description,
        blocks: survey.blocks,
        status: survey.status,
        isAnonymous: survey.isAnonymous,
        startDate: survey.startDate,
        endDate: survey.endDate,
        createdAt: survey.createdAt,
      }
    });
  } catch (error) {
    console.error('Fehler bei der Verifizierung des Einladungscodes:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
