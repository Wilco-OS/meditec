import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { QuestionCatalog } from '@/models/QuestionCatalog';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { QuestionCategory } from '@/models/QuestionCategory';

// GET /api/question-catalog/[id]
export async function GET(
  req: NextRequest,
  context: unknown
) {
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const id = context.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Ungültige Fragen-ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const question = await QuestionCatalog.findById(id)
      .populate('categoryId', 'name')
      .lean();
      
    if (!question) {
      return NextResponse.json(
        { error: 'Frage nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Fehler beim Abrufen der Frage:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Frage' },
      { status: 500 }
    );
  }
}

// PUT /api/question-catalog/[id]
export async function PUT(
  req: NextRequest,
  context: unknown
) {
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const id = context.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Ungültige Fragen-ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Prüfen, ob die Frage existiert
    const existingQuestion = await QuestionCatalog.findById(id);
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Frage nicht gefunden' },
        { status: 404 }
      );
    }

    const data = await req.json();
    const { text, type, required, categoryId, options, description, isActive } = data;

    // Validierung
    if (!text) {
      return NextResponse.json(
        { error: 'Fragetext ist erforderlich' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Kategorie ist erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen, ob die Kategorie existiert
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

    // Überprüfen von Optionen für bestimmte Fragetypen
    if (['radio', 'checkbox', 'select'].includes(type)) {
      if (!options || !Array.isArray(options) || options.length === 0) {
        return NextResponse.json(
          { error: `Optionen sind für den Fragetyp "${type}" erforderlich` },
          { status: 400 }
        );
      }

      // Prüfen, ob alle Optionen Text haben
      const invalidOptions = options.some(option => !option.text || option.text.trim() === '');
      if (invalidOptions) {
        return NextResponse.json(
          { error: 'Alle Optionen müssen einen Text haben' },
          { status: 400 }
        );
      }
    }

    // Frage aktualisieren
    const updateData: any = {
      text,
      type,
      required: required !== undefined ? required : true,
      categoryId,
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date(),
      updatedBy: session.user.id
    };

    // Optionale Felder
    if (description !== undefined) {
      updateData.description = description;
    }

    // Optionen für bestimmte Fragetypen
    if (['radio', 'checkbox', 'select'].includes(type) && options) {
      updateData.options = options;
    }

    const updatedQuestion = await QuestionCatalog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name').lean();

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Frage:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Frage' },
      { status: 500 }
    );
  }
}

// DELETE /api/question-catalog/[id]
export async function DELETE(
  req: NextRequest,
  context: unknown
) {
  const { params } = context as { params: { id: string } };
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'meditec_admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const id = context.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Ungültige Fragen-ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Prüfen, ob die Frage existiert
    const question = await QuestionCatalog.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: 'Frage nicht gefunden' },
        { status: 404 }
      );
    }

    // Frage löschen
    await QuestionCatalog.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Frage erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Frage:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Frage' },
      { status: 500 }
    );
  }
}
