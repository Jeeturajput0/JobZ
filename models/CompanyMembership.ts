import mongoose, { Model, Schema } from "mongoose";

export interface ICompanyMembership {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roleId?: mongoose.Types.ObjectId | null;
  title?: string;
  permissions: string[];
  assignedJobs: mongoose.Types.ObjectId[];
  assignedCandidates: mongoose.Types.ObjectId[];
  status: "active" | "inactive";
  invitedBy?: mongoose.Types.ObjectId | null;
  invitedEmail?: string;
  invitationToken?: string;
}

const CompanyMembershipSchema = new Schema<ICompanyMembership>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", default: null },
    title: { type: String, default: "" },
    permissions: { type: [String], default: [] },
    assignedJobs: { type: [Schema.Types.ObjectId], ref: "Job", default: [] },
    assignedCandidates: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    invitedEmail: { type: String, default: "" },
    invitationToken: { type: String, default: "" },
  },
  { timestamps: true },
);

CompanyMembershipSchema.index({ companyId: 1, userId: 1 }, { unique: true });

const CompanyMembership: Model<ICompanyMembership> =
  mongoose.models.CompanyMembership ||
  mongoose.model<ICompanyMembership>("CompanyMembership", CompanyMembershipSchema);

export default CompanyMembership;
