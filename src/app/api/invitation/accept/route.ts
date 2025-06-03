import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import bcrypt from 'bcrypt';

// POST /api/invitation/accept - Einladung annehmen und Passwort setzen
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    
    if (!token || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token und Passwort sind erforderlich' 
      }, { status: 400 });
    }
    
    // Passwort-Validierung
    if (password.length < 8) {
      return NextResponse.json({ 
        success: false, 
        error: 'Das Passwort muss mindestens 8 Zeichen lang sein' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // Benutzer mit diesem Token finden
    const user = await User.findOne({
      invitationToken: token,
      invitationTokenExpiry: { $gt: new Date() }, // Token muss noch gültig sein
      isInvitationAccepted: false // Einladung darf noch nicht angenommen sein
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Der Einladungslink ist ungültig oder abgelaufen' 
      }, { status: 404 });
    }
    
    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Benutzer aktualisieren
    user.password = hashedPassword;
    user.isInvitationAccepted = true;
    user.emailVerified = new Date();
    user.active = true;
    
    // Token zurücksetzen (Einmal-Verwendung)
    user.invitationToken = undefined;
    user.invitationTokenExpiry = undefined;
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Passwort wurde erfolgreich festgelegt'
    });
  } catch (error) {
    console.error('Fehler beim Annehmen der Einladung:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Ein interner Fehler ist aufgetreten' 
    }, { status: 500 });
  }
}
