
import mongoose, { Schema, Model } from "mongoose";

export interface ISavedJob {
  jobSeekerId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
}

const SavedJobSchema = new Schema<ISavedJob>(
  {
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate saved jobs
SavedJobSchema.index(
  { jobSeekerId: 1, jobId: 1 },
  { unique: true }
);

const SavedJob: Model<ISavedJob> =
  mongoose.models.SavedJob ||
  mongoose.model<ISavedJob>("SavedJob", SavedJobSchema);

export default SavedJob;
