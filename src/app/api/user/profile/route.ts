import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import crypto from 'crypto';

// PUT /api/user/profile - Profilinformationen aktualisieren
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await dbConnect();
    
    const { name, email } = await req.json();
    
    // Benutzer finden
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }
    
    // Prüfen, ob E-Mail geändert wurde
    let emailChangeRequested = false;
    if (email && email !== user.email) {
      // Prüfen, ob die E-Mail bereits verwendet wird
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return NextResponse.json({
          error: 'Diese E-Mail-Adresse wird bereits verwendet'
        }, { status: 409 });
      }
      
      // Token für E-Mail-Änderung generieren
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 Stunden gültig
      
      // Aktualisierung des Benutzers mit Verifizierungstoken
      user.verificationToken = verificationToken;
      user.resetTokenExpiry = verificationTokenExpiry;
      user.pendingEmail = email; // Neue E-Mail temporär speichern
      
      // Hier würde normalerweise ein E-Mail mit Bestätigungslink versendet werden
      // sendVerificationEmail(user.email, verificationToken, email);
      
      emailChangeRequested = true;
    }
    
    // Name aktualisieren
    if (name) {
      user.name = name;
    }
    
    await user.save();
    
    return NextResponse.json({
      message: 'Profil erfolgreich aktualisiert',
      emailChangeRequested,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Profils' }, { status: 500 });
  }
}
