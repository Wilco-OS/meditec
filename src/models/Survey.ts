import mongoose, { Schema, Document } from 'mongoose';
import { QuestionType } from '@/types/question';
import { SurveyStatus } from '@/types/survey';

// Interface für Fragen innerhalb eines Blocks
export interface ISurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  catalogRef?: mongoose.Types.ObjectId; // Referenz auf Katalogfrage, falls zutreffend
  order: number;
}

// Interface für Blöcke innerhalb einer Umfrage
export interface ISurveyBlock {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: ISurveyQuestion[];
  
  // Neue Felder für abteilungsspezifische Blöcke
  restrictToDepartments: boolean;
  departments?: string[];
  departmentId?: mongoose.Types.ObjectId; // Legacy-Feld, kann in neuen Implementierungen entfernt werden
}

// Hauptinterface für die Umfrage
export interface ISurvey extends Document {
  id?: string; // UUID für die Umfrage
  title: string;
  description?: string;
  status: SurveyStatus;
  isAnonymous: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  endDate?: Date;
  blocks: ISurveyBlock[];
  assignedCompanies: (mongoose.Types.ObjectId | string)[]; // Akzeptiert auch String-IDs
  accessCode?: string;
  specialCompanyNames?: string[]; // Für nicht-MongoDB-Format-Unternehmensnamen
  isTemplate?: boolean; // Markiert die Umfrage als Vorlage
  isDraft?: boolean; // Markiert die Umfrage als Entwurf (Deprecated, besser status verwenden)
}

// Schema für Fragen innerhalb eines Blocks
const SurveyQuestionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: Object.values(QuestionType),
    default: QuestionType.YES_NO
  },
  required: { type: Boolean, default: true },
  catalogRef: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionCatalog' },
  order: { type: Number, required: true }
});

// Schema für Blöcke innerhalb einer Umfrage
const SurveyBlockSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  order: { type: Number, required: true },
  questions: [SurveyQuestionSchema],
  // Hinzugefügte Felder für abteilungsspezifische Blöcke
  restrictToDepartments: { type: Boolean, default: false },
  departments: { type: [String], default: [] }
});



// Hauptschema für die Umfrage
const SurveySchema = new Schema<ISurvey>({
  id: { type: String, unique: true, sparse: true }, // UUID für die Umfrage
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    required: true,
    enum: Object.values(SurveyStatus),
    default: SurveyStatus.DRAFT 
  },
  isAnonymous: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  startDate: { type: Date },
  endDate: { type: Date },
  blocks: [SurveyBlockSchema],
  // Akzeptiert sowohl ObjectIds als auch String-IDs für Unternehmen
  assignedCompanies: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [] 
  },
  specialCompanyNames: { type: [String], default: [] },
  accessCode: { type: String },
  isTemplate: { type: Boolean, default: false },
  isDraft: { type: Boolean, default: true }
});

// Prüfen, ob wir auf dem Server sind (für Mongoose-Model) oder auf dem Client (nur Typen exportieren)
let Survey: mongoose.Model<ISurvey>;

// Dieses Konstrukt verhindert Fehler auf dem Client, wo mongoose nicht richtig funktioniert
if (mongoose.connection?.readyState) {
  Survey = mongoose.models.Survey || 
    mongoose.model<ISurvey>('Survey', SurveySchema);
}

export { Survey };
