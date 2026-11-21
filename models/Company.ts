import mongoose, { Model, Schema } from "mongoose";

export interface ICompany {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  employerProfileId?: mongoose.Types.ObjectId | null;
  verificationStatus: "pending" | "verified" | "rejected";
  status: "active" | "suspended";
  description?: string;
  industry?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  email?: string;
  phone?: string;
  headquarters?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  companySize?: string;
  foundedYear?: number;
  companyType?: string;
  socialLinks?: { linkedin?: string; facebook?: string; instagram?: string };
  hiringInformation?: string;
  profilePublic?: boolean;
  settings?: Record<string, unknown>;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    employerProfileId: { type: Schema.Types.ObjectId, ref: "EmployerProfile", default: null },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    description: { type: String, default: "" },
    industry: { type: String, default: "" },
    website: { type: String, default: "" },
    logo: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    headquarters: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    companySize: { type: String, default: "" },
    foundedYear: { type: Number, default: null },
    companyType: { type: String, default: "" },
    socialLinks: {
      linkedin: { type: String, default: "" },
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    hiringInformation: { type: String, default: "" },
    profilePublic: { type: Boolean, default: true },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// One company per owner — ensureCompanyForOwner assumes this invariant.
CompanySchema.index({ ownerId: 1 }, { unique: true });

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;
