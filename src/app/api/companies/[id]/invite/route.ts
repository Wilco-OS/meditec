// src/app/api/companies/[id]/invite/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/email';

// Funktion zum Generieren eines 6-stelligen Codes
function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/companies/[id]/invite – Benutzer zu einem Unternehmen einladen
export async function POST(req: NextRequest, context: unknown) {
  try {
    // Da Next.js hier intern noch zusätzliche Felder in context übergibt,
    // können wir context lokal auf das beschränken, was wir brauchen:
    const { params } = context as { params: { id: string } };

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const companyId = params.id;
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
    }

    const { email, name, role } = await req.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'E-Mail und Name sind erforderlich' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Ungültiges E-Mail-Format' }, { status: 400 });
    }

    await dbConnect();
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse wird bereits verwendet' },
        { status: 400 }
      );
    }

    // Einladungscode erstellen
    const inviteCode = generateInviteCode();
    const inviteExpires = new Date();
    inviteExpires.setDate(inviteExpires.getDate() + 7); // 7 Tage gültig

    const newUser = new User({
      email,
      name,
      role: role || 'employee',
      companyId,
      active: false, // Erst aktiv nach Annahme
      inviteCode,
      inviteExpires,
    });
    await newUser.save();

    // Einladung per E-Mail senden
    try {
      const inviteUrl = `${
        process.env.NEXTAUTH_URL || 'http://localhost:3000'
      }/auth/register?code=${inviteCode}`;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #003865;
              color: #fff;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 20px;
              background-color: #f9f9f9;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #003865;
              color: #fff;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              font-size: 12px;
              color: #666;
              margin-top: 30px;
            }
            .code {
              font-family: monospace;
              background-color: #eee;
              padding: 5px 10px;
              border-radius: 3px;
              font-size: 16px;
              letter-spacing: 2px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Einladung zu Meditec Pulse</h1>
            </div>
            <div class="content">
              <p>Hallo ${name},</p>
              <p>Sie wurden eingeladen, dem Unternehmen <strong>${company.name}</strong> beizutreten.</p>
              <p>Ihre Rolle: <strong>${role || 'Mitarbeiter'}</strong></p>
              <p>Um Ihre Einladung anzunehmen und Ihr Konto zu erstellen, klicken Sie bitte auf den folgenden Button:</p>
              <a href="${inviteUrl}" class="button">Einladung annehmen</a>
              <p>Oder besuchen Sie die folgende URL:</p>
              <p>${inviteUrl}</p>
              <p>Ihr Einladungscode: <span class="code">${inviteCode}</span></p>
              <p>Diese Einladung ist 7 Tage gültig. Bei Fragen wenden Sie sich bitte an Ihren Administrator.</p>
            </div>
            <div class="footer">
              <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht auf diese Nachricht.</p>
              <p>&copy; ${new Date().getFullYear()} Meditec Pulse. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      await sendEmail({
        to: email,
        subject: `Einladung zu Meditec Pulse von ${company.name}`,
        html: emailHtml,
      });
      console.log(`Einladungs-E-Mail gesendet an: ${email} mit Code: ${inviteCode}`);
    } catch (emailError) {
      console.error('Fehler beim Senden der Einladungs-E-Mail:', emailError);
    }

    return NextResponse.json({
      message: 'Benutzer erfolgreich eingeladen',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        active: newUser.active,
        createdAt: newUser.createdAt,
      },
      // Im Development-Modus den Invite-Code zur Prüfung zurückgeben
      ...(process.env.NODE_ENV === 'development' && { inviteCode }),
    });
  } catch (error: any) {
    console.error('Fehler beim Einladen des Benutzers:', error);
    return NextResponse.json(
      { error: 'Fehler beim Einladen des Benutzers' },
      { status: 500 }
    );
  }
}