import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";

export async function GET() {
  try {
    await connectDB();
    const [profiles, counts] = await Promise.all([
      EmployerProfile.find({}).select("companyName companyLogo industry location companySize description").sort({ companyName: 1 }).lean(),
      Job.aggregate([
        { $match: { status: "active", approvalStatus: "approved" } },
        { $group: { _id: "$companyId", count: { $sum: 1 } } },
      ]),
    ]);
    const countById = new Map(counts.map(({ _id, count }) => [String(_id), count as number]));
    const companies = profiles.map((profile) => ({
      id: String(profile._id),
      name: profile.companyName,
      logo: profile.companyLogo || "",
      industry: profile.industry || "",
      location: profile.location || "",
      companySize: profile.companySize || "",
      description: profile.description || "",
      jobCount: countById.get(String(profile._id)) || 0,
    }));
    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error("Get companies error:", error);
    return NextResponse.json({ success: false, message: "Could not load companies." }, { status: 500 });
  }
}
