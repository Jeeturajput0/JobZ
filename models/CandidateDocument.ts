import mongoose, { Model, Schema } from "mongoose";

/**
 * Documents are stored as private data URLs and are NEVER served from a
 * public/static path. Every read goes through an authorised API that checks
 * role, permission, scope and (for companies) an existing application link.
 */
export interface ICandidateDocument {
  candidateId: mongoose.Types.ObjectId;
  name: string;
  type:
    | "resume"
    | "coverLetter"
    | "educationCertificate"
    | "employmentProof"
    | "portfolio"
    | "certification"
    | "identity"
    | "other";
  category: "profile" | "education" | "employment" | "skills";
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  verificationId?: mongoose.Types.ObjectId | null;
  isPrivate: boolean;
}

const CandidateDocumentSchema = new Schema<ICandidateDocument>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, maxlength: 180 },
    type: {
      type: String,
      enum: [
        "resume",
        "coverLetter",
        "educationCertificate",
        "employmentProof",
        "portfolio",
        "certification",
        "identity",
        "other",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["profile", "education", "employment", "skills"],
      default: "profile",
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    dataUrl: { type: String, required: true, select: false },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    verificationId: { type: Schema.Types.ObjectId, ref: "VerificationRequest", default: null },
    isPrivate: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CandidateDocumentSchema.index({ candidateId: 1, type: 1 });

const CandidateDocument: Model<ICandidateDocument> =
  mongoose.models.CandidateDocument ||
  mongoose.model<ICandidateDocument>("CandidateDocument", CandidateDocumentSchema);

export default CandidateDocument;
