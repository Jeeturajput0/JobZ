import mongoose, { Model, Schema } from "mongoose";

export interface IPlacementHistory {
  status: string;
  note?: string;
  by?: mongoose.Types.ObjectId | null;
  at: Date;
}

/** A confirmed or recorded hiring outcome. No revenue is derived from this. */
export interface IPlacement {
  candidateId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId | null;
  recommendationId?: mongoose.Types.ObjectId | null;
  applicationId?: mongoose.Types.ObjectId | null;
  companyId: mongoose.Types.ObjectId;
  counselingTeamId?: mongoose.Types.ObjectId | null;
  counselorId?: mongoose.Types.ObjectId | null;
  source: "direct" | "counselingReferral" | "other";
  status: "recorded" | "confirmed" | "cancelled";
  joiningDate?: Date | null;
  notes: string;
  recordedBy?: mongoose.Types.ObjectId | null;
  history: IPlacementHistory[];
}

const PlacementSchema = new Schema<IPlacement>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null, index: true },
    recommendationId: { type: Schema.Types.ObjectId, ref: "CandidateRecommendation", default: null, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", default: null, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    counselingTeamId: { type: Schema.Types.ObjectId, ref: "CounselingTeam", default: null, index: true },
    counselorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    source: { type: String, enum: ["direct", "counselingReferral", "other"], default: "direct" },
    status: { type: String, enum: ["recorded", "confirmed", "cancelled"], default: "recorded" },
    joiningDate: { type: Date, default: null },
    notes: { type: String, default: "" },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    history: {
      type: [
        new Schema<IPlacementHistory>(
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

PlacementSchema.index({ candidateId: 1, companyId: 1, jobId: 1 });
PlacementSchema.index({ createdAt: -1 });

const Placement: Model<IPlacement> =
  mongoose.models.Placement || mongoose.model<IPlacement>("Placement", PlacementSchema);

export default Placement;
