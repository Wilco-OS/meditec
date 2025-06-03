import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';

// GET /api/invitation/verify?token=TOKEN - Einladung überprüfen
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Token ist erforderlich' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // Benutzer mit diesem Token finden
    const user = await User.findOne({
      invitationToken: token,
      invitationTokenExpiry: { $gt: new Date() }, // Token muss noch gültig sein
      isInvitationAccepted: false // Einladung darf noch nicht angenommen sein
    });
    
    if (!user) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Der Einladungslink ist ungültig oder abgelaufen' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      valid: true,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Fehler beim Überprüfen der Einladung:', error);
    return NextResponse.json({ 
      valid: false, 
      message: 'Ein interner Fehler ist aufgetreten' 
    }, { status: 500 });
  }
}
