import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface ICompanyInvitation extends Document {
  company: mongoose.Types.ObjectId;
  email: string;
  companyName: string;
  name: string;
  role: string;
  department?: mongoose.Types.ObjectId;
  invitationCode: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  registeredUserId?: mongoose.Types.ObjectId;
}

const CompanyInvitationSchema: Schema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    companyName: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['employee', 'company_admin'],
      default: 'employee',
      required: true
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Company.departments'
    },
    invitationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage ab Erstellung
    },
    usedAt: {
      type: Date
    },
    registeredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Automatische Generierung des Einladungscodes
CompanyInvitationSchema.pre('save', function(next) {
  if (this.isNew && !this.invitationCode) {
    // Generiere einen 6-stelligen alphanumerischen Code in Großbuchstaben
    this.invitationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  next();
});

// Index für schnelle Abfragen nach Einladungscode
CompanyInvitationSchema.index({ invitationCode: 1 });
// Index für Abfragen nach nicht verwendeten, nicht abgelaufenen Einladungen
CompanyInvitationSchema.index({ usedAt: 1, expiresAt: 1 });

export const CompanyInvitation = mongoose.models.CompanyInvitation || 
  mongoose.model<ICompanyInvitation>('CompanyInvitation', CompanyInvitationSchema);
