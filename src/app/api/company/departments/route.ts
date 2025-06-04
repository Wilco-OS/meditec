import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Company } from '@/models/Company';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/company/departments - Abteilungen des aktuellen Unternehmens abrufen
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Unternehmensnutzer dürfen Abteilungen sehen
    if (!['company_admin', 'employee'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Abrufen der Abteilungen' }, { status: 403 });
    }

    // Sicherstellen, dass eine Unternehmens-ID vorhanden ist
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Kein Unternehmen zugewiesen' }, { status: 400 });
    }

    await dbConnect();

    // Das Unternehmen mit seinen Abteilungen abrufen
    const company = await Company.findById(session.user.companyId).select('departments').lean();

    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // Abteilungen formatieren
    // TypeScript-Korrektur: Explizites Casting für das lean()-Ergebnis
    const companyData = company as { departments?: Array<{ _id: mongoose.Types.ObjectId, name: string, description?: string }> };
    const departments = (companyData.departments || []).map(dept => ({
      id: dept._id.toString(),
      name: dept.name,
      description: dept.description
    }));

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Fehler beim Abrufen der Abteilungen:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Abteilungen' }, { status: 500 });
  }
}

// POST /api/company/departments - Neue Abteilung erstellen
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Unternehmensadmins dürfen Abteilungen erstellen
    if (session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Erstellen von Abteilungen' }, { status: 403 });
    }

    // Sicherstellen, dass eine Unternehmens-ID vorhanden ist
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Kein Unternehmen zugewiesen' }, { status: 400 });
    }

    await dbConnect();

    // Daten aus dem Request extrahieren
    const data = await req.json();
    const { name, description = '' } = data;

    // Validierung
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
    }

    // Das Unternehmen abrufen
    const company = await Company.findById(session.user.companyId);

    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // TypeScript-Interface für die Abteilungsstruktur
    interface Department {
      _id: mongoose.Types.ObjectId;
      name: string;
      description?: string;
    }

    // Prüfen, ob eine Abteilung mit diesem Namen bereits existiert
    const departmentExists = company.departments.some(
      (dept: Department) => dept.name.toLowerCase() === name.toLowerCase()
    );

    if (departmentExists) {
      return NextResponse.json({ 
        error: 'Eine Abteilung mit diesem Namen existiert bereits' 
      }, { status: 400 });
    }

    // Neue Abteilung zum Unternehmen hinzufügen
    const newDepartmentId = new mongoose.Types.ObjectId();
    
    company.departments.push({
      _id: newDepartmentId,
      name,
      description
    });

    await company.save();

    return NextResponse.json({ 
      message: 'Abteilung erfolgreich erstellt',
      department: {
        id: newDepartmentId.toString(),
        name,
        description
      }
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Abteilung:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen der Abteilung' }, { status: 500 });
  }
}
