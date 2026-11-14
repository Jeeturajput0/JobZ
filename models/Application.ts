
import mongoose, { Schema, Model } from "mongoose";

export interface IApplication {
  jobId: mongoose.Types.ObjectId;
  jobSeekerId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  resumeUrl?: string;
  coverLetter?: string;
  status:
    | "pending"
    | "reviewed"
    | "shortlisted"
    | "interview"
    | "rejected"
    | "hired";
  interviewDate?: Date;
  appliedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resumeUrl: {
      type: String,
      default: "",
    },

    coverLetter: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "reviewed",
        "shortlisted",
        "interview",
        "rejected",
        "hired",
      ],
      default: "pending",
    },

    interviewDate: {
      type: Date,
      default: null,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications
ApplicationSchema.index(
  { jobId: 1, jobSeekerId: 1 },
  { unique: true }
);

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>(
    "Application",
    ApplicationSchema
  );

export default Application;
