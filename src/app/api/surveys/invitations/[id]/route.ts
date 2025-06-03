import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { SurveyInvitation } from '@/models/SurveyInvitation';
import { Survey } from '@/models/Survey';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import { SurveyStatus } from '@/types/survey';
import { sendEmail } from '@/lib/email';

// DELETE: Einladung löschen
export async function DELETE(
  request: NextRequest,
  context: unknown
) {
  // Context in das erwartete Format umwandeln
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const invitationId = params.id;
    if (!invitationId) {
      return NextResponse.json({ error: 'Einladungs-ID fehlt' }, { status: 400 });
    }

    await dbConnect();

    // Einladung abrufen
    const invitation = await SurveyInvitation.findById(invitationId);
    if (!invitation) {
      return NextResponse.json({ error: 'Einladung nicht gefunden' }, { status: 404 });
    }

    // Berechtigungsprüfung
    const user = await User.findById(session.user.id);
    const isAdmin = user.role === 'admin';
    const isCompanyAdmin = user.role === 'company_admin';
    
    if (isCompanyAdmin) {
      // Prüfen, ob die Einladung zum Unternehmen des Administrators gehört
      if (invitation.companyId.toString() !== user.company.toString()) {
        return NextResponse.json({ error: 'Keine Berechtigung zum Löschen dieser Einladung' }, { status: 403 });
      }
    } else if (!isAdmin) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Löschen von Einladungen' }, { status: 403 });
    }

    // Einladung löschen
    await SurveyInvitation.findByIdAndDelete(invitationId);

    return NextResponse.json({ success: true, message: 'Einladung erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Einladung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
