import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// PATCH /api/company/employees/[id] - Mitarbeiterstatus ändern
export async function PATCH(
  req: NextRequest,
  context: unknown
) {
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Unternehmensadmins dürfen Mitarbeiter aktualisieren
    if (session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Ändern von Mitarbeiterdaten' }, { status: 403 });
    }

    // Sicherstellen, dass eine Unternehmens-ID vorhanden ist
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Kein Unternehmen zugewiesen' }, { status: 400 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Mitarbeiter-ID' }, { status: 400 });
    }

    await dbConnect();

    // Prüfen, ob der Mitarbeiter zum Unternehmen des Admins gehört
    const employee = await User.findOne({
      _id: id,
      companyId: session.user.companyId
    });

    if (!employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }

    // Daten aus dem Request extrahieren
    const data = await req.json();
    
    // Änderungen am Mitarbeiter vornehmen
    // Nur bestimmte Felder dürfen aktualisiert werden
    if (data.active !== undefined) {
      employee.active = data.active;
    }
    
    if (data.department !== undefined) {
      employee.department = data.department;
    }
    
    // Admins sollten ihren eigenen Account nicht deaktivieren können
    if (employee._id.toString() === session.user.id && data.active === false) {
      return NextResponse.json({
        error: 'Sie können Ihren eigenen Account nicht deaktivieren'
      }, { status: 400 });
    }

    await employee.save();
    
    return NextResponse.json({ 
      message: 'Mitarbeiter erfolgreich aktualisiert',
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        role: employee.role,
        active: employee.active,
        department: employee.department
      }
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Mitarbeiters:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Mitarbeiters' }, { status: 500 });
  }
}
