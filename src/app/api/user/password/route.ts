import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import bcrypt from 'bcrypt';

// PUT /api/user/password - Passwort ändern
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await dbConnect();
    
    const { currentPassword, newPassword } = await req.json();
    
    // Validierung
    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        error: 'Aktuelles und neues Passwort sind erforderlich'
      }, { status: 400 });
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json({
        error: 'Das neue Passwort muss mindestens 8 Zeichen lang sein'
      }, { status: 400 });
    }
    
    // Benutzer finden
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }
    
    // Aktuelles Passwort überprüfen
    if (!user.password) {
      return NextResponse.json({ error: 'Kein Passwort gesetzt' }, { status: 400 });
    }
    
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 401 });
    }
    
    // Neues Passwort hashen und speichern
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    await user.save();
    
    return NextResponse.json({
      message: 'Passwort erfolgreich geändert'
    });
  } catch (error) {
    console.error('Fehler beim Ändern des Passworts:', error);
    return NextResponse.json({ error: 'Fehler beim Ändern des Passworts' }, { status: 500 });
  }
}
