import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { QuestionCatalog } from '@/models/QuestionCatalog';
import { QuestionType } from '@/types/question';
import { QuestionCategory } from '@/models/QuestionCategory';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/question-catalog
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await dbConnect();
    
    const searchParams = req.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type');
    
    const queryObj: any = { isActive: true };
    
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      queryObj.categoryId = categoryId;
    }
    
    if (type && Object.values(QuestionType).includes(type as QuestionType)) {
      queryObj.type = type;
    }
    
    const questions = await QuestionCatalog.find(queryObj)
      .populate('categoryId', 'name')
      .sort({ text: 1 })
      .lean();
    
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Fehler beim Abrufen der Fragen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Fragen' },
      { status: 500 }
    );
  }
}

// POST /api/question-catalog
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    await dbConnect();
    
    const data = await req.json();
    const { text, type, required, categoryId } = data;
    
    // Validierung
    if (!text || !categoryId) {
      return NextResponse.json(
        { error: 'Text und Kategorie sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Prüfen, ob Kategorie existiert
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: 'Ungültige Kategorie-ID' },
        { status: 400 }
      );
    }
    
    const category = await QuestionCategory.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'Kategorie nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Neue Frage erstellen
    const newQuestion = new QuestionCatalog({
      text,
      type: type || QuestionType.YES_NO,
      required: required ?? true,
      categoryId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newQuestion.save();
    
    return NextResponse.json({
      message: 'Frage erfolgreich erstellt',
      question: newQuestion
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Frage:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Frage' },
      { status: 500 }
    );
  }
}
