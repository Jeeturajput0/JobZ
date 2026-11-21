import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";
import SavedJob from "@/models/SavedJob";
import User from "@/models/User";
import { publicJobFilter } from "@/lib/public-jobs";
import Company from "@/models/Company";
import CompanyMembership from "@/models/CompanyMembership";
import HiringRequest from "@/models/HiringRequest";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import CounselingRecord from "@/models/CounselingRecord";
import VerificationRequest from "@/models/VerificationRequest";
import AssessmentAttempt from "@/models/AssessmentAttempt";
import Notification from "@/models/Notification";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getCompletionWeights } from "@/lib/settings";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ success: false, message: "Please login first." }, { status: 401 });
  }
  await connectDB();
  const userId = session.userId;
  const role = session.role;

  if (role === "admin") {
    const [members, seekers, employers, activeJobs, applications, pendingJobs, pendingVerification, counselingMembers] = await Promise.all([
      User.countDocuments({}), User.countDocuments({ role: "jobSeeker" }),
      User.countDocuments({ role: "employer" }), Job.countDocuments(publicJobFilter()),
      Application.countDocuments({}), Job.countDocuments({ approvalStatus: "pending" }),
      VerificationRequest.countDocuments({ status: { $in: ["pendingReview", "underReview"] } }),
      User.countDocuments({ role: { $in: ["counselingAdmin", "counselingMember"] } }),
    ]);
    return NextResponse.json({ success: true, summary: { members, seekers, employers, activeJobs, applications, pendingJobs, pendingVerification, counselingMembers } });
  }

  if (role === "employer" || role === "companyMember") {
    const companyId = session.companyId;
    const jobQuery: Record<string, unknown> = { $or: [{ employerId: userId }, ...(companyId ? [{ companyId }] : [])] };
    const appQuery: Record<string, unknown> = { $or: [{ employerId: userId }, ...(companyId ? [{ companyId }] : [])] };
    const [jobs, activeJobs, applications, shortlisted, interviews, hires, hiringRequests, teamMembers, unread] = await Promise.all([
      Job.countDocuments(jobQuery), Job.countDocuments({ ...jobQuery, ...publicJobFilter() }),
      Application.countDocuments(appQuery),
      Application.countDocuments({ ...appQuery, status: { $in: ["shortlisted", "interviewScheduled", "selected"] } }),
      Application.countDocuments({ ...appQuery, status: { $in: ["interviewScheduled", "interviewCompleted"] } }),
      Application.countDocuments({ ...appQuery, status: "hired" }),
      HiringRequest.countDocuments({ companyId: companyId || "" }),
      CompanyMembership.countDocuments({ companyId: companyId || "", status: "active" }),
      Notification.countDocuments({ userId, read: false }),
    ]);
    const profile = await EmployerProfile.findOne({ userId }).select("companyName").lean();
    const company = companyId ? await Company.findById(companyId).select("name").lean() : null;
    return NextResponse.json({ success: true, summary: { jobs, activeJobs, applications, shortlisted, interviews, hires, hiringRequests, teamMembers, unread, companyName: profile?.companyName || company?.name || "" } });
  }

  if (role === "counselingAdmin" || role === "counselingMember") {
    const teamId = session.counselingTeamId;
    const [assignedCandidates, profilesInReview, jobReady, recommended, hiringRequests, verificationPending, unread] = await Promise.all([
      CounselingRecord.countDocuments({ teamId: teamId || "", assignedTo: userId }),
      CounselingRecord.countDocuments({ teamId: teamId || "", workflowStatus: { $in: ["profileReview", "profileEnhancement"] } }),
      CounselingRecord.countDocuments({ teamId: teamId || "", workflowStatus: { $in: ["jobReady", "jobMatching"] } }),
      CandidateRecommendation.countDocuments({ counselorId: userId }),
      HiringRequest.countDocuments({ status: { $nin: ["completed", "cancelled"] } }),
      VerificationRequest.countDocuments({ status: { $in: ["pendingReview", "underReview"] } }),
      Notification.countDocuments({ userId, read: false }),
    ]);
    return NextResponse.json({ success: true, summary: { assignedCandidates, profilesInReview, jobReady, recommended, hiringRequests, verificationPending, unread } });
  }

  // Candidate
  const [applications, saved, activeJobs, shortlisted, interviews, unread, profileDoc, userDoc] = await Promise.all([
    Application.countDocuments({ jobSeekerId: userId }), SavedJob.countDocuments({ jobSeekerId: userId }),
    Job.countDocuments(publicJobFilter()),
    Application.countDocuments({ jobSeekerId: userId, status: { $in: ["shortlisted", "interviewScheduled", "selected"] } }),
    Application.countDocuments({ jobSeekerId: userId, status: { $in: ["interviewScheduled", "interviewCompleted"] } }),
    Notification.countDocuments({ userId, read: false }),
    JobSeekerProfile.findOne({ userId }).lean(),
    User.findById(userId).select("fullName phone").lean(),
  ]);
  const completion = calculateProfileCompletion(profileDoc, userDoc, await getCompletionWeights());
  const assessments = await AssessmentAttempt.countDocuments({ candidateId: userId, status: "completed" });
  return NextResponse.json({ success: true, summary: { applications, saved, activeJobs, shortlisted, interviews, unread, assessments, profileCompletion: completion.percentage, verificationStatus: completion.verificationStatus, jobReadiness: completion.jobReadiness } });
}
