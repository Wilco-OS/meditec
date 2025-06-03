import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { CompanyInvitation } from '@/models/CompanyInvitation';
import { User } from '@/models/User';
import { Company } from '@/models/Company';

// GET /api/auth/verify-invitation - Überprüft einen Einladungscode
export async function GET(req: NextRequest) {
  try {
    // Parameter aus der URL extrahieren
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email');
    const code = searchParams.get('code');
    
    console.log('Verifikationsversuch:', { email, code });
    
    if (!email || !code) {
      return NextResponse.json({ 
        error: 'E-Mail und Einladungscode sind erforderlich' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // Erst alle Benutzer mit dieser E-Mail finden (für besseres Debugging)
    const allUsers = await User.find({ email: email.toLowerCase() });
    console.log(`${allUsers.length} Benutzer mit dieser E-Mail gefunden`);
    
    if (allUsers.length > 0) {
      allUsers.forEach(u => {
        console.log('Gefundener Benutzer:', {
          id: u._id.toString(),
          name: u.name,
          role: u.role,
          active: u.active,
          token: u.verificationToken || 'kein Token',
          tokenMatch: (u.verificationToken || '') === code
        });
      });
    }
    
    // Überprüfen, ob ein Benutzer mit dieser E-Mail und dem Code existiert
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      verificationToken: code
    });
    
    if (!user) {
      console.log('Kein Benutzer mit passendem Verification Token gefunden');
      return NextResponse.json({ 
        error: 'Ungültige Einladung. Benutzer nicht gefunden.' 
      }, { status: 404 });
    }
    
    console.log('Benutzer mit Code gefunden:', {
      id: user._id.toString(),
      name: user.name
    });

    // Prüfen, ob der Benutzer einem Unternehmen zugeordnet ist
    if (!user.companyId) {
      return NextResponse.json({ 
        error: 'Keine Unternehmenszuordnung gefunden' 
      }, { status: 400 });
    }
    
    // Unternehmensinformationen abrufen
    const company = await Company.findById(user.companyId);
    if (!company) {
      return NextResponse.json({ 
        error: 'Zugeordnetes Unternehmen nicht gefunden' 
      }, { status: 404 });
    }
    
    // Prüfen, ob eine entsprechende Einladung existiert
    const invitation = await CompanyInvitation.findOne({
      company: user.companyId,
      email: email.toLowerCase(),
      invitationCode: code,
      usedAt: { $exists: false }
    });

    // Einladung ist möglicherweise nicht gefunden, aber wenn der Benutzer existiert und 
    // den korrekten Token hat, können wir trotzdem fortfahren
    // Auch wenn der Benutzer bereits verifiziert ist, erlauben wir die Abfrage der Infos
    // Das macht die Benutzererfahrung besser, falls er auf den Link mehrfach klickt
    const isAlreadyVerified = user && user.emailVerified;
    if (isAlreadyVerified) {
      console.log('Benutzer bereits verifiziert am:', user.emailVerified);
      // Wir geben trotzdem Erfolg zurück, damit der Benutzer sein Passwort zurücksetzen kann
      // Aber informieren ihn im Frontend, dass der Account bereits aktiviert ist
    }
    
    // Erfolgreiche Überprüfung
    return NextResponse.json({ 
      success: true, 
      companyName: company.name,
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Fehler bei der Überprüfung des Einladungscodes:', error);
    return NextResponse.json({ 
      error: 'Bei der Überprüfung ist ein Fehler aufgetreten' 
    }, { status: 500 });
  }
}
