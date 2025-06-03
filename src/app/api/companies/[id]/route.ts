// src/app/api/companies/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/companies/[id] – Details eines einzelnen Unternehmens abrufen
export async function GET(req: NextRequest, context: unknown) {
  try {
    const { params } = context as { params: { id: string } };
    const id = params.id;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
    }

    await dbConnect();
    // Ohne .lean(), damit TS company._id kennt
    const companyDoc = await Company.findById(id);
    if (!companyDoc) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    const isMeditecAdmin = session.user.role === 'meditec_admin';
    const isCompanyAdmin =
      session.user.role === 'company_admin' &&
      session.user.companyId?.toString() === id;

    if (!isMeditecAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Abrufen dieses Unternehmens' },
        { status: 403 }
      );
    }

    // Zähle Mitarbeiter und Admins
    const employeeCount = await User.countDocuments({
      companyId: companyDoc._id,
      role: 'employee',
    });
    const adminCount = await User.countDocuments({
      companyId: companyDoc._id,
      role: 'company_admin',
    });

    // companyDoc in plain JS-Objekt umwandeln
    const company = companyDoc.toObject();

    return NextResponse.json({
      ...company,
      employeeCount,
      adminCount,
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Unternehmens:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Unternehmens' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] – Unternehmen aktualisieren
export async function PUT(req: NextRequest, context: unknown) {
  try {
    const { params } = context as { params: { id: string } };
    const id = params.id;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zur Bearbeitung von Unternehmen' },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
    }

    await dbConnect();
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    const data = await req.json();
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      active,
      departments,
    } = data;

    if (name && name !== company.name) {
      const existingCompany = await Company.findOne({ name, _id: { $ne: id } });
      if (existingCompany) {
        return NextResponse.json(
          { error: `Ein Unternehmen mit dem Namen "${name}" existiert bereits` },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (country) updateData.country = country;
    if (active !== undefined) updateData.active = active;
    if (departments !== undefined) updateData.departments = departments;
    updateData.updatedAt = new Date();
    updateData.updatedBy = session.user.id;

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Unternehmen erfolgreich aktualisiert',
      company: updatedCompany,
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Unternehmens:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Unternehmens' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] – Unternehmen löschen
export async function DELETE(req: NextRequest, context: unknown) {
  try {
    const { params } = context as { params: { id: string } };
    const id = params.id;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen von Unternehmen' },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
    }

    await dbConnect();
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    const userCount = await User.countDocuments({ companyId: id });
    if (userCount > 0) {
      return NextResponse.json(
        {
          error:
            'Unternehmen kann nicht gelöscht werden, da es noch Benutzer hat. ' +
            'Löschen Sie zuerst alle zugehörigen Benutzer.',
        },
        { status: 400 }
      );
    }

    await Company.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Unternehmen erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Unternehmens:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Unternehmens' },
      { status: 500 }
    );
  }
}