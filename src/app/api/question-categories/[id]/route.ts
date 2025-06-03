import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { QuestionCategory } from '@/models/QuestionCategory';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// GET /api/question-categories/[id]
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
        { error: 'Ungültige Kategorie-ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const category = await QuestionCategory.findById(id).lean();
    if (!category) {
      return NextResponse.json(
        { error: 'Kategorie nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorie:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Kategorie' },
      { status: 500 }
    );
  }
}

// PUT /api/question-categories/[id]
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
        { error: 'Ungültige Kategorie-ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const data = await req.json();
    const { name, description, isActive } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen, ob die Kategorie existiert
    const existingCategory = await QuestionCategory.findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Kategorie nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen, ob eine andere Kategorie mit dem gleichen Namen existiert
    const duplicateCategory = await QuestionCategory.findOne({
      name,
      _id: { $ne: id }
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Eine Kategorie mit diesem Namen existiert bereits' },
        { status: 409 }
      );
    }

    // Kategorie aktualisieren
    const updatedCategory = await QuestionCategory.findByIdAndUpdate(
      id,
      {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
        updatedBy: session.user.id
      },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kategorie:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Kategorie' },
      { status: 500 }
    );
  }
}

// DELETE /api/question-categories/[id]
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
        { error: 'Ungültige Kategorie-ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Prüfen, ob die Kategorie existiert
    const category = await QuestionCategory.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Kategorie nicht gefunden' },
        { status: 404 }
      );
    }

    // Hier könnten wir prüfen, ob Fragen mit dieser Kategorie existieren
    // und entsprechend handeln, z.B. Fragen auf eine andere Kategorie verschieben
    // oder das Löschen verhindern

    // Kategorie löschen
    await QuestionCategory.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Kategorie erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Kategorie:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Kategorie' },
      { status: 500 }
    );
  }
}
