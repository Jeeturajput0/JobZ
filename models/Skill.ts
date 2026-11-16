import mongoose, { Model, Schema } from "mongoose";

export interface ISkill {
  name: string;
  normalizedName: string;
  category: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    normalizedName: { type: String, required: true, unique: true, index: true },
    category: { type: String, default: "General", trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);

const Skill: Model<ISkill> = mongoose.models.Skill || mongoose.model<ISkill>("Skill", SkillSchema);
export default Skill;
