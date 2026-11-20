
import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  fullName: string;
  username?: string;
  email: string;
  password: string;
  phone?: string;
  role: "jobSeeker" | "employer" | "admin";
  status: "active" | "inactive" | "suspended";
  isEmailVerified: boolean;
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
      enum: ["jobSeeker", "employer", "admin"],
      default: "jobSeeker",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
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
