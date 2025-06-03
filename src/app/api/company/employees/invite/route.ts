import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import { CompanyInvitation } from '@/models/CompanyInvitation';
import dbConnect from '@/lib/dbConnect';
import { sendEmployeeInvitation } from '@/lib/email';
import crypto from 'crypto';
import mongoose from 'mongoose';

// POST /api/company/employees/invite - Neuen Mitarbeiter einladen
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Unternehmensadmins dürfen Mitarbeiter einladen
    if (session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Einladen von Mitarbeitern' }, { status: 403 });
    }

    // Sicherstellen, dass eine Unternehmens-ID vorhanden ist
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Kein Unternehmen zugewiesen' }, { status: 400 });
    }

    await dbConnect();

    // Prüfen, ob das Unternehmen existiert
    const company = await Company.findById(session.user.companyId);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // Daten aus dem Request extrahieren
    const data = await req.json();
    const { name, email, role = 'employee', departmentId } = data;

    // Validierung
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
    }

    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Gültige E-Mail-Adresse ist erforderlich' }, { status: 400 });
    }

    // Prüfen, ob bereits ein Benutzer mit dieser E-Mail-Adresse existiert
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Ein Benutzer mit dieser E-Mail existiert bereits' }, { status: 400 });
    }

    // Prüfen, ob bereits eine Einladung für diese E-Mail existiert
    const existingInvitation = await CompanyInvitation.findOne({
      email: email.toLowerCase(),
      company: session.user.companyId,
      usedAt: { $exists: false }  // Nur offene Einladungen prüfen
    });

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'Es gibt bereits eine aktive Einladung für diese E-Mail-Adresse' 
      }, { status: 400 });
    }

    // Prüfen, ob eine Department-ID angegeben wurde und ob sie gültig ist
    // Der Wert "none" ist ein Sonderfall und bedeutet keine Abteilung
    if (departmentId && departmentId !== 'none') {
      // Nur prüfen, wenn eine echte Department-ID angegeben wurde
      const departmentExists = company.departments.some(
        (dept: { _id: mongoose.Types.ObjectId }) => dept._id.toString() === departmentId
      );
      
      if (!departmentExists) {
        return NextResponse.json({ error: 'Abteilung nicht gefunden' }, { status: 400 });
      }
    }

    // Einladungscode generieren
    const invitationCode = crypto.randomBytes(32).toString('hex');
    
    // Ablaufdatum setzen (7 Tage)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Neue Einladung erstellen
    const invitation = new CompanyInvitation({
      company: session.user.companyId,
      email: email.toLowerCase(),
      invitationCode,
      createdAt: new Date(),
      expiresAt,
      role,
      department: (departmentId && departmentId !== 'none') ? departmentId : null,
      name,
      companyName: company.name // Das fehlende Pflichtfeld hinzufügen
    });

    await invitation.save();

    // E-Mail-Einladung senden
    await sendEmployeeInvitation({
      email,
      invitationCode,
      name,
      companyName: company.name,
      senderName: session.user.name || 'Der Administrator'
    });

    return NextResponse.json({ 
      message: 'Einladung erfolgreich versendet',
      invitation: {
        id: invitation._id.toString(),
        email,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Fehler beim Einladen eines Mitarbeiters:', error);
    return NextResponse.json({ error: 'Fehler beim Einladen des Mitarbeiters' }, { status: 500 });
  }
}
