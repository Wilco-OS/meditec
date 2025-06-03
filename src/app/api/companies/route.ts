import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import { CompanyInvitation } from '@/models/CompanyInvitation';
import dbConnect from '@/lib/dbConnect';
import { sendEmail, generateCompanyAdminInviteEmail } from '@/lib/email';
import mongoose from 'mongoose';
import crypto from 'crypto';

// GET /api/companies - Liste aller Unternehmen abrufen
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Meditec-Admins dürfen alle Unternehmen sehen
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Abrufen aller Unternehmen' }, { status: 403 });
    }

    await dbConnect();

    // URL-Parameter für Filteroption extrahieren
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get('search') || '';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const skip = (page - 1) * limit;

    // Such-Query erstellen
    const query: any = {};
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { city: { $regex: searchQuery, $options: 'i' } },
        { contactPerson: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Unternehmen abrufen
    const companies = await Company.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Zusätzliche Informationen für jedes Unternehmen abrufen (z.B. Anzahl Mitarbeiter)
    const companiesWithInfo = await Promise.all(companies.map(async (company) => {
      const employeeCount = await User.countDocuments({ 
        companyId: company._id,
        role: 'employee'
      });

      const adminCount = await User.countDocuments({ 
        companyId: company._id,
        role: 'company_admin'
      });

      return {
        ...company,
        employeeCount,
        adminCount
      };
    }));

    // Gesamtanzahl für Pagination
    const total = await Company.countDocuments(query);

    return NextResponse.json({
      companies: companiesWithInfo,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Unternehmen:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Unternehmen' }, { status: 500 });
  }
}

// Funktion zum Generieren eines 6-stelligen Codes
function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/companies - Neues Unternehmen erstellen
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Meditec-Admins dürfen Unternehmen erstellen
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zur Erstellung von Unternehmen' }, { status: 403 });
    }

    await dbConnect();

    const data = await req.json();
    const { name, contactPerson, email, phone, address, city, postalCode, country, active, adminName, adminEmail, departments = [] } = data;

    // Pflichtfelder prüfen
    if (!name || !email || !city) {
      return NextResponse.json({
        error: 'Fehlende Pflichtfelder (Name, E-Mail und Stadt sind erforderlich)'
      }, { status: 400 });
    }

    // Prüfen, ob Unternehmen mit diesem Namen bereits existiert
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return NextResponse.json({
        error: `Ein Unternehmen mit dem Namen "${name}" existiert bereits`
      }, { status: 409 });
    }

    // Prüfen, ob Admin-E-Mail bereits verwendet wird
    if (adminEmail) {
      const existingUser = await User.findOne({ email: adminEmail });
      if (existingUser) {
        return NextResponse.json({
          error: `Die E-Mail-Adresse ${adminEmail} wird bereits verwendet`
        }, { status: 409 });
      }
    }

    // Neues Unternehmen erstellen
    const newCompany = new Company({
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      postalCode,
      country: country || 'Deutschland',
      departments: departments.length > 0 ? departments : [], // Default-Abteilungen hinzufügen, falls vorhanden
      active: active !== undefined ? active : true,
      createdBy: session.user.id,
      createdAt: new Date()
    });

    await newCompany.save();

    // Ansprechpartner als Hauptadmin anlegen und, falls angegeben, weitere Admins
    let invitedAdmins = [];
    
    // Funktion zum Erstellen eines Admins
    const createAdmin = async (adminName: string, adminEmail: string, isPrimaryAdmin: boolean) => {
      // Einladungscode generieren
      const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      const inviteExpires = new Date();
      inviteExpires.setDate(inviteExpires.getDate() + 7); // 7 Tage gültig
      
      // Temporäres Passwort generieren
      const tempPassword = crypto.randomBytes(4).toString('hex');
      
      // Neuen Benutzer erstellen
      const newUser = new User({
        email: adminEmail,
        name: adminName,
        role: 'company_admin',
        companyId: newCompany._id,
        // Wir setzen den Benutzer auf aktiv, damit er sich mit dem temporären Passwort anmelden kann
        active: true,
        password: tempPassword,
        verificationToken: inviteCode,
        emailVerified: null, // Wird gesetzt, sobald der Benutzer sein Passwort ändert
      });
      
      await newUser.save();
      
      // Einladungs-Datensatz erstellen
      const invitation = new CompanyInvitation({
        company: newCompany._id,
        email: adminEmail,
        companyName: name,
        name: adminName, // Name des eingeladenen Administrators
        role: 'company_admin',
        invitationCode: inviteCode,
        createdBy: session.user.id,
        expiresAt: inviteExpires
      });
      
      await invitation.save();
      
      const adminInfo = {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isPrimary: isPrimaryAdmin
      };
      
      // E-Mail mit Einladungslink und -code senden
      const activationUrl = `${process.env.NEXTAUTH_URL}/activate-account?code=${inviteCode}&email=${encodeURIComponent(adminEmail)}`;
      
      try {
        const emailHtml = generateCompanyAdminInviteEmail(
          adminName, 
          name, 
          activationUrl,
          inviteCode
        );
        
        await sendEmail({
          to: adminEmail,
          subject: `Willkommen bei Meditec Pulse - Ihre Einladung für ${name}`,
          html: emailHtml
        });
        
        console.log(`Einladungs-E-Mail gesendet an ${adminEmail} mit Code ${inviteCode}`);
      } catch (emailError) {
        console.error('Fehler beim Senden der Einladungs-E-Mail:', emailError);
        // Wir brechen nicht ab, wenn der E-Mail-Versand fehlschlägt
      }
      
      return adminInfo;
    };
    
    // 1. Den Ansprechpartner immer als Hauptadmin anlegen
    if (contactPerson && email) {
      try {
        // Prüfen, ob bereits ein Benutzer mit dieser E-Mail existiert
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return NextResponse.json({
            error: `Die E-Mail-Adresse ${email} wird bereits verwendet`
          }, { status: 409 });
        }
        
        const primaryAdmin = await createAdmin(contactPerson, email, true);
        invitedAdmins.push(primaryAdmin);
      } catch (error) {
        console.error('Fehler beim Erstellen des Hauptadmins:', error);
        // Fehler beim Erstellen des Hauptadmins ist kritisch, daher brechen wir ab
        return NextResponse.json({
          error: 'Fehler beim Erstellen des Hauptadministrators'
        }, { status: 500 });
      }
    }
    
    // 2. Optional einen weiteren Admin anlegen, wenn angegeben
    if (adminName && adminEmail && adminEmail !== email) {
      try {
        // Prüfen, ob bereits ein Benutzer mit dieser E-Mail existiert
        const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
        if (!existingUser) {
          const additionalAdmin = await createAdmin(adminName, adminEmail, false);
          invitedAdmins.push(additionalAdmin);
        } else {
          console.log(`Admin mit E-Mail ${adminEmail} existiert bereits und wird übersprungen`);
        }
      } catch (error) {  
        console.error('Fehler beim Erstellen des zusätzlichen Admins:', error);
        // Fehler beim Erstellen des zusätzlichen Admins ist nicht kritisch, wir machen weiter
      }
    }

    return NextResponse.json({
      message: 'Unternehmen erfolgreich erstellt',
      company: newCompany,
      invitedAdmins
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Unternehmens:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen des Unternehmens' }, { status: 500 });
  }
}
