import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/company/employees - Mitarbeiter des aktuellen Unternehmens abrufen
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Unternehmensadmins dürfen Mitarbeiter sehen
    if (session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Abrufen der Mitarbeiter' }, { status: 403 });
    }

    // Sicherstellen, dass eine Unternehmens-ID vorhanden ist
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Kein Unternehmen zugewiesen' }, { status: 400 });
    }

    await dbConnect();

    // Mitarbeiter für dieses Unternehmen abrufen
    const employees = await User.find({
      companyId: session.user.companyId
    }).select('-password -resetToken -resetTokenExpiry -verificationToken').sort({ name: 1 }).lean();

    // Format für die Frontend-Anzeige anpassen
    const formattedEmployees = employees.map(emp => ({
      id: (emp._id as unknown as mongoose.Types.ObjectId).toString(),
      name: emp.name,
      email: emp.email,
      role: emp.role,
      active: emp.active,
      department: emp.department,
      createdAt: emp.createdAt,
      emailVerified: emp.emailVerified
    }));

    return NextResponse.json({ 
      employees: formattedEmployees
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Mitarbeiter:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Mitarbeiter' }, { status: 500 });
  }
}
