import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { CompanyInvitation } from '@/models/CompanyInvitation';

export async function GET(request: NextRequest) {
  try {
    // Einladungscode aus der URL-Query extrahieren
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Einladungscode ist erforderlich' },
        { status: 400 }
      );
    }

    // Verbindung zur Datenbank herstellen
    await dbConnect();

    // Einladung in der Datenbank suchen
    const invitation = await CompanyInvitation.findOne({ 
      invitationCode: code.toUpperCase() 
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: 'Einladungscode nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen, ob die Einladung abgelaufen ist
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Einladungscode ist abgelaufen' },
        { status: 400 }
      );
    }

    // Erfolgreiche Antwort mit Unternehmensinformationen
    return NextResponse.json({
      success: true,
      id: invitation._id.toString(),
      companyName: invitation.companyName,
      companyId: invitation.company.toString(),
      usedAt: invitation.usedAt || null,
      email: invitation.email
    });
  } catch (error: any) {
    console.error('Fehler bei der Validierung des Einladungscodes:', error);
    
    return NextResponse.json(
      { success: false, message: 'Interner Serverfehler', error: error.message },
      { status: 500 }
    );
  }
}
