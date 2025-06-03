// src/app/api/companies/[id]/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/companies/[id]/users – Liste aller Benutzer eines Unternehmens abrufen
export async function GET(req: NextRequest, context: unknown) {
  try {
    // Context als unknown casten, um params.id zu extrahieren
    const { params } = context as { params: { id: string } };
    const id = params.id;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
    }

    await dbConnect();
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // Optional: Berechtigungscheck, z.B. nur Admins dürfen Liste sehen
    const isMeditecAdmin = session.user.role === 'meditec_admin';
    const isCompanyAdmin =
      session.user.role === 'company_admin' &&
      session.user.companyId?.toString() === id;
    if (!isMeditecAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Abrufen der Benutzerliste' },
        { status: 403 }
      );
    }

    // Benutzer mit companyId abrufen
    const users = await User.find({ companyId: id })
      .select('_id name email role active createdAt')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Benutzer' },
      { status: 500 }
    );
  }
}