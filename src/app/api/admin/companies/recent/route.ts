import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { Company } from '@/models/Company';

export async function GET(req: NextRequest) {
  try {
    // Authentifizierung und Autorisierung prüfen
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    if (session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung für diese Ressource' }, { status: 403 });
    }
    
    // Verbindung zur Datenbank herstellen
    await dbConnect();
    
    // Die neuesten 5 Unternehmen abrufen, sortiert nach Erstellungsdatum
    const recentCompanies = await Company.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Daten transformieren und zurückgeben
    const formattedCompanies = recentCompanies.map(company => ({
      id: company._id ? company._id.toString() : '',
      name: company.name,
      city: company.city || 'Keine Angabe',
      createdAt: company.createdAt,
      active: company.active || false,
      departmentsCount: company.departments?.length || 0
    }));
    
    return NextResponse.json({ companies: formattedCompanies });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der neuesten Unternehmen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der neuesten Unternehmen' },
      { status: 500 }
    );
  }
}
