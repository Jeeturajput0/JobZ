import mongoose, { Model, Schema } from "mongoose";

/**
 * Key/value platform configuration. Values are always JSON so weights and
 * feature flags can be changed by super admins without code deployments.
 */
export interface IPlatformSetting {
  key: string;
  value: unknown;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId | null;
}

const PlatformSettingSchema = new Schema<IPlatformSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

const PlatformSetting: Model<IPlatformSetting> =
  mongoose.models.PlatformSetting ||
  mongoose.model<IPlatformSetting>("PlatformSetting", PlatformSettingSchema);

export default PlatformSetting;
