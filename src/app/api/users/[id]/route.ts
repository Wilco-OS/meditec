import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import { SurveyResponse } from '@/models/SurveyResponse';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// GET /api/users/[id] - Details eines einzelnen Benutzers abrufen
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

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Benutzer-ID' }, { status: 400 });
    }

    // Benutzer abrufen ohne sensible Daten
    const user = await User.findById(id)
      .select('-password -verificationToken -resetToken -resetTokenExpiry')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Berechtigungen prüfen
    const isSelf = session.user.id.toString() === id; // Eigenes Profil ansehen
    const isMeditecAdmin = session.user.role === 'meditec_admin';
    const isCompanyAdmin = session.user.role === 'company_admin' && 
                          user.companyId && 
                          session.user.companyId?.toString() === user.companyId.toString();
    
    if (!isSelf && !isMeditecAdmin && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Abrufen dieses Benutzers' }, { status: 403 });
    }

    // Unternehmensinformationen hinzufügen
    let company = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId).select('name city').lean();
    }

    // Zusätzliche Statistiken für Admins
    let statistics = null;
    if (isMeditecAdmin || isCompanyAdmin) {
      const surveyResponseCount = await SurveyResponse.countDocuments({ userId: id });
      statistics = {
        surveyResponseCount
      };
    }

    return NextResponse.json({
      ...user,
      company,
      companyName: company?.name,
      statistics
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen des Benutzers' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Benutzer aktualisieren
export async function PUT(
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

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Benutzer-ID' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Berechtigungen prüfen
    const isSelf = session.user.id.toString() === id; // Eigenes Profil bearbeiten
    const isMeditecAdmin = session.user.role === 'meditec_admin';
    const isCompanyAdmin = session.user.role === 'company_admin' && 
                          user.companyId && 
                          session.user.companyId?.toString() === user.companyId.toString();
    
    const data = await req.json();
    const { name, email, password, role, companyId, active } = data;

    // Bestimmte Änderungen sind nur für Administratoren erlaubt
    if (!isMeditecAdmin && !isCompanyAdmin && !isSelf) {
      return NextResponse.json({ error: 'Keine Berechtigung zur Bearbeitung dieses Benutzers' }, { status: 403 });
    }

    // Company-Admins können nur bestimmte Felder für ihre Mitarbeiter ändern
    if (isCompanyAdmin && !isSelf && user.role === 'company_admin') {
      return NextResponse.json({ error: 'Company-Admins können keine anderen Company-Admins bearbeiten' }, { status: 403 });
    }

    // Prüfen, ob E-Mail bereits existiert (aber nur wenn sie geändert wurde)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({
          error: `Ein Benutzer mit der E-Mail "${email}" existiert bereits`
        }, { status: 409 });
      }
    }

    // Rollenänderungen nur durch Meditec-Admins erlaubt
    if (role && role !== user.role && !isMeditecAdmin) {
      return NextResponse.json({
        error: 'Nur Meditec-Administratoren können Benutzerrollen ändern'
      }, { status: 403 });
    }

    // Ändern des zugewiesenen Unternehmens nur durch Meditec-Admins erlaubt
    if (companyId && (!user.companyId || companyId !== user.companyId.toString()) && !isMeditecAdmin) {
      return NextResponse.json({
        error: 'Nur Meditec-Administratoren können das Unternehmen eines Benutzers ändern'
      }, { status: 403 });
    }

    // Bei einem Unternehmenswechsel prüfen, ob das neue Unternehmen existiert
    let validCompanyId = user.companyId;
    if (isMeditecAdmin && companyId && companyId !== user.companyId?.toString()) {
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

    // Update-Objekt erstellen
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Passwort nur aktualisieren, wenn eines angegeben wurde
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Diese Felder können nur von Administratoren geändert werden
    if (isMeditecAdmin) {
      if (role) updateData.role = role;
      if (validCompanyId) updateData.companyId = validCompanyId;
      if (active !== undefined) updateData.active = active;
    } else if (isCompanyAdmin && !isSelf) {
      // Company-Admins können nur den Active-Status ihrer Mitarbeiter ändern
      if (active !== undefined) updateData.active = active;
    }
    
    updateData.updatedAt = new Date();
    updateData.updatedBy = session.user.id;

    // Benutzer aktualisieren
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -verificationToken -resetToken -resetTokenExpiry');

    return NextResponse.json({
      message: 'Benutzer erfolgreich aktualisiert',
      user: updatedUser
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzers:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Benutzers' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Benutzer löschen
export async function DELETE(
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

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Benutzer-ID' }, { status: 400 });
    }

    // Benutzer finden
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Berechtigungen prüfen
    const isMeditecAdmin = session.user.role === 'meditec_admin';
    const isCompanyAdmin = session.user.role === 'company_admin' && 
                         user.companyId && 
                         session.user.companyId?.toString() === user.companyId.toString() &&
                         user.role === 'employee'; // Company-Admins können nur Mitarbeiter löschen
    
    // Nur Admins dürfen löschen
    if (!isMeditecAdmin && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Löschen dieses Benutzers' }, { status: 403 });
    }

    // Selbstlöschung verhindern
    if (session.user.id.toString() === id) {
      return NextResponse.json({ error: 'Sie können Ihren eigenen Account nicht löschen' }, { status: 400 });
    }

    // Prüfen, ob es sich um den letzten Admin eines Unternehmens handelt
    if (user.role === 'company_admin' && user.companyId) {
      // Anzahl der Admins in diesem Unternehmen zählen
      const adminCount = await User.countDocuments({
        _id: { $ne: user._id }, // Nicht den aktuellen Benutzer mitzählen
        role: 'company_admin',
        companyId: user.companyId
      });
      
      if (adminCount === 0) {
        return NextResponse.json({
          error: 'Dieser Admin kann nicht gelöscht werden, da er der letzte Admin des Unternehmens ist'
        }, { status: 400 });
      }
    }

    // Prüfen, ob der letzte Meditec-Admin gelöscht werden soll
    if (user.role === 'meditec_admin') {
      const meditecAdminCount = await User.countDocuments({
        _id: { $ne: user._id },
        role: 'meditec_admin'
      });

      if (meditecAdminCount === 0) {
        return NextResponse.json({
          error: 'Der letzte Meditec-Administrator kann nicht gelöscht werden'
        }, { status: 400 });
      }
    }

    // Benutzer löschen
    await User.findByIdAndDelete(id);

    // Umfrageantworten anonymisieren
    await SurveyResponse.updateMany(
      { userId: user._id },
      { $set: { userId: null, anonymized: true } }
    );

    return NextResponse.json({
      message: 'Benutzer erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen des Benutzers' }, { status: 500 });
  }
}