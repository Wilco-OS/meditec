import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { User } from '@/models/User';

/**
 * GET /api/setup/check
 * Überprüft, ob bereits Admin-Benutzer im System existieren
 */
export async function GET() {
  try {
    await connectToDatabase();
    
    // Zähle die Admin-Benutzer
    const adminCount = await User.countDocuments({ 
      role: 'meditec_admin',
      active: true
    });
    
    // Gibt true zurück, wenn bereits Admin-Benutzer existieren
    return NextResponse.json({ 
      hasAdmins: adminCount > 0,
      adminCount
    });
  } catch (error) {
    console.error('Fehler beim Überprüfen der Admin-Benutzer:', error);
    return NextResponse.json(
      { error: 'Fehler beim Überprüfen der Admin-Benutzer' },
      { status: 500 }
    );
  }
}
