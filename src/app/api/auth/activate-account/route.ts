import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import { CompanyInvitation } from '@/models/CompanyInvitation';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// POST /api/auth/activate-account - Aktiviert ein Benutzerkonto mit einem Einladungscode
export async function POST(req: NextRequest) {
  try {
    // Request-Body protokollieren (ohne Passwort)
    const body = await req.json();
    console.log('Aktivierungsversuch mit:', {
      email: body.email,
      code: body.code,
      hasPassword: !!body.password
    });
    
    const { email, code, password } = body;
    
    if (!email || !code || !password) {
      console.log('Fehlende Pflichtfelder:', { 
        hasEmail: !!email, 
        hasCode: !!code, 
        hasPassword: !!password 
      });
      return NextResponse.json({ 
        error: 'E-Mail, Einladungscode und Passwort sind erforderlich' 
      }, { status: 400 });
    }
    
    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Das Passwort muss mindestens 8 Zeichen lang sein' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // 1. Zuerst alle Benutzer mit dieser E-Mail finden
    const allUsers = await User.find({ email: email.toLowerCase() });
    console.log(`${allUsers.length} Benutzer mit E-Mail ${email} gefunden`);
    
    if (allUsers.length > 0) {
      allUsers.forEach((u, i) => {
        console.log(`Benutzer ${i + 1}:`, {
          id: u._id.toString(),
          name: u.name,
          active: u.active,
          hasToken: !!u.verificationToken,
          tokenMatch: u.verificationToken === code,
          isVerified: !!u.emailVerified
        });
      });
    }
    
    // 2. Benutzer mit E-Mail und Token finden (ohne die emailVerified-Einschränkung)
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      verificationToken: code
    });
    
    if (!user) {
      console.log('Kein Benutzer mit passender E-Mail und Verifikationstoken gefunden');
      // Versuche alternativ nur nach E-Mail zu suchen
      const userByEmail = await User.findOne({ email: email.toLowerCase() });
      if (userByEmail) {
        console.log('Benutzer nur per E-Mail gefunden:', {
          id: userByEmail._id.toString(),
          token: userByEmail.verificationToken,
          tokenMatches: userByEmail.verificationToken === code
        });
      }
      
      return NextResponse.json({ 
        error: 'Ungültiger Einladungscode oder E-Mail' 
      }, { status: 400 });
    }
    
    // Zusätzlich: Prüfen, ob bereits verifiziert
    if (user.emailVerified) {
      console.log('Benutzer bereits verifiziert:', {
        id: user._id.toString(),
        name: user.name,
        verifiedAt: user.emailVerified
      });
      return NextResponse.json({
        error: 'Dieser Account wurde bereits aktiviert'
      }, { status: 400 });
    }
    
    // 3. Prüfen, ob eine Einladung existiert
    const invitation = await CompanyInvitation.findOne({
      email: email.toLowerCase(),
      invitationCode: code
    });
    
    console.log('Einladungsstatus:', {
      exists: !!invitation,
      isUsed: invitation ? !!invitation.usedAt : false
    });
    
    // Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Benutzer aktualisieren
    try {
      user.password = hashedPassword;
      user.emailVerified = new Date();
      user.verificationToken = undefined; // Token löschen
      user.active = true;
      
      const savedUser = await user.save();
      console.log('Benutzer erfolgreich aktualisiert:', {
        id: savedUser._id.toString(),
        name: savedUser.name,
        verified: !!savedUser.emailVerified,
        hasPassword: !!savedUser.password
      });
    } catch (saveError) {
      console.error('Fehler beim Speichern des Benutzers:', saveError);
      return NextResponse.json({
        error: 'Fehler beim Aktualisieren des Benutzerkontos'
      }, { status: 500 });
    }
    
    // Wenn eine Einladung gefunden wurde, markiere sie als verwendet
    if (invitation) {
      try {
        invitation.usedAt = new Date();
        invitation.registeredUserId = user._id;
        await invitation.save();
        console.log('Einladung als verwendet markiert');
      } catch (inviteError) {
        // Nicht kritisch, nur loggen
        console.error('Fehler beim Aktualisieren der Einladung:', inviteError);
      }
    }
    
    // Erfolgreiche Antwort
    return NextResponse.json({
      success: true,
      message: 'Konto erfolgreich aktiviert'
    });
    
  } catch (error) {
    console.error('Fehler bei der Kontoaktivierung:', error);
    return NextResponse.json({ 
      error: 'Bei der Aktivierung ist ein Fehler aufgetreten' 
    }, { status: 500 });
  }
}
