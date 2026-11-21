
import mongoose, { Schema, Model } from "mongoose";
import { SYSTEM_ROLES, type SystemRole } from "@/lib/constants";

export interface IUser {
  fullName: string;
  username?: string;
  email: string;
  password: string;
  phone?: string;
  role: SystemRole;
  status: "active" | "inactive" | "suspended";
  isEmailVerified: boolean;
  /** Owning company (company admin + company members). */
  companyId?: mongoose.Types.ObjectId | null;
  /** Owning counseling team (counseling admin + members). */
  counselingTeamId?: mongoose.Types.ObjectId | null;
  /** Custom role scoped to a company/counseling team or the platform. */
  roleId?: mongoose.Types.ObjectId | null;
  /** Direct permission grants, additive to the resolved role permissions. */
  directPermissions: string[];
  /** Accounts provisioned through an invitation flow. */
  invitedBy?: mongoose.Types.ObjectId | null;
  lastActiveAt?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: SYSTEM_ROLES,
      default: "jobSeeker",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    counselingTeamId: {
      type: Schema.Types.ObjectId,
      ref: "CounselingTeam",
      default: null,
      index: true,
    },

    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      default: null,
      index: true,
    },

    directPermissions: {
      type: [String],
      default: [],
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastActiveAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
