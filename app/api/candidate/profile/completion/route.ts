import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getCompletionWeights } from "@/lib/settings";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const [profile, user] = await Promise.all([
      JobSeekerProfile.findOne({ userId: auth.session.userId }).lean(),
      User.findById(auth.session.userId).select("fullName phone").lean(),
    ]);
    const completion = calculateProfileCompletion(profile, user, await getCompletionWeights());
    return ok({ completion });
  } catch (error) {
    return handleError(error);
  }
}
