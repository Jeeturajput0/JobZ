
import mongoose, { Schema, Model } from "mongoose";

export interface IJobSeekerProfile {
  userId: mongoose.Types.ObjectId;
  profileImage?: string;
  headline?: string;
  summary?: string;
  location?: string;
  skills: string[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  experience: {
    company: string;
    position: string;
    duration: string;
    description?: string;
  }[];
  resumeUrl?: string;
  resumePublic?: boolean;
  portfolioUrl?: string;
  linkedInUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const JobSeekerProfileSchema =
  new Schema<IJobSeekerProfile>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },

      profileImage: {
        type: String,
        default: "",
      },

      headline: {
        type: String,
        default: "",
      },

      summary: {
        type: String,
        default: "",
      },

      location: {
        type: String,
        default: "",
      },

      skills: {
        type: [String],
        default: [],
      },

      education: [
        {
          degree: String,
          institution: String,
          year: String,
        },
      ],

      experience: [
        {
          company: String,
          position: String,
          duration: String,
          description: String,
        },
      ],

      resumeUrl: {
        type: String,
        default: "",
      },

      resumePublic: {
        type: Boolean,
        default: false,
      },

      portfolioUrl: {
        type: String,
        default: "",
      },

      linkedInUrl: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

const JobSeekerProfile: Model<IJobSeekerProfile> =
  mongoose.models.JobSeekerProfile ||
  mongoose.model<IJobSeekerProfile>(
    "JobSeekerProfile",
    JobSeekerProfileSchema
  );

export default JobSeekerProfile;
