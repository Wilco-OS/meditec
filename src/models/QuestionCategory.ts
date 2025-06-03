import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionCategory extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionCategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Prüfen, ob wir auf dem Server sind (für Mongoose-Model) oder auf dem Client (nur Typen exportieren)
let QuestionCategory: mongoose.Model<IQuestionCategory>;

// Dieses Konstrukt verhindert Fehler auf dem Client, wo mongoose nicht richtig funktioniert
if (mongoose.connection?.readyState) {
  QuestionCategory = mongoose.models.QuestionCategory || 
    mongoose.model<IQuestionCategory>('QuestionCategory', QuestionCategorySchema);
}

export { QuestionCategory };
