import mongoose, { Model, Schema } from "mongoose";

export interface IPermission {
  key: string;
  label: string;
  group: string;
  scopes: string[];
  sensitive: boolean;
}

const PermissionSchema = new Schema<IPermission>(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    group: { type: String, required: true },
    scopes: { type: [String], default: [] },
    sensitive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Permission: Model<IPermission> =
  mongoose.models.Permission ||
  mongoose.model<IPermission>("Permission", PermissionSchema);

export default Permission;
