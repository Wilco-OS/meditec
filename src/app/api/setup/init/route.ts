import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/mongoose';
import { User } from '@/models/User';

/**
 * POST /api/setup/init
 * Erstellt den ersten Admin-Benutzer, wenn noch keiner existiert
 */
export async function POST(req: Request) {
  try {
    // Verbindung zur Datenbank herstellen
    await connectToDatabase();
    
    // Prüfen, ob bereits Admin-Benutzer existieren
    const adminCount = await User.countDocuments({ role: 'meditec_admin' });
    
    // Wenn bereits Admin-Benutzer existieren, Anfrage ablehnen
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Ersteinrichtung wurde bereits abgeschlossen. Es existieren bereits Admin-Benutzer.' },
        { status: 403 }
      );
    }
    
    // Daten aus der Anfrage extrahieren
    const data = await req.json();
    const { name, email, password } = data;
    
    // Validierung der Eingaben
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Prüfen, ob es sich um eine Meditec-E-Mail handelt
    if (!email.toLowerCase().endsWith('@meditec-online.com')) {
      return NextResponse.json(
        { error: 'Nur E-Mail-Adressen mit der Domain @meditec-online.com sind für die Ersteinrichtung zugelassen' },
        { status: 400 }
      );
    }
    
    // Prüfen, ob die E-Mail bereits verwendet wird
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse wird bereits verwendet' },
        { status: 400 }
      );
    }
    
    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Admin-Benutzer erstellen
    const newAdmin = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'meditec_admin',
      active: true,
      emailVerified: new Date(),
    });
    
    await newAdmin.save();
    
    // Erfolg melden (ohne Passwort)
    return NextResponse.json({
      success: true,
      message: 'Ersteinrichtung erfolgreich abgeschlossen',
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
    
  } catch (error) {
    console.error('Fehler bei der Ersteinrichtung:', error);
    return NextResponse.json(
      { error: 'Bei der Ersteinrichtung ist ein Fehler aufgetreten' },
      { status: 500 }
    );
  }
}
