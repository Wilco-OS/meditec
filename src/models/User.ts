import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: 'meditec_admin' | 'company_admin' | 'employee';
  emailVerified?: Date;
  companyId?: mongoose.Types.ObjectId;
  active: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  invitationToken?: string;
  invitationTokenExpiry?: Date;
  isInvitationAccepted?: boolean;
  pendingEmail?: string; // Ausstehende E-Mail-Adresse bei Änderungen
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const UserSchema: Schema = new Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    name: { 
      type: String,
      required: true
    },
    password: { 
      type: String 
    },
    role: { 
      type: String, 
      enum: ['meditec_admin', 'company_admin', 'employee'],
      required: true,
      default: 'employee'
    },
    emailVerified: { 
      type: Date 
    },
    companyId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Company' 
    },
    active: { 
      type: Boolean, 
      default: true 
    },
    verificationToken: {
      type: String
    },
    resetToken: {
      type: String
    },
    resetTokenExpiry: {
      type: Date
    },
    invitationToken: {
      type: String
    },
    invitationTokenExpiry: {
      type: Date
    },
    isInvitationAccepted: {
      type: Boolean,
      default: false
    },
    pendingEmail: {
      type: String
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { 
    timestamps: true 
  }
);

// Automatische Admin-Erkennung basierend auf der E-Mail-Domain
UserSchema.pre('save', function(this: any, next) {
  if (this.isNew && this.email.endsWith('@meditec-online.com')) {
    this.role = 'meditec_admin';
  }
  next();
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
