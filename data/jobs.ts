export interface Job {
  id: string;
  companyId?: string;
  title: string;
  company: string;
  logo: string;
  logoUrl?: string;
  color: string;
  location: string;
  salary: string;
  type: string;
  mode: string;
  category: string;
  shortDescription?: string;
  posted: string;
  createdAt?: string;
  featured?: boolean;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
  applicationDeadline?: string;
  experienceLevel?: string;
  companyDescription?: string;
  verifiedCompany?: boolean;
  minSalary?: number;
  maxSalary?: number;
}

export interface ApiJob {
  _id: string;
  title: string;
  category: string;
  shortDescription?: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
  applicationDeadline?: string;
  jobType: string;
  workMode: string;
  experienceLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  location: string;
  isFeatured?: boolean;
  createdAt?: string;
  companyId?: {
    _id?: string;
    companyName?: string;
    companyLogo?: string;
    description?: string;
    verificationStatus?: string;
  } | null;
}

function formatSalary(min?: number, max?: number): string {
  const format = (amount: number) => `$${amount.toLocaleString("en-US")}`;
  if (min !== undefined && max !== undefined) return `${format(min)} – ${format(max)}`;
  if (min !== undefined) return `From ${format(min)}`;
  if (max !== undefined) return `Up to ${format(max)}`;
  return "Salary not listed";
}

function formatPostedDate(createdAt?: string): string {
  if (!createdAt) return "Recently posted";
  const time = new Date(createdAt).getTime();
  if (!Number.isFinite(time)) return "Recently posted";
  const days = Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "month" : "months"} ago`;
}

export function toJob(record: ApiJob): Job {
  const company = record.companyId?.companyName?.trim() || "Company";
  const jobTypes: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    internship: "Internship",
  };
  const workModes: Record<string, string> = {
    onsite: "On-site",
    remote: "Remote",
    hybrid: "Hybrid",
  };

  return {
    id: record._id,
    companyId: typeof record.companyId === "object" && record.companyId ? record.companyId._id : undefined,
    title: record.title,
    company,
    logo: company.slice(0, 1).toUpperCase(),
    logoUrl: record.companyId?.companyLogo,
    color: "#3FA47B",
    location: record.location,
    salary: formatSalary(record.minSalary, record.maxSalary),
    type: jobTypes[record.jobType] || record.jobType,
    mode: workModes[record.workMode] || record.workMode,
    category: record.category,
    shortDescription: record.shortDescription?.trim() || record.description,
    posted: formatPostedDate(record.createdAt),
    createdAt: record.createdAt,
    featured: record.isFeatured,
    description: record.description,
    responsibilities: record.responsibilities || [],
    requirements: record.requirements || [],
    skills: record.skills || [],
    benefits: record.benefits || [],
    applicationDeadline: record.applicationDeadline,
    experienceLevel: record.experienceLevel,
    companyDescription: record.companyId?.description,
    verifiedCompany: record.companyId?.verificationStatus === "verified",
    minSalary: record.minSalary,
    maxSalary: record.maxSalary,
  };
}
