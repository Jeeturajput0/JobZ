import mongoose, { Model, Schema } from "mongoose";

export interface IJobMatch {
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  score: number;
  breakdown: Record<string, number>;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string[];
  recommendedActions: string[];
  weightsVersion: string;
}

const JobMatchSchema = new Schema<IJobMatch>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    score: { type: Number, required: true },
    breakdown: { type: Schema.Types.Mixed, default: {} },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    explanation: { type: [String], default: [] },
    recommendedActions: { type: [String], default: [] },
    weightsVersion: { type: String, default: "default" },
  },
  { timestamps: true },
);

JobMatchSchema.index({ candidateId: 1, jobId: 1, updatedAt: -1 });

const JobMatch: Model<IJobMatch> =
  mongoose.models.JobMatch || mongoose.model<IJobMatch>("JobMatch", JobMatchSchema);

export default JobMatch;
