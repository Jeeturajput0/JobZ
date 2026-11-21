import mongoose, { Model, Schema } from "mongoose";

export interface IAttemptAnswer {
  questionIndex: number;
  selectedKeys: string[];
  textAnswer?: string;
  earnedPoints: number;
  correct?: boolean;
}

export interface ISkillScore {
  skill: string;
  score: number;
}

export interface IAssessmentAttempt {
  assessmentId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  answers: IAttemptAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  skillScores: ISkillScore[];
  strengths: string[];
  improvements: string[];
  recommendedAssessments: string[];
  status: "inProgress" | "completed";
  startedAt: Date;
  completedAt?: Date | null;
}

const AnswerSchema = new Schema<IAttemptAnswer>(
  {
    questionIndex: { type: Number, required: true },
    selectedKeys: { type: [String], default: [] },
    textAnswer: { type: String, default: "" },
    earnedPoints: { type: Number, default: 0 },
    correct: { type: Boolean, default: false },
  },
  { _id: false },
);

const SkillScoreSchema = new Schema<ISkillScore>(
  { skill: { type: String, required: true }, score: { type: Number, default: 0 } },
  { _id: false },
);

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: [AnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    skillScores: { type: [SkillScoreSchema], default: [] },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    recommendedAssessments: { type: [String], default: [] },
    status: { type: String, enum: ["inProgress", "completed"], default: "inProgress" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AssessmentAttemptSchema.index({ candidateId: 1, assessmentId: 1, createdAt: -1 });

const AssessmentAttempt: Model<IAssessmentAttempt> =
  mongoose.models.AssessmentAttempt ||
  mongoose.model<IAssessmentAttempt>("AssessmentAttempt", AssessmentAttemptSchema);

export default AssessmentAttempt;
