import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { QuestionCategory } from '@/models/QuestionCategory';
import dbConnect from '@/lib/dbConnect';

// GET /api/question-categories
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await dbConnect();
    
    // URL-Parameter für Filter extrahieren
    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    // Query-Objekt erstellen
    const query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }
    
    const categories = await QuestionCategory.find(query)
      .sort({ name: 1 })
      .lean();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Fehler beim Abrufen der Fragenkategorien:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Fragenkategorien' },
      { status: 500 }
    );
  }
}

// POST /api/question-categories
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await dbConnect();
    
    const data = await req.json();
    const { name, description } = data;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      );
    }
    
    // Prüfen, ob Kategorie bereits existiert
    const existingCategory = await QuestionCategory.findOne({ name });
    if (existingCategory) {
      return NextResponse.json(
        { error: `Eine Kategorie mit dem Namen "${name}" existiert bereits` },
        { status: 409 }
      );
    }
    
    // Neue Kategorie erstellen
    const newCategory = new QuestionCategory({
      name,
      description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newCategory.save();
    
    return NextResponse.json({
      message: 'Kategorie erfolgreich erstellt',
      category: newCategory
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Kategorie:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Kategorie' },
      { status: 500 }
    );
  }
}
