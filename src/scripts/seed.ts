/**
 * Seed-Skript zum Erstellen von Testdaten für das Meditec-Pulse-Survey-Projekt
 * 
 * Führe dieses Skript aus, um die Datenbank mit Testdaten zu füllen:
 * npx ts-node src/scripts/seed.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/mongoose';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import { Survey, SurveyStatus, QuestionType } from '@/models/Survey';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://meditec:J0Sn3LOWgxzEnBKY@meditec-main.lmilk3l.mongodb.net/meditec-pulse-survey?retryWrites=true&w=majority';

// Zum Einfügen der demo-Benutzer aus der bestehenden Implementierung
const DEMO_USERS = [
  {
    email: 'admin@meditec-online.com',
    name: 'Admin',
    password: 'password123',
    role: 'meditec_admin',
  },
  {
    email: 'companyadmin@example.com',
    name: 'Unternehmensadmin',
    password: 'password123',
    role: 'company_admin',
  },
  {
    email: 'employee@example.com',
    name: 'Mitarbeiter',
    password: 'password123',
    role: 'employee',
  }
];

async function seed() {
  try {
    // Verbindung zur Datenbank herstellen
    await mongoose.connect(MONGODB_URI);
    console.log('Verbunden mit MongoDB');

    // Bestehende Daten löschen
    console.log('Lösche bestehende Daten...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Survey.deleteMany({});

    // Beispielunternehmen erstellen
    console.log('Erstelle Beispielunternehmen...');
    const company1 = new Company({
      name: 'Beispiel GmbH',
      contactPerson: 'Max Mustermann',
      email: 'kontakt@beispiel.de',
      phone: '030-123456789',
      address: 'Musterstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland',
      active: true,
    });

    const company2 = new Company({
      name: 'Test AG',
      contactPerson: 'Maria Musterfrau',
      email: 'kontakt@test-ag.de',
      phone: '089-987654321',
      address: 'Testweg 45',
      city: 'München',
      postalCode: '80331',
      country: 'Deutschland',
      active: true,
    });

    await company1.save();
    await company2.save();

    console.log('Beispielunternehmen erstellt');

    // Benutzer erstellen
    console.log('Erstelle Benutzer...');
    
    // Admin-Benutzer (ohne Unternehmen)
    const adminUser = new User({
      email: DEMO_USERS[0].email,
      name: DEMO_USERS[0].name,
      password: await bcrypt.hash(DEMO_USERS[0].password, 10),
      role: DEMO_USERS[0].role,
      active: true,
      emailVerified: new Date(),
    });

    // Unternehmensadmin-Benutzer
    const companyAdminUser = new User({
      email: DEMO_USERS[1].email,
      name: DEMO_USERS[1].name,
      password: await bcrypt.hash(DEMO_USERS[1].password, 10),
      role: DEMO_USERS[1].role,
      companyId: company1._id,
      active: true,
      emailVerified: new Date(),
    });

    // Mitarbeiter-Benutzer
    const employeeUser = new User({
      email: DEMO_USERS[2].email,
      name: DEMO_USERS[2].name,
      password: await bcrypt.hash(DEMO_USERS[2].password, 10),
      role: DEMO_USERS[2].role,
      companyId: company1._id,
      active: true,
      emailVerified: new Date(),
    });

    // Weitere Mitarbeiter für Beispiel GmbH
    const employees = [
      {
        email: 'mitarbeiter1@beispiel.de',
        name: 'Anna Schmidt',
        password: await bcrypt.hash('password123', 10),
        role: 'employee',
        companyId: company1._id,
        active: true,
        emailVerified: new Date(),
      },
      {
        email: 'mitarbeiter2@beispiel.de',
        name: 'Thomas Müller',
        password: await bcrypt.hash('password123', 10),
        role: 'employee',
        companyId: company1._id,
        active: true,
        emailVerified: new Date(),
      }
    ];

    await adminUser.save();
    await companyAdminUser.save();
    await employeeUser.save();
    await User.insertMany(employees);

    console.log('Benutzer erstellt');

    // Beispiel-Umfragen erstellen
    console.log('Erstelle Beispiel-Umfragen...');

    // Umfrage 1: Mitarbeiterzufriedenheit
    const survey1 = new Survey({
      title: 'Mitarbeiterzufriedenheit Q2/2025',
      description: 'Umfrage zur Ermittlung der Mitarbeiterzufriedenheit im zweiten Quartal 2025',
      status: SurveyStatus.ACTIVE,
      createdBy: adminUser._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage in der Zukunft
      isAnonymous: true,
      blocks: [
        {
          id: 'block1',
          title: 'Allgemeine Zufriedenheit',
          description: 'Bitte bewerten Sie Ihre allgemeine Zufriedenheit am Arbeitsplatz',
          order: 1
        },
        {
          id: 'block2',
          title: 'Arbeitsumgebung',
          description: 'Fragen zur Arbeitsumgebung und Ausstattung',
          order: 2
        }
      ],
      questions: [
        {
          id: 'q1',
          text: 'Wie zufrieden sind Sie insgesamt mit Ihrer Arbeitssituation?',
          type: QuestionType.RATING,
          isRequired: true,
          blockId: 'block1'
        },
        {
          id: 'q2',
          text: 'Würden Sie Ihr Unternehmen als Arbeitgeber weiterempfehlen?',
          type: QuestionType.YES_NO,
          isRequired: true,
          blockId: 'block1'
        },
        {
          id: 'q3',
          text: 'Wie bewerten Sie Ihre Arbeitsausstattung?',
          type: QuestionType.RATING,
          isRequired: true,
          blockId: 'block2'
        },
        {
          id: 'q4',
          text: 'Haben Sie Verbesserungsvorschläge für Ihren Arbeitsplatz?',
          type: QuestionType.TEXT,
          isRequired: false,
          blockId: 'block2'
        }
      ],
      assignedCompanies: [company1._id, company2._id]
    });

    // Umfrage 2: Onboarding-Prozess 
    const survey2 = new Survey({
      title: 'Bewertung des Onboarding-Prozesses',
      description: 'Feedback zum Einarbeitungsprozess neuer Mitarbeiter',
      status: SurveyStatus.DRAFT,
      createdBy: adminUser._id,
      isAnonymous: false,
      blocks: [
        {
          id: 'block1',
          title: 'Onboarding-Prozess',
          description: 'Bewertung des Einarbeitungsprozesses',
          order: 1
        }
      ],
      questions: [
        {
          id: 'q1',
          text: 'Wie bewerten Sie die Einarbeitung in Ihre Aufgaben?',
          type: QuestionType.RATING,
          isRequired: true,
          blockId: 'block1'
        },
        {
          id: 'q2',
          text: 'Hatten Sie alle notwendigen Informationen, um Ihre Arbeit zu beginnen?',
          type: QuestionType.YES_NO,
          isRequired: true,
          blockId: 'block1'
        },
        {
          id: 'q3',
          text: 'Was hat besonders gut funktioniert während Ihres Onboardings?',
          type: QuestionType.TEXT,
          isRequired: false,
          blockId: 'block1'
        }
      ],
      assignedCompanies: [company1._id]
    });

    await survey1.save();
    await survey2.save();

    console.log('Beispiel-Umfragen erstellt');

    console.log('Seed-Prozess abgeschlossen! Sie können sich nun mit den folgenden Benutzern anmelden:');
    console.log('Meditec-Admin:');
    console.log('  E-Mail: admin@meditec-online.com');
    console.log('  Passwort: password123');
    console.log('Unternehmensadmin:');
    console.log('  E-Mail: companyadmin@example.com');
    console.log('  Passwort: password123');
    console.log('Mitarbeiter:');
    console.log('  E-Mail: employee@example.com');
    console.log('  Passwort: password123');

  } catch (error) {
    console.error('Fehler beim Seed-Prozess:', error);
  } finally {
    // Verbindung zur Datenbank trennen
    await mongoose.disconnect();
    console.log('Verbindung zur MongoDB getrennt');
  }
}

// Starte den Seed-Prozess
seed();
