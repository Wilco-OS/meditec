import mongoose, { Schema, Document } from 'mongoose';

// Interface für einzelne Antworten
export interface IAnswer {
  questionId: string;
  value: string | number | string[] | boolean | null;
}

// Interface für Respondent-Info bei Einladungsteilnehmern
export interface IRespondentInfo {
  name?: string;
  email?: string;
  department?: string;
}

// Interface für Umfrageantworten
export interface ISurveyResponse extends Document {
  surveyId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional für registrierte Benutzer
  companyId?: mongoose.Types.ObjectId;
  answers: Record<string, any>;
  respondentType: 'user' | 'invitation' | 'anonymous';
  respondentId?: mongoose.Types.ObjectId; // Benutzer-ID oder Einladungs-ID
  respondentInfo?: IRespondentInfo; // Informationen zum Teilnehmer bei Einladungen
  completed: boolean;
  completedAt?: Date;
  startedAt: Date;
  ipAddress?: string; // Für die Erkennung von Duplikaten
  accessCode?: string; // Für anonyme Teilnahme
}

// Schema für einzelne Antworten
const AnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    value: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

// Schema für Respondent-Info
const RespondentInfoSchema = new Schema({
  name: { type: String },
  email: { type: String },
  department: { type: String }
}, { _id: false });

// Hauptschema für Umfrageantworten
const SurveyResponseSchema: Schema = new Schema(
  {
    surveyId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Survey',
      required: true 
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User'
    },
    companyId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Company'
    },
    answers: {
      type: Map,
      of: Schema.Types.Mixed
    },
    respondentType: {
      type: String,
      enum: ['user', 'invitation', 'anonymous'],
      required: true
    },
    respondentId: {
      type: Schema.Types.ObjectId,
      refPath: 'respondentType'
    },
    respondentInfo: RespondentInfoSchema,
    completed: { 
      type: Boolean, 
      default: true 
    },
    completedAt: { 
      type: Date,
      default: Date.now
    },
    startedAt: { 
      type: Date,
      default: Date.now 
    },
    ipAddress: {
      type: String
    },
    accessCode: {
      type: String
    }
  },
  { 
    timestamps: true 
  }
);

// Indexe für effiziente Suche nach Umfragen und Unternehmen
SurveyResponseSchema.index({ surveyId: 1, companyId: 1 });
// Index für die Erkennung von Duplikaten
SurveyResponseSchema.index({ surveyId: 1, ipAddress: 1 });
// Index für Teilnehmertypen und IDs
SurveyResponseSchema.index({ respondentType: 1, respondentId: 1 });
// Index für Zugangscodes
SurveyResponseSchema.index({ accessCode: 1 });

export const SurveyResponse = mongoose.models.SurveyResponse || 
  mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
