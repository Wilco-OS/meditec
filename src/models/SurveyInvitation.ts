import mongoose, { Schema, Document } from 'mongoose';

export interface SurveyInvitation extends Document {
  email: string;
  name: string;
  surveyId: string;
  companyId: string;
  invitationCode: string;
  departmentId?: string; // Optional, da nicht jeder Mitarbeiter einer Abteilung zugeordnet sein muss
  status: 'pending' | 'completed' | 'expired';
  sentAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SurveyInvitationSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      required: [true, 'Survey ID is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false,
    },
    invitationCode: {
      type: String,
      required: [true, 'Invitation code is required'],
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Benannter Export für Konsistenz mit anderen Modellen
export const SurveyInvitation = mongoose.models.SurveyInvitation ||
  mongoose.model<SurveyInvitation>('SurveyInvitation', SurveyInvitationSchema);
