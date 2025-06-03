// src/app/api/company/departments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Definition der Abteilungs-Schnittstelle
interface Department {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
}

// PATCH /api/company/departments/[id] – Abteilung aktualisieren
export async function PATCH(req: NextRequest, context: unknown) {
  try {
    // context als unknown casten, um params.id zu extrahieren
    const { params } = context as { params: { id: string } };
    const id = params.id;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Unternehmensadmins dürfen Abteilungen aktualisieren
    if (session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Ändern von Abteilungen' }, { status: 403 });
    }

    // Sicherstellen, dass eine Unternehmens-ID vorhanden ist
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Kein Unternehmen zugewiesen' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Abteilungs-ID' }, { status: 400 });
    }

    await dbConnect();

    // Das Unternehmen abrufen
    const company = await Company.findById(session.user.companyId);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // Abteilung im Unternehmen finden
    const departmentIndex = company.departments.findIndex(
      (dept: Department) => dept._id.toString() === id
    );
    if (departmentIndex === -1) {
      return NextResponse.json({ error: 'Abteilung nicht gefunden' }, { status: 404 });
    }

    // Daten aus dem Request extrahieren
    const data = await req.json();
    const { name, description } = data;

    // Validierung
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json({ error: 'Name darf nicht leer sein' }, { status: 400 });
    }

    // Prüfen, ob eine andere Abteilung bereits diesen Namen verwendet
    if (name) {
      const duplicateName = company.departments.some(
        (dept: Department, index: number) =>
          index !== departmentIndex && dept.name.toLowerCase() === name.toLowerCase()
      );
      if (duplicateName) {
        return NextResponse.json(
          { error: 'Eine andere Abteilung mit diesem Namen existiert bereits' },
          { status: 400 }
        );
      }
    }

    // Abteilung aktualisieren
    if (name) {
      company.departments[departmentIndex].name = name;
    }
    if (description !== undefined) {
      company.departments[departmentIndex].description = description;
    }

    await company.save();

    return NextResponse.json({
      message: 'Abteilung erfolgreich aktualisiert',
      department: {
        id: company.departments[departmentIndex]._id.toString(),
        name: company.departments[departmentIndex].name,
        description: company.departments[departmentIndex].description,
      },
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Abteilung:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Abteilung' }, { status: 500 });
  }
}

// DELETE /api/company/departments/[id] – Abteilung löschen
export async function DELETE(req: NextRequest, context: unknown) {
  try {
    // context als unknown casten, um params.id zu extrahieren
    const { params } = context as { params: { id: string } };
    const id = params.id;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Nur Unternehmensadmins dürfen Abteilungen löschen
    if (session.user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Löschen von Abteilungen' }, { status: 403 });
    }

    // Sicherstellen, dass eine Unternehmens-ID vorhanden ist
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Kein Unternehmen zugewiesen' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Abteilungs-ID' }, { status: 400 });
    }

    await dbConnect();

    // Das Unternehmen abrufen
    const company = await Company.findById(session.user.companyId);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // Abteilung im Unternehmen finden
    const departmentIndex = company.departments.findIndex(
      (dept: Department) => dept._id.toString() === id
    );
    if (departmentIndex === -1) {
      return NextResponse.json({ error: 'Abteilung nicht gefunden' }, { status: 404 });
    }

    // Prüfen, ob es Benutzer in dieser Abteilung gibt
    const usersInDepartment = await User.findOne({
      companyId: session.user.companyId,
      department: id,
    }).lean();
    if (usersInDepartment) {
      return NextResponse.json(
        { error: 'Diese Abteilung kann nicht gelöscht werden, da ihr noch Mitarbeiter zugewiesen sind' },
        { status: 400 }
      );
    }

    // Abteilung aus dem Array entfernen
    company.departments.splice(departmentIndex, 1);
    await company.save();

    return NextResponse.json({ message: 'Abteilung erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Abteilung:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Abteilung' }, { status: 500 });
  }
}