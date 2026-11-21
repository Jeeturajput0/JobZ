import mongoose, { Model, Schema } from "mongoose";

export interface ICounselingMembership {
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roleId?: mongoose.Types.ObjectId | null;
  title?: string;
  permissions: string[];
  assignedCandidates: mongoose.Types.ObjectId[];
  assignedHiringRequests: mongoose.Types.ObjectId[];
  status: "active" | "inactive";
  invitedBy?: mongoose.Types.ObjectId | null;
  invitedEmail?: string;
}

const CounselingMembershipSchema = new Schema<ICounselingMembership>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "CounselingTeam", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", default: null },
    title: { type: String, default: "" },
    permissions: { type: [String], default: [] },
    assignedCandidates: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    assignedHiringRequests: { type: [Schema.Types.ObjectId], ref: "HiringRequest", default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    invitedEmail: { type: String, default: "" },
  },
  { timestamps: true },
);

CounselingMembershipSchema.index({ teamId: 1, userId: 1 }, { unique: true });

const CounselingMembership: Model<ICounselingMembership> =
  mongoose.models.CounselingMembership ||
  mongoose.model<ICounselingMembership>("CounselingMembership", CounselingMembershipSchema);

export default CounselingMembership;
