import mongoose, { Model, Schema } from "mongoose";

export interface IRole {
  name: string;
  key: string;
  description?: string;
  scope: "platform" | "company" | "counseling";
  scopeId?: mongoose.Types.ObjectId | null;
  permissions: string[];
  isSystem: boolean;
  status: "active" | "inactive";
  createdBy?: mongoose.Types.ObjectId | null;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    key: { type: String, required: true, lowercase: true, trim: true, maxlength: 80 },
    description: { type: String, default: "" },
    scope: {
      type: String,
      enum: ["platform", "company", "counseling"],
      required: true,
    },
    scopeId: { type: Schema.Types.ObjectId, default: null },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

RoleSchema.index({ key: 1, scope: 1, scopeId: 1 }, { unique: true });
RoleSchema.index({ scope: 1, scopeId: 1, status: 1 });

const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export default Role;
