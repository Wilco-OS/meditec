import mongoose, { Schema, Document } from 'mongoose';
import { QuestionType } from '@/types/question';

export interface IQuestionCatalog extends Document {
  text: string;
  type: QuestionType;
  required: boolean;
  categoryId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionCatalogSchema = new Schema({
  text: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true,
    enum: Object.values(QuestionType),
    default: QuestionType.YES_NO
  },
  required: { type: Boolean, default: true },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'QuestionCategory', 
    required: true 
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Prüfen, ob wir auf dem Server sind (für Mongoose-Model) oder auf dem Client (nur Typen exportieren)
let QuestionCatalog: mongoose.Model<IQuestionCatalog>;

// Dieses Konstrukt verhindert Fehler auf dem Client, wo mongoose nicht richtig funktioniert
if (mongoose.connection?.readyState) {
  QuestionCatalog = mongoose.models.QuestionCatalog || 
    mongoose.model<IQuestionCatalog>('QuestionCatalog', QuestionCatalogSchema);
}

export { QuestionCatalog };
