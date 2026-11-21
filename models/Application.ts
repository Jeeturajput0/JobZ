
import mongoose, { Schema, Model } from "mongoose";
import { APPLICATION_STATUSES, LEGACY_APPLICATION_STATUSES } from "@/lib/constants";

export interface IApplicationStatusEvent {
  status: string;
  note?: string;
  by?: mongoose.Types.ObjectId | null;
  at: Date;
}

export interface IApplication {
  jobId: mongoose.Types.ObjectId;
  jobSeekerId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId | null;
  recommendationId?: mongoose.Types.ObjectId | null;
  source: "direct" | "recommendation";
  resumeUrl?: string;
  coverLetter?: string;
  status: string;
  assignedTo?: mongoose.Types.ObjectId | null;
  feedback?: string;
  interviewDate?: Date | null;
  appliedAt: Date;
  timeline: IApplicationStatusEvent[];
}

const ALL_STATUSES = Array.from(
  new Set<string>([...APPLICATION_STATUSES, ...LEGACY_APPLICATION_STATUSES]),
);

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    jobSeekerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    recommendationId: { type: Schema.Types.ObjectId, ref: "CandidateRecommendation", default: null },
    source: { type: String, enum: ["direct", "recommendation"], default: "direct" },
    resumeUrl: { type: String, default: "" },
    coverLetter: { type: String, default: "" },
    status: { type: String, enum: ALL_STATUSES, default: "applied" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    feedback: { type: String, default: "" },
    interviewDate: { type: Date, default: null },
    appliedAt: { type: Date, default: Date.now },
    timeline: {
      type: [
        new Schema<IApplicationStatusEvent>(
          {
            status: { type: String, required: true },
            note: { type: String, default: "" },
            by: { type: Schema.Types.ObjectId, ref: "User", default: null },
            at: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
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

ApplicationSchema.index({ employerId: 1, appliedAt: -1 });

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>(
    "Application",
    ApplicationSchema
  );

export default Application;
