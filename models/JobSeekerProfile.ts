
import mongoose, { Schema, Model } from "mongoose";

export interface IEducationEntry {
  degree: string;
  institution: string;
  year: string;
  fieldOfStudy?: string;
  result?: string;
}

export interface IExperienceEntry {
  company: string;
  position: string;
  duration: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  verified?: boolean;
}

export interface IProjectEntry {
  title: string;
  description: string;
  link?: string;
  technologies: string[];
  startDate?: string;
  endDate?: string;
}

export interface IAchievementEntry {
  title: string;
  description: string;
  date?: string;
}

export interface ICertificationEntry {
  name: string;
  issuer: string;
  year: string;
  credentialId?: string;
  verified?: boolean;
}

export interface IJobPreferences {
  roles: string[];
  locations: string[];
  jobTypes: string[];
  workModes: string[];
  minSalary?: number;
  maxSalary?: number;
  openToRelocation?: boolean;
  remoteOnly?: boolean;
}

export interface IJobSeekerProfile {
  userId: mongoose.Types.ObjectId;
  profileImage?: string;
  headline?: string;
  summary?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  dateOfBirth?: Date | null;
  gender?: string;
  availability?: string;
  noticePeriod?: string;
  preferredEmploymentType?: string;
  languages: string[];
  preferredLocations: string[];
  careerGoals?: string;
  careerLevel?: string;
  expectedSalary?: number;
  skills: string[];
  skillLevels: Record<string, string>;
  education: IEducationEntry[];
  experience: IExperienceEntry[];
  projects: IProjectEntry[];
  achievements: IAchievementEntry[];
  certifications: ICertificationEntry[];
  jobPreferences: IJobPreferences;
  resumeUrl?: string;
  resumePublic?: boolean;
  preferredResumeId?: mongoose.Types.ObjectId | null;
  portfolioUrl?: string;
  linkedInUrl?: string;
  /** Aggregate verification state is maintained by VerificationRequest docs. */
  verificationStatus: string;
  verifiedCategories: string[];
  /** Candidate consent to share selected data with companies. */
  consentShareWithCompanies: boolean;
  sharedFields: string[];
  counselingOptIn: boolean;
  workflowStatus: string;
  settings?: Record<string, unknown>;
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
      profileImage: { type: String, default: "" },
      headline: { type: String, default: "" },
      summary: { type: String, default: "" },
      location: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      phone: { type: String, default: "" },
      dateOfBirth: { type: Date, default: null },
      gender: { type: String, default: "" },
      availability: { type: String, default: "" },
      noticePeriod: { type: String, default: "" },
      preferredEmploymentType: { type: String, default: "" },
      languages: { type: [String], default: [] },
      preferredLocations: { type: [String], default: [] },
      careerGoals: { type: String, default: "" },
      careerLevel: { type: String, default: "" },
      expectedSalary: { type: Number, default: 0 },
      skills: { type: [String], default: [] },
      skillLevels: { type: Schema.Types.Mixed, default: {} },
      education: {
        type: [
          new Schema<IEducationEntry>(
            {
              degree: String,
              institution: String,
              year: String,
              fieldOfStudy: String,
              result: String,
            },
            { _id: true },
          ),
        ],
        default: [],
      },
      experience: {
        type: [
          new Schema<IExperienceEntry>(
            {
              company: String,
              position: String,
              duration: String,
              description: String,
              startDate: String,
              endDate: String,
              current: Boolean,
              verified: { type: Boolean, default: false },
            },
            { _id: true },
          ),
        ],
        default: [],
      },
      projects: {
        type: [
          new Schema<IProjectEntry>(
            {
              title: String,
              description: String,
              link: String,
              technologies: [String],
              startDate: String,
              endDate: String,
            },
            { _id: true },
          ),
        ],
        default: [],
      },
      achievements: {
        type: [
          new Schema<IAchievementEntry>(
            { title: String, description: String, date: String },
            { _id: true },
          ),
        ],
        default: [],
      },
      certifications: {
        type: [
          new Schema<ICertificationEntry>(
            {
              name: String,
              issuer: String,
              year: String,
              credentialId: String,
              verified: { type: Boolean, default: false },
            },
            { _id: true },
          ),
        ],
        default: [],
      },
      jobPreferences: {
        roles: { type: [String], default: [] },
        locations: { type: [String], default: [] },
        jobTypes: { type: [String], default: [] },
        workModes: { type: [String], default: [] },
        minSalary: { type: Number, default: 0 },
        maxSalary: { type: Number, default: 0 },
        openToRelocation: { type: Boolean, default: false },
        remoteOnly: { type: Boolean, default: false },
      },
      resumeUrl: { type: String, default: "" },
      resumePublic: { type: Boolean, default: false },
      preferredResumeId: { type: Schema.Types.ObjectId, ref: "CandidateDocument", default: null },
      portfolioUrl: { type: String, default: "" },
      linkedInUrl: { type: String, default: "" },
      verificationStatus: {
        type: String,
        enum: ["notSubmitted", "pendingReview", "underReview", "verified", "rejected", "additionalInfoRequired"],
        default: "notSubmitted",
      },
      verifiedCategories: { type: [String], default: [] },
      consentShareWithCompanies: { type: Boolean, default: false },
      sharedFields: { type: [String], default: [] },
      counselingOptIn: { type: Boolean, default: false },
      workflowStatus: { type: String, default: "newCandidate" },
      settings: { type: Schema.Types.Mixed, default: {} },
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
