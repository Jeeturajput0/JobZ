import mongoose, { Model, Schema } from "mongoose";

export interface IInterviewFeedback {
  by: mongoose.Types.ObjectId;
  rating: number;
  notes: string;
  decision: "positive" | "neutral" | "negative";
  at: Date;
}

export interface IInterview {
  applicationId?: mongoose.Types.ObjectId | null;
  recommendationId?: mongoose.Types.ObjectId | null;
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  scheduledBy: mongoose.Types.ObjectId;
  interviewerIds: mongoose.Types.ObjectId[];
  scheduledAt: Date;
  durationMinutes: number;
  mode: "onsite" | "remote" | "phone";
  location: string;
  meetingLink: string;
  notes: string;
  feedback: IInterviewFeedback[];
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
}

const InterviewSchema = new Schema<IInterview>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", default: null, index: true },
    recommendationId: { type: Schema.Types.ObjectId, ref: "CandidateRecommendation", default: null },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    scheduledBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    interviewerIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 45 },
    mode: { type: String, enum: ["onsite", "remote", "phone"], default: "remote" },
    location: { type: String, default: "" },
    meetingLink: { type: String, default: "" },
    notes: { type: String, default: "" },
    feedback: {
      type: [
        new Schema<IInterviewFeedback>(
          {
            by: { type: Schema.Types.ObjectId, ref: "User", required: true },
            rating: { type: Number, default: 0 },
            notes: { type: String, default: "" },
            decision: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
            at: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
    },
  },
  { timestamps: true },
);

InterviewSchema.index({ companyId: 1, scheduledAt: -1 });

const Interview: Model<IInterview> =
  mongoose.models.Interview || mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;
