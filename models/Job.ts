
import mongoose, { Schema, Model } from "mongoose";

export interface IJob {
  employerId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  jobType: "full-time" | "part-time" | "internship" | "contract";
  workMode: "onsite" | "remote" | "hybrid";
  experienceLevel: string;
  minSalary?: number;
  maxSalary?: number;
  location: string;
  benefits: string[];
  applicationDeadline?: Date;
  status: "draft" | "active" | "inactive" | "closed";
  approvalStatus: "pending" | "approved" | "rejected";
  isFeatured: boolean;
}

const JobSchema = new Schema<IJob>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: "EmployerProfile",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    category: {
      type: String,
      required: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      // Older records receive a concise fallback when hydrated and next saved.
      default: function (this: IJob) {
        return this.description?.trim().slice(0, 160) || undefined;
      },
    },

    description: {
      type: String,
      required: true,
    },

    responsibilities: {
      type: [String],
      default: [],
    },

    requirements: {
      type: [String],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
    },

    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract"],
      required: true,
    },

    workMode: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      required: true,
    },

    experienceLevel: {
      type: String,
      required: true,
    },

    minSalary: Number,

    maxSalary: Number,

    location: {
      type: String,
      required: true,
    },

    benefits: {
      type: [String],
      default: [],
    },

    applicationDeadline: Date,

    status: {
      type: String,
      enum: ["draft", "active", "inactive", "closed"],
      default: "active",
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Job: Model<IJob> =
  mongoose.models.Job ||
  mongoose.model<IJob>("Job", JobSchema);

export default Job;
