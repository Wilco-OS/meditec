import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// GET /api/users - Liste aller Benutzer abrufen
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await dbConnect();

    // URL-Parameter für Filteroption extrahieren
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const companyId = searchParams.get('companyId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 20;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const skip = (page - 1) * limit;

    // Basis-Query
    const query: any = {};

    // Suche nach Name oder E-Mail
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Filter nach Rolle
    if (role) {
      query.role = role;
    }

    // Berechtigungen berücksichtigen
    if (session.user.role === 'meditec_admin') {
      // Meditec-Admins können alle Benutzer sehen oder nach Unternehmen filtern
      if (companyId) {
        query.companyId = companyId;
      }
    } else if (session.user.role === 'company_admin') {
      // Unternehmensadmins sehen nur Benutzer ihres eigenen Unternehmens
      query.companyId = session.user.companyId;
    } else {
      // Alle anderen Rollen haben keinen Zugriff auf Benutzerlisten
      return NextResponse.json({ error: 'Keine Berechtigung zum Abrufen von Benutzerinformationen' }, { status: 403 });
    }

    // Benutzer abrufen, sensible Informationen ausschließen
    const users = await User.find(query)
      .select('-password -verificationToken -resetToken -resetTokenExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Informationen zum Unternehmen für jeden Benutzer abrufen
    const usersWithCompanyInfo = await Promise.all(users.map(async (user) => {
      if (user.companyId) {
        const company = await Company.findById(user.companyId).select('name').lean();
        return {
          ...user,
          companyName: company ? company.name : null
        };
      }
      return user;
    }));

    // Gesamtanzahl für Pagination
    const total = await User.countDocuments(query);

    return NextResponse.json({
      users: usersWithCompanyInfo,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Benutzer' }, { status: 500 });
  }
}

// POST /api/users - Neuen Benutzer erstellen
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Berechtigungen prüfen - Nur Meditec-Admins und Company-Admins dürfen Benutzer erstellen
    const isMeditecAdmin = session.user.role === 'meditec_admin';
    const isCompanyAdmin = session.user.role === 'company_admin';
    
    if (!isMeditecAdmin && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Keine Berechtigung zur Erstellung von Benutzern' }, { status: 403 });
    }

    await dbConnect();

    const data = await req.json();
    const { name, email, password, role, companyId, active, sendInvitation } = data;

    // Pflichtfelder prüfen
    if (!name || !email) {
      return NextResponse.json({
        error: 'Fehlende Pflichtfelder (Name und E-Mail sind erforderlich)'
      }, { status: 400 });
    }
    
    // Wenn keine Einladung gesendet wird, muss ein Passwort angegeben werden
    if (!sendInvitation && !password) {
      return NextResponse.json({
        error: 'Passwort ist erforderlich, wenn keine Einladung gesendet wird'
      }, { status: 400 });
    }

    // E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Ungültige E-Mail-Adresse'
      }, { status: 400 });
    }

    // Berechtigungen für Rollenzuweisung prüfen
    if (isCompanyAdmin) {
      // Company-Admins können nur Mitarbeiter für ihr eigenes Unternehmen erstellen
      if (role !== 'employee' || companyId !== session.user.companyId) {
        return NextResponse.json({
          error: 'Sie können nur Mitarbeiter für Ihr eigenes Unternehmen erstellen'
        }, { status: 403 });
      }
    }

    // Bei Meditec-Admins prüfen, ob das Unternehmen existiert
    let validCompanyId = companyId;
    if (isMeditecAdmin && role !== 'meditec_admin' && companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return NextResponse.json({
          error: 'Ungültige Unternehmens-ID'
        }, { status: 400 });
      }

      const company = await Company.findById(companyId);
      if (!company) {
        return NextResponse.json({
          error: 'Das angegebene Unternehmen existiert nicht'
        }, { status: 404 });
      }
      
      validCompanyId = company._id;
    }

    // Prüfen, ob Benutzer mit dieser E-Mail bereits existiert
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        error: `Ein Benutzer mit der E-Mail "${email}" existiert bereits`
      }, { status: 409 });
    }

    // User-Objekt vorbereiten
    const userData: any = {
      name,
      email,
      role: isMeditecAdmin ? (role || 'employee') : 'employee',
      companyId: validCompanyId,
      active: active !== undefined ? active : true,
      createdBy: session.user.id,
      createdAt: new Date()
    };
    
    // Einladungs- oder direktes Passwort-Setup
    if (sendInvitation) {
      // Zufälliges Token für Einladung generieren
      const invitationToken = crypto.randomBytes(32).toString('hex');
      
      // Token ist 48 Stunden gültig
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 48);
      
      userData.invitationToken = invitationToken;
      userData.invitationTokenExpiry = tokenExpiry;
      userData.isInvitationAccepted = false;
      userData.emailVerified = false;
      
      // Hier könnte Logik für E-Mail-Versand implementiert werden
      // sendInvitationEmail(email, invitationToken);
    } else {
      // Wenn keine Einladung, direkt Passwort setzen
      const hashedPassword = await bcrypt.hash(password, 10);
      userData.password = hashedPassword;
      userData.emailVerified = true;
      userData.isInvitationAccepted = true;
    }
    
    // Neuen Benutzer erstellen
    const newUser = new User(userData);

    await newUser.save();

    // Sensible Daten entfernen
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;
    delete userResponse.verificationToken;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;

    return NextResponse.json({
      message: 'Benutzer erfolgreich erstellt',
      user: userResponse
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen des Benutzers' }, { status: 500 });
  }
}
