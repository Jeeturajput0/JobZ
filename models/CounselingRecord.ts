import mongoose, { Model, Schema } from "mongoose";
import { CANDIDATE_WORKFLOW_STAGES } from "@/lib/constants";

export interface ICounselingHistory {
  status: string;
  note?: string;
  by?: mongoose.Types.ObjectId | null;
  at: Date;
}

export interface ICounselingNote {
  authorId: mongoose.Types.ObjectId;
  note: string;
  isPrivate: boolean;
  at: Date;
}

export interface ICounselingTask {
  title: string;
  description: string;
  status: "pending" | "inProgress" | "completed";
  dueDate?: Date | null;
  createdBy: mongoose.Types.ObjectId;
  at: Date;
}

export interface ICounselingRecord {
  candidateId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId | null;
  workflowStatus: string;
  profileCompletion: number;
  verificationStatus: string;
  suggestions: string[];
  history: ICounselingHistory[];
  notes: ICounselingNote[];
  tasks: ICounselingTask[];
}

const CounselingRecordSchema = new Schema<ICounselingRecord>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "CounselingTeam", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    workflowStatus: { type: String, enum: CANDIDATE_WORKFLOW_STAGES, default: "newCandidate" },
    profileCompletion: { type: Number, default: 0 },
    verificationStatus: { type: String, default: "notSubmitted" },
    suggestions: { type: [String], default: [] },
    history: {
      type: [
        new Schema<ICounselingHistory>(
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
    notes: {
      type: [
        new Schema<ICounselingNote>(
          {
            authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
            note: { type: String, required: true },
            isPrivate: { type: Boolean, default: true },
            at: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    tasks: {
      type: [
        new Schema<ICounselingTask>(
          {
            title: { type: String, required: true },
            description: { type: String, default: "" },
            status: { type: String, enum: ["pending", "inProgress", "completed"], default: "pending" },
            dueDate: { type: Date, default: null },
            createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
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

CounselingRecordSchema.index({ teamId: 1, workflowStatus: 1 });
CounselingRecordSchema.index({ candidateId: 1, teamId: 1 }, { unique: true });

const CounselingRecord: Model<ICounselingRecord> =
  mongoose.models.CounselingRecord ||
  mongoose.model<ICounselingRecord>("CounselingRecord", CounselingRecordSchema);

export default CounselingRecord;
