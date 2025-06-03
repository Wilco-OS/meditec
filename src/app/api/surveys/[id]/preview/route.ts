import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Survey } from '@/models/Survey';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/surveys/[id]/preview - Vorschau einer Umfrage abrufen (mit weniger strengen Berechtigungen)
export async function GET(
  request: NextRequest,
  context: unknown
) {
  // Params extrahieren für Next.js App Router
  const { params } = context as { params: { id: string } };
  const id = params.id;
  
  console.log('GET-Anfrage für Umfrage-Vorschau erhalten, ID:', id);
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await dbConnect();

    // Umfrage finden
    let survey;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      survey = await Survey.findById(id);
    } else {
      survey = await Survey.findOne({ id: id });
    }
    
    if (!survey) {
      console.error(`Umfrage mit ID ${id} wurde nicht gefunden`);
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }
    
    // Sicherstellen, dass blocks-Array vorhanden ist
    if (!survey.blocks || !Array.isArray(survey.blocks)) {
      survey.blocks = [];
    }
    
    // Wandle die Mongoose-Daten in ein normales JavaScript-Objekt um
    const surveyData = JSON.parse(JSON.stringify(survey));
    
    // Daten für die Vorschau vorbereiten
    const previewData = {
      ...surveyData,
      id: surveyData.id || (surveyData._id ? surveyData._id.toString() : undefined),
      _id: surveyData._id ? surveyData._id.toString() : undefined,
      
      // Konvertiere alle Objekt-IDs in Strings
      assignedCompanies: [
        ...(Array.isArray(surveyData.assignedCompanies) 
          ? surveyData.assignedCompanies.map((id: any) => 
              typeof id === 'object' && id._id ? id._id.toString() : id.toString())
          : []),
        ...(Array.isArray(surveyData.specialCompanyNames) ? surveyData.specialCompanyNames : [])
      ]
    };
    
    return NextResponse.json(previewData);
  } catch (error) {
    console.error('Fehler beim Abrufen der Umfrage-Vorschau:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Umfrage-Vorschau' }, { status: 500 });
  }
}
