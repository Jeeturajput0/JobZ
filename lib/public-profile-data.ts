import { connectDB } from "@/lib/mongodb";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import User from "@/models/User";

export async function getPublicProfile(username: string) {
  await connectDB();
  const user = await User.findOne({ username: username.toLowerCase(), status: "active" })
    .select("fullName username role")
    .lean();
  if (!user || !["jobSeeker", "employer"].includes(user.role)) return null;

  if (user.role === "jobSeeker") {
    const profile = await JobSeekerProfile.findOne({ userId: user._id })
      .select("profileImage headline summary location skills education experience resumeUrl portfolioUrl linkedInUrl")
      .lean();
    if (!profile) return null;
    return {
      type: "jobSeeker" as const,
      username: user.username,
      fullName: user.fullName,
      profileImage: profile.profileImage || "",
      headline: profile.headline || "",
      summary: profile.summary || "",
      location: profile.location || "",
      skills: profile.skills || [],
      education: (profile.education || []).map(({ degree, institution, year }) => ({ degree, institution, year })),
      experience: (profile.experience || []).map(({ company, position, duration, description }) => ({ company, position, duration, description })),
      resumeUrl: profile.resumeUrl || "",
      portfolioUrl: profile.portfolioUrl || "",
      linkedInUrl: profile.linkedInUrl || "",
    };
  }

  const profile = await EmployerProfile.findOne({ userId: user._id })
    .select("companyName companyLogo industry companySize website location description")
    .lean();
  if (!profile) return null;
  const jobs = await Job.find({
    employerId: user._id,
    companyId: profile._id,
    status: "active",
    approvalStatus: "approved",
  })
    .select("_id title slug shortDescription location jobType workMode createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return {
    type: "employer" as const,
    username: user.username,
    companyName: profile.companyName,
    companyLogo: profile.companyLogo || "",
    industry: profile.industry || "",
    companySize: profile.companySize || "",
    website: profile.website || "",
    location: profile.location || "",
    description: profile.description || "",
    jobs: jobs.map(({ _id, title, slug, shortDescription, location, jobType, workMode, createdAt }) => ({
      id: _id.toString(), title, slug, shortDescription, location, jobType, workMode,
      createdAt: (createdAt || new Date()).toISOString(),
    })),
  };
}
