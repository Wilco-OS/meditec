import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { SurveyInvitation } from '@/models/SurveyInvitation';
import { User } from '@/models/User';
import { Survey } from '@/models/Survey';

// In Next.js 13+ App Router müssen dynamische Routen einen standardisierten context-Parameter verwenden
export async function GET(
  request: NextRequest,
  context: unknown
) {
  // Context in das erwartete Format umwandeln
  const { params } = context as { params: { id: string } };
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  
  const { id } = context.params;
  
  if (!id) {
    return NextResponse.json({ error: 'Mitarbeiter-ID fehlt' }, { status: 400 });
  }
  
  try {
    await dbConnect();
    
    // Prüfen, ob der Benutzer existiert
    const employee = await User.findById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }
    
    // Prüfen, ob der anfragende Benutzer berechtigt ist (Admin oder aus dem gleichen Unternehmen)
    const requester = await User.findById(session.user.id);
    
    if (
      requester.role !== 'admin' && 
      requester.role !== 'meditec_admin' && 
      (requester.role !== 'company_admin' || requester.companyId.toString() !== employee.companyId.toString())
    ) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }
    
    // Einladungen für den Mitarbeiter abrufen (basierend auf der E-Mail-Adresse)
    const invitations = await SurveyInvitation.find({ email: employee.email })
      .sort({ sentAt: -1 });
    
    // Umfrageinformationen hinzufügen
    const detailedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        const survey = await Survey.findById(invitation.surveyId).lean();
        
        return {
          id: invitation._id,
          surveyId: invitation.surveyId,
          surveyTitle: survey ? survey.title : 'Unbekannte Umfrage',
          status: invitation.status,
          sentAt: invitation.sentAt,
          completedAt: invitation.completedAt,
          invitationCode: invitation.invitationCode,
          departmentId: invitation.departmentId || null
        };
      })
    );
    
    return NextResponse.json({ invitations: detailedInvitations });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Einladungen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Einladungen' },
      { status: 500 }
    );
  }
}
