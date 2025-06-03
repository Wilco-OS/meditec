import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import { CompanyInvitation } from '@/models/CompanyInvitation';

export async function POST(request: NextRequest) {
  try {
    // Request-Body auslesen
    const body = await request.json();
    const { email, password, invitationCode, companyId, role } = body;

    // Validierung der Eingabedaten
    if (!email || !password || !invitationCode) {
      return NextResponse.json(
        { success: false, message: 'Alle Felder müssen ausgefüllt sein' },
        { status: 400 }
      );
    }

    // Verbindung zur Datenbank herstellen
    await dbConnect();

    // Einladungscode validieren, bevor wir den Benutzer prüfen
    const invitation = await CompanyInvitation.findOne({ 
      invitationCode: invitationCode.toUpperCase(),
      email: email.toLowerCase() 
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: 'Ungültiger Einladungscode oder E-Mail-Adresse stimmt nicht überein' },
        { status: 400 }
      );
    }

    if (invitation.usedAt) {
      return NextResponse.json(
        { success: false, message: 'Dieser Einladungscode wurde bereits verwendet' },
        { status: 400 }
      );
    }

    // Prüfen, ob der Benutzer bereits existiert
    let user = await User.findOne({ email: email.toLowerCase() });
    
    // Wenn ein Benutzer existiert, versuchen wir, ihn zu aktualisieren
    if (user) {
      console.log(`Benutzer existiert bereits für E-Mail ${email}. Versuche zu aktualisieren...`);
      
      // Prüfen, ob der Benutzer bereits aktiv und vollständig registriert ist
      if (user.password && user.emailVerified) {
        console.log('Benutzer hat bereits ein Passwort und ist verifiziert. Kann nicht registriert werden.');
        return NextResponse.json(
          { success: false, message: 'Diese E-Mail-Adresse wird bereits verwendet und ist bereits aktiv.' },
          { status: 400 }
        );
      }

      // Passwort hashen
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Benutzer aktualisieren
      user.password = hashedPassword;
      user.emailVerified = new Date();
      user.companyId = invitation.company;
      user.role = role || 'company_admin';
      
      await user.save();
      
      // Einladungscode als verwendet markieren
      invitation.usedAt = new Date();
      invitation.registeredUserId = user._id;
      await invitation.save();
      
      return NextResponse.json({
        success: true,
        message: 'Benutzer erfolgreich aktualisiert und registriert',
        userId: user._id.toString(),
        role: user.role,
        emailVerified: true
      });
    }

    // Neu erstellen eines Benutzers

    // Passwort hashen
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Neuen Benutzer erstellen
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'company_admin', // Standard: Unternehmensadmin
      company: companyId || invitation.company,
      emailVerified: new Date(), // Wichtig: E-Mail wird automatisch als verifiziert markiert!
    });

    const savedUser = await newUser.save();

    // Einladungscode als verwendet markieren
    invitation.usedAt = new Date();
    invitation.registeredUserId = savedUser._id;
    await invitation.save();

    // Erfolgreiche Antwort ohne sensible Daten
    return NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich registriert',
      userId: savedUser._id.toString(),
      role: savedUser.role,
      emailVerified: true
    });
  } catch (error: any) {
    console.error('Fehler bei der Benutzerregistrierung:', error);
    
    return NextResponse.json(
      { success: false, message: 'Interner Serverfehler', error: error.message },
      { status: 500 }
    );
  }
}
