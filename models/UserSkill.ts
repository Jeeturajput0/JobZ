import mongoose, { Model, Schema } from "mongoose";

export interface IUserSkill {
  userId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  createdAt?: Date;
}

const UserSkillSchema = new Schema<IUserSkill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true, index: true },
  },
  { timestamps: true },
);
UserSkillSchema.index({ userId: 1, skillId: 1 }, { unique: true });

UserSkillSchema.index({ skillId: 1, userId: 1 });

const UserSkill: Model<IUserSkill> = mongoose.models.UserSkill || mongoose.model<IUserSkill>("UserSkill", UserSkillSchema);
export default UserSkill;
