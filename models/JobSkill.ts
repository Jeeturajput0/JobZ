import mongoose, { Model, Schema } from "mongoose";

export interface IJobSkill {
  jobId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  createdAt?: Date;
}

const JobSkillSchema = new Schema<IJobSkill>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true, index: true },
  },
  { timestamps: true },
);
JobSkillSchema.index({ jobId: 1, skillId: 1 }, { unique: true });

JobSkillSchema.index({ skillId: 1, jobId: 1 });

const JobSkill: Model<IJobSkill> = mongoose.models.JobSkill || mongoose.model<IJobSkill>("JobSkill", JobSkillSchema);
export default JobSkill;
