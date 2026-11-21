import mongoose, { Model, Schema } from "mongoose";

export interface IActivityLog {
  actorId?: mongoose.Types.ObjectId | null;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  companyId?: mongoose.Types.ObjectId | null;
  counselingTeamId?: mongoose.Types.ObjectId | null;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: "" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    counselingTeamId: { type: Schema.Types.ObjectId, ref: "CounselingTeam", default: null, index: true },
    description: { type: String, required: true, maxlength: 1000 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

ActivityLogSchema.index({ createdAt: -1 });

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
