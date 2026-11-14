
import mongoose, { Schema, Model } from "mongoose";

export interface IEmployerProfile {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  companyLogo?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  location?: string;
  description?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  verificationStatus: "pending" | "verified" | "rejected";
}

const EmployerProfileSchema =
  new Schema<IEmployerProfile>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },

      companyName: {
        type: String,
        required: true,
        trim: true,
      },

      companyLogo: {
        type: String,
        default: "",
      },

      industry: {
        type: String,
        default: "",
      },

      companySize: {
        type: String,
        default: "",
      },

      website: {
        type: String,
        default: "",
      },

      location: {
        type: String,
        default: "",
      },

      description: {
        type: String,
        default: "",
      },

      socialLinks: {
        linkedin: String,
        facebook: String,
        instagram: String,
      },

      verificationStatus: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
    },
    {
      timestamps: true,
    }
  );

const EmployerProfile: Model<IEmployerProfile> =
  mongoose.models.EmployerProfile ||
  mongoose.model<IEmployerProfile>(
    "EmployerProfile",
    EmployerProfileSchema
  );

export default EmployerProfile;
