import mongoose, { Model, Schema } from "mongoose";
import { ASSESSMENT_TYPES } from "@/lib/constants";

export interface IAssessmentOption {
  key: string;
  text: string;
}

export interface IAssessmentQuestion {
  prompt: string;
  type: "single" | "multiple" | "text" | "code";
  options: IAssessmentOption[];
  correctKeys: string[];
  explanation?: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  skill?: string;
}

export interface IAssessment {
  title: string;
  description: string;
  type: string;
  category: string;
  skills: string[];
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  questions: IAssessmentQuestion[];
  passingScore: number;
  retakeAllowed: boolean;
  maxAttempts: number;
  status: "draft" | "active" | "inactive";
  createdBy?: mongoose.Types.ObjectId | null;
  isAiAssisted: boolean;
}

const OptionSchema = new Schema<IAssessmentOption>(
  { key: { type: String, required: true }, text: { type: String, required: true } },
  { _id: false },
);

const QuestionSchema = new Schema<IAssessmentQuestion>(
  {
    prompt: { type: String, required: true },
    type: { type: String, enum: ["single", "multiple", "text", "code"], default: "single" },
    options: { type: [OptionSchema], default: [] },
    correctKeys: { type: [String], default: [] },
    explanation: { type: String, default: "" },
    points: { type: Number, default: 1 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    skill: { type: String, default: "" },
  },
  { _id: false },
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, default: "" },
    type: { type: String, enum: ASSESSMENT_TYPES, required: true },
    category: { type: String, default: "General" },
    skills: { type: [String], default: [] },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    durationMinutes: { type: Number, default: 20 },
    questions: { type: [QuestionSchema], default: [] },
    passingScore: { type: Number, default: 60 },
    retakeAllowed: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 3 },
    status: { type: String, enum: ["draft", "active", "inactive"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isAiAssisted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AssessmentSchema.index({ status: 1, type: 1 });

const Assessment: Model<IAssessment> =
  mongoose.models.Assessment || mongoose.model<IAssessment>("Assessment", AssessmentSchema);

export default Assessment;
