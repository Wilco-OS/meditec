import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Survey } from '@/models/Survey';
import { Company } from '@/models/Company';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/companies/[id]/surveys - Umfragen für ein bestimmtes Unternehmen abrufen
export async function GET(
  request: NextRequest,
  context: unknown
) {
  // Params extrahieren für Next.js App Router
  const { params } = context as { params: { id: string } };
  const companyId = params.id;
  
  console.log('Abrufen von Umfragen für Unternehmen mit ID:', companyId);
  
  if (!companyId || companyId === 'undefined') {
    return NextResponse.json({ error: 'Ungültige Unternehmens-ID' }, { status: 400 });
  }
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    // Nur Meditec-Admins oder Unternehmens-Admins des entsprechenden Unternehmens dürfen zugreifen
    const isMeditecAdmin = session.user.role === 'meditec_admin';
    const isCompanyAdmin = session.user.role === 'company_admin' && 
                          session.user.companyId && 
                          session.user.companyId.toString() === companyId;
    
    if (!isMeditecAdmin && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }
    
    await dbConnect();
    
    // Überprüfen, ob das Unternehmen existiert
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }
    
    // Umfragen finden, die diesem Unternehmen zugewiesen sind
    // Hier müssen wir die assignedCompanies als String und als ObjectID prüfen
    const surveys = await Survey.find({
      $or: [
        { assignedCompanies: companyId },
        { assignedCompanies: new mongoose.Types.ObjectId(companyId) },
        { 'specialCompanyNames': { $in: [company.name] } }
      ]
    }).sort({ updatedAt: -1 });
    
    // Umfragen für die Rückgabe konvertieren
    const formattedSurveys = surveys.map(survey => {
      const surveyObj = survey.toObject();
      return {
        ...surveyObj,
        id: surveyObj.id || (surveyObj._id as mongoose.Types.ObjectId).toString(),
        _id: (surveyObj._id as mongoose.Types.ObjectId).toString(),
        createdAt: surveyObj.createdAt.toISOString(),
        updatedAt: surveyObj.updatedAt.toISOString(),
        startDate: surveyObj.startDate ? surveyObj.startDate.toISOString() : null,
        endDate: surveyObj.endDate ? surveyObj.endDate.toISOString() : null,
        assignedCompanies: Array.isArray(surveyObj.assignedCompanies) 
          ? surveyObj.assignedCompanies.map((id: any) => 
              typeof id === 'object' && id._id ? id._id.toString() : String(id))
          : []
      };
    });
    
    console.log(`${formattedSurveys.length} Umfragen für Unternehmen ${company.name} gefunden`);
    
    return NextResponse.json({
      company: {
        _id: company._id.toString(),
        name: company.name,
        email: company.email,
        contactPerson: company.contactPerson,
        city: company.city,
        active: company.active
      },
      surveys: formattedSurveys
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Umfragen für das Unternehmen:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Umfragen' }, { status: 500 });
  }
}
