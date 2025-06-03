import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongoose';
import mongoose from 'mongoose';
import { CompanyInvitation } from '@/models/CompanyInvitation';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import crypto from 'crypto';

// GET /api/companies/[id]/admins - Administratoren eines Unternehmens abrufen
export async function GET(
  req: NextRequest,
  context: unknown
) {
  // Context in das erwartete Format umwandeln
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    await connectToDatabase();

    // Nur Meditec-Admins oder zugehörige Unternehmens-Admins haben Zugriff
    if (session.user.role !== 'meditec_admin' && 
        (session.user.role !== 'company_admin' || session.user.companyId !== id)) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Abrufen der Administratoren' }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
    }

    // Überprüfen, ob das Unternehmen existiert
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // Alle Benutzer mit der Rolle "company_admin" und der entsprechenden Unternehmens-ID finden
    const admins = await User.find({
      companyId: id,
      role: 'company_admin'
    }).select('name email _id');

    // Offene Einladungen für Administratoren
    const pendingInvitations = await CompanyInvitation.find({
      company: id,
      role: 'company_admin',
      usedAt: { $exists: false }
    }).select('name email _id createdAt');

    // Kombination aus bestehenden Admins und ausstehenden Einladungen
    const allAdmins = [
      ...admins.map(admin => ({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isPending: false
      })),
      ...pendingInvitations.map(invitation => ({
        _id: invitation._id,
        name: invitation.name,
        email: invitation.email,
        isPending: true,
        invitedAt: invitation.createdAt
      }))
    ];

    return NextResponse.json({ admins: allAdmins });
  } catch (error) {
    console.error('Fehler beim Abrufen der Administratoren:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Administratoren' }, { status: 500 });
  }
}

// POST /api/companies/[id]/admins - Administrator zum Unternehmen hinzufügen
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Meditec-Admins dürfen Administratoren hinzufügen
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Hinzufügen von Administratoren' }, { status: 403 });
    }

    await connectToDatabase();
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
    }

    // Überprüfen, ob das Unternehmen existiert
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    const data = await req.json();
    const { name, email, isPrimaryAdmin } = data;

    // Validierung der Eingabedaten
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'E-Mail-Adresse ist erforderlich' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Ungültiges E-Mail-Format' }, { status: 400 });
    }

    // Überprüfen, ob bereits ein Benutzer mit dieser E-Mail existiert
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Wenn der Benutzer bereits Administrator ist, Fehler zurückgeben
      if (existingUser.role === 'company_admin' && existingUser.companyId?.toString() === id) {
        return NextResponse.json({ 
          error: 'Ein Administrator mit dieser E-Mail-Adresse existiert bereits' 
        }, { status: 409 });
      }
    }

    // Überprüfen, ob bereits eine offene Einladung für diese E-Mail existiert
    const existingInvitation = await CompanyInvitation.findOne({
      email: email.toLowerCase(),
      company: id,
      role: 'company_admin',
      usedAt: { $exists: false }
    });

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'Eine Einladung für diese E-Mail-Adresse wurde bereits gesendet' 
      }, { status: 409 });
    }

    // Einladungscode generieren
    const invitationCode = crypto.randomBytes(20).toString('hex');

    // Gültigkeitsdauer: 7 Tage
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Einladung erstellen
    const invitation = await CompanyInvitation.create({
      company: id,
      companyName: company.name,
      name,
      email: email.toLowerCase(),
      role: 'company_admin',
      invitationCode,
      createdBy: session.user.id,
      createdAt: new Date(),
      expiresAt
    });

    // Hier könnte ein E-Mail-Versand implementiert werden
    // sendAdminInvitationEmail(invitation);

    return NextResponse.json({
      message: 'Administrator-Einladung wurde erfolgreich erstellt',
      admin: {
        _id: invitation._id,
        name: invitation.name,
        email: invitation.email,
        isPending: true,
        invitedAt: invitation.createdAt
      }
    });
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Administrators:', error);
    return NextResponse.json({ error: 'Fehler beim Hinzufügen des Administrators' }, { status: 500 });
  }
}
