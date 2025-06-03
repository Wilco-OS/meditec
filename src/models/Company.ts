import mongoose, { Schema, Document } from 'mongoose';

// Interface für eine Abteilung
export interface IDepartment {
  name: string;
  description?: string;
}

// Hauptinterface für das Unternehmen
export interface ICompany extends Document {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city: string;
  postalCode?: string;
  country?: string;
  departments: IDepartment[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const CompanySchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true,
      unique: true
    },
    contactPerson: { 
      type: String 
    },
    email: { 
      type: String,
      required: true
    },
    phone: { 
      type: String 
    },
    address: { 
      type: String 
    },
    city: { 
      type: String,
      required: true
    },
    postalCode: { 
      type: String 
    },
    country: { 
      type: String, 
      default: 'Deutschland' 
    },
    departments: [{
      name: { 
        type: String, 
        required: true 
      },
      description: { 
        type: String 
      }
    }],
    active: { 
      type: Boolean, 
      default: true 
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

export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
