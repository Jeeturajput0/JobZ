import mongoose, { Model, Schema } from "mongoose";

export interface ICounselingTeam {
  name: string;
  slug: string;
  adminId: mongoose.Types.ObjectId;
  description?: string;
  status: "active" | "suspended";
  settings?: Record<string, unknown>;
}

const CounselingTeamSchema = new Schema<ICounselingTeam>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const CounselingTeam: Model<ICounselingTeam> =
  mongoose.models.CounselingTeam ||
  mongoose.model<ICounselingTeam>("CounselingTeam", CounselingTeamSchema);

export default CounselingTeam;
