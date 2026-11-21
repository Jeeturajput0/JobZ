import mongoose, { Model, Schema } from "mongoose";

export interface IPartnershipHistory {
  status: string;
  note?: string;
  by?: mongoose.Types.ObjectId | null;
  at: Date;
}

/** Formal relationship between a company and a counseling organization. */
export interface IPartnership {
  companyId: mongoose.Types.ObjectId;
  counselingTeamId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "suspended" | "terminated";
  initiatedBy: "company" | "counseling" | "platform";
  requestedBy?: mongoose.Types.ObjectId | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  notes: string;
  history: IPartnershipHistory[];
}

const PartnershipSchema = new Schema<IPartnership>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    counselingTeamId: { type: Schema.Types.ObjectId, ref: "CounselingTeam", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "suspended", "terminated"],
      default: "pending",
    },
    initiatedBy: {
      type: String,
      enum: ["company", "counseling", "platform"],
      default: "counseling",
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    history: {
      type: [
        new Schema<IPartnershipHistory>(
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

PartnershipSchema.index({ companyId: 1, counselingTeamId: 1 }, { unique: true });
PartnershipSchema.index({ status: 1, createdAt: -1 });

const Partnership: Model<IPartnership> =
  mongoose.models.Partnership ||
  mongoose.model<IPartnership>("Partnership", PartnershipSchema);

export default Partnership;
