import mongoose, { Model, Schema } from "mongoose";
import { HIRING_REQUEST_STATUSES } from "@/lib/constants";

export interface IHiringRequestHistory {
  status: string;
  note?: string;
  by?: mongoose.Types.ObjectId | null;
  at: Date;
}

export interface IHiringRequestFeedback {
  by: mongoose.Types.ObjectId;
  note: string;
  rating?: number;
  at: Date;
}

export interface IHiringRequest {
  companyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId | null;
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements: string;
  experienceRequirements: string;
  jobLocation: string;
  salaryRange: string;
  jobType: string;
  numberOfOpenings: number;
  preferredCandidateProfile: string;
  hiringDeadline?: Date | null;
  priority: "low" | "medium" | "high" | "urgent";
  additionalRequirements: string;
  status: string;
  feedback: IHiringRequestFeedback[];
  history: IHiringRequestHistory[];
}

const HistorySchema = new Schema<IHiringRequestHistory>(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const HiringRequestSchema = new Schema<IHiringRequest>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    jobTitle: { type: String, required: true, maxlength: 180 },
    jobDescription: { type: String, default: "" },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    educationRequirements: { type: String, default: "" },
    experienceRequirements: { type: String, default: "" },
    jobLocation: { type: String, default: "" },
    salaryRange: { type: String, default: "" },
    jobType: { type: String, default: "full-time" },
    numberOfOpenings: { type: Number, default: 1 },
    preferredCandidateProfile: { type: String, default: "" },
    hiringDeadline: { type: Date, default: null },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    additionalRequirements: { type: String, default: "" },
    status: { type: String, enum: HIRING_REQUEST_STATUSES, default: "draft" },
    feedback: {
      type: [
        new Schema<IHiringRequestFeedback>(
          {
            by: { type: Schema.Types.ObjectId, ref: "User", required: true },
            note: { type: String, default: "" },
            rating: { type: Number, default: 0 },
            at: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true },
);

HiringRequestSchema.index({ companyId: 1, status: 1 });

const HiringRequest: Model<IHiringRequest> =
  mongoose.models.HiringRequest ||
  mongoose.model<IHiringRequest>("HiringRequest", HiringRequestSchema);

export default HiringRequest;
