import mongoose, { Model, Schema } from "mongoose";
import { VERIFICATION_CATEGORIES, VERIFICATION_STATUSES } from "@/lib/constants";

export interface IVerificationHistory {
  status: string;
  note?: string;
  by?: mongoose.Types.ObjectId | null;
  at: Date;
}

export interface IVerificationRequest {
  candidateId: mongoose.Types.ObjectId;
  category: string;
  status: string;
  documents: mongoose.Types.ObjectId[];
  note?: string;
  requestedInfo?: string;
  submittedAt: Date;
  reviewerId?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  decisionNote?: string;
  history: IVerificationHistory[];
}

const VerificationRequestSchema = new Schema<IVerificationRequest>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: VERIFICATION_CATEGORIES, required: true },
    status: { type: String, enum: VERIFICATION_STATUSES, default: "pendingReview" },
    documents: { type: [Schema.Types.ObjectId], ref: "CandidateDocument", default: [] },
    note: { type: String, default: "" },
    requestedInfo: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    decisionNote: { type: String, default: "" },
    history: {
      type: [
        new Schema<IVerificationHistory>(
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
  { timestamps: true },
);

VerificationRequestSchema.index({ candidateId: 1, category: 1, status: 1 });

const VerificationRequest: Model<IVerificationRequest> =
  mongoose.models.VerificationRequest ||
  mongoose.model<IVerificationRequest>("VerificationRequest", VerificationRequestSchema);

export default VerificationRequest;
