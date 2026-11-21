import mongoose, { Model, Schema } from "mongoose";
import { RECOMMENDATION_STATUSES } from "@/lib/constants";

export interface IRecommendationEvent {
  status: string;
  note?: string;
  by?: mongoose.Types.ObjectId | null;
  at: Date;
}

export interface ICandidateRecommendation {
  candidateId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId | null;
  hiringRequestId?: mongoose.Types.ObjectId | null;
  companyId: mongoose.Types.ObjectId;
  counselorId: mongoose.Types.ObjectId;
  counselingTeamId?: mongoose.Types.ObjectId | null;
  status: string;
  matchScore?: number;
  consentRequired: boolean;
  candidateConsent: "pending" | "accepted" | "declined";
  sharedFields: string[];
  note: string;
  companyFeedback: string;
  timeline: IRecommendationEvent[];
}

const TimelineSchema = new Schema<IRecommendationEvent>(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const CandidateRecommendationSchema = new Schema<ICandidateRecommendation>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null, index: true },
    hiringRequestId: { type: Schema.Types.ObjectId, ref: "HiringRequest", default: null, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    counselorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    counselingTeamId: { type: Schema.Types.ObjectId, ref: "CounselingTeam", default: null },
    status: { type: String, enum: RECOMMENDATION_STATUSES, default: "draft" },
    matchScore: { type: Number, default: 0 },
    consentRequired: { type: Boolean, default: true },
    candidateConsent: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    sharedFields: { type: [String], default: [] },
    note: { type: String, default: "" },
    companyFeedback: { type: String, default: "" },
    timeline: { type: [TimelineSchema], default: [] },
  },
  { timestamps: true },
);

CandidateRecommendationSchema.index({ companyId: 1, status: 1 });

const CandidateRecommendation: Model<ICandidateRecommendation> =
  mongoose.models.CandidateRecommendation ||
  mongoose.model<ICandidateRecommendation>("CandidateRecommendation", CandidateRecommendationSchema);

export default CandidateRecommendation;
