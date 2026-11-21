import mongoose, { Model, Schema } from "mongoose";

export interface IAtsEvaluation {
  applicationId?: mongoose.Types.ObjectId | null;
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId | null;
  overallScore: number;
  breakdown: {
    requiredSkills?: number;
    preferredSkills?: number;
    experience?: number;
    education?: number;
    projects?: number;
    resumeQuality?: number;
    assessments?: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  profileSuggestions: string[];
  resumeSuggestions: string[];
  version: string;
  aiAssisted: boolean;
  humanReviewed: boolean;
  evaluatedBy?: mongoose.Types.ObjectId | null;
}

const AtsEvaluationSchema = new Schema<IAtsEvaluation>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", default: null, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    overallScore: { type: Number, required: true },
    breakdown: { type: Schema.Types.Mixed, default: {} },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    profileSuggestions: { type: [String], default: [] },
    resumeSuggestions: { type: [String], default: [] },
    version: { type: String, default: "ats-v1" },
    aiAssisted: { type: Boolean, default: false },
    humanReviewed: { type: Boolean, default: false },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

AtsEvaluationSchema.index({ applicationId: 1, createdAt: -1 });

const AtsEvaluation: Model<IAtsEvaluation> =
  mongoose.models.AtsEvaluation ||
  mongoose.model<IAtsEvaluation>("AtsEvaluation", AtsEvaluationSchema);

export default AtsEvaluation;
