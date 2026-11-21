import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, isObjectId, toObjectId, oneOf } from "@/lib/api";
import { FILE_UPLOAD } from "@/lib/constants";
import { logActivity } from "@/lib/notify";
import CandidateDocument from "@/models/CandidateDocument";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import VerificationRequest from "@/models/VerificationRequest";

const TYPES = ["resume", "coverLetter", "educationCertificate", "employmentProof", "portfolio", "certification", "identity", "other"] as const;
const CATEGORIES = ["profile", "education", "employment", "skills"] as const;

export function validateDataUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:([a-zA-Z0-9.+/-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  if (!FILE_UPLOAD.allowedMimeTypes.includes(match[1])) return null;
  const bytes = Math.floor((match[2].replace(/\s/g, "").length * 3) / 4);
  if (bytes > FILE_UPLOAD.maxSizeBytes) return null;
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const documents = await CandidateDocument.find({ candidateId: auth.session.userId })
      .select("-dataUrl")
      .sort({ createdAt: -1 })
      .lean();
    return ok({ documents });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const dataUrl = validateDataUrl(body.dataUrl);
    if (!dataUrl) return fail("Invalid file: unsupported type, malformed data or over 5 MB.", 400);
    const type = oneOf(body.type, TYPES, "document type");
    const category = oneOf(body.category || "profile", CATEGORIES, "document category");

    let verificationId = null;
    if (isObjectId(body.verificationId)) {
      const verification = await VerificationRequest.findOne({ _id: body.verificationId, candidateId: auth.session.userId });
      if (!verification) return fail("Verification request not found.", 404);
      verificationId = toObjectId(body.verificationId);
    }

    const document = await CandidateDocument.create({
      candidateId: toObjectId(auth.session.userId)!,
      name: cleanString(body.name, 180) || "Document",
      type,
      category,
      mimeType: String(dataUrl.match(/^data:([^;]+);/)![1]),
      size: Math.floor((dataUrl.match(/^data:[^;]+;base64,([A-Za-z0-9+/=\s]+)$/)![1].replace(/\s/g, "").length * 3) / 4),
      dataUrl,
      uploadedBy: toObjectId(auth.session.userId)!,
      isPrivate: true,
      verificationId,
    });

    if (verificationId) {
      await VerificationRequest.findByIdAndUpdate(verificationId, { $push: { documents: document._id } });
    }
    if (type === "resume") {
      // Private API URL only — never a public/static link. Becomes the
      // preferred resume used with applications.
      await JobSeekerProfile.findOneAndUpdate(
        { userId: auth.session.userId },
        {
          $set: {
            resumeUrl: `/api/candidate/documents/${String(document._id)}`,
            preferredResumeId: document._id,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }
    await logActivity({
      session: auth.session,
      action: "document.uploaded",
      entity: "CandidateDocument",
      entityId: String(document._id),
      description: `Uploaded ${type} document.`,
    });
    return created({ document: { ...document.toObject(), dataUrl: undefined } });
  } catch (error) {
    return handleError(error);
  }
}
