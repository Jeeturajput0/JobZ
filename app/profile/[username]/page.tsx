import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays, MapPin, Monitor, Users } from "lucide-react";
import { getPublicProfile, isPublicProfileOwner } from "@/lib/public-profile-data";
import { getAuthUserFromToken } from "@/lib/auth";
import { PublicJobSeekerProfile } from "@/components/public-job-seeker-profile";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) return { title: "Profile not found" };
  const title = profile.type === "jobSeeker" ? profile.fullName : profile.companyName;
  const description = profile.type === "jobSeeker"
    ? profile.headline || profile.summary.slice(0, 155) || `${title}'s professional profile on JobZ.`
    : profile.description.slice(0, 155) || `${title} on JobZ.`;
  return { title, description, alternates: { canonical: `/profile/${profile.username}` }, openGraph: { title: `${title} | JobZ`, description, type: "profile" } };
}

function initials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "J";
}

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}

function Avatar({ src, name, company = false }: { src: string; name: string; company?: boolean }) {
  return <div className={`grid size-24 shrink-0 place-items-center overflow-hidden border border-white/80 bg-white text-2xl font-bold text-[#16895C] shadow-sm sm:size-28 ${company ? "rounded-2xl" : "rounded-full"}`}>
    {src ? <img src={src} alt={`${name} ${company ? "logo" : "profile photo"}`} className="size-full object-cover" /> : initials(name)}
  </div>;
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="rounded-2xl border border-[#E4EBE7] bg-white p-6 shadow-[0_8px_30px_rgba(20,50,35,.04)] sm:p-8">
    <h2 className="mb-5 flex items-center gap-2.5 text-lg font-bold text-[#172B25]">{icon}<span>{title}</span></h2>
    {children}
  </section>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  if (profile.type === "jobSeeker") {
    const cookieStore = await cookies();
    const viewer = getAuthUserFromToken(cookieStore.get("jobz_token")?.value);
    const isOwner = viewer?.role === "jobSeeker" && await isPublicProfileOwner(profile.username || username, viewer.userId);
    return <PublicJobSeekerProfile profile={profile} isOwner={isOwner} />;
  }

  const website = safeUrl(profile.website);
  return <main className="min-h-[calc(100vh-64px)] bg-[#F7F9F8] pb-16">
    <div className="h-48 bg-[radial-gradient(ellipse_at_top_left,_#D9F2E5,_transparent_62%),linear-gradient(120deg,#F3F8F5,#E7F2EC)] sm:h-60" />
    <div className="mx-auto -mt-16 max-w-5xl px-5 sm:px-8">
      <header className="rounded-3xl border border-[#E4EBE7] bg-white p-6 shadow-[0_16px_45px_rgba(20,50,35,.08)] sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar src={profile.companyLogo} name={profile.companyName} company />
          <div className="min-w-0 flex-1"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#16895C]">Employer</p><h1 className="text-3xl font-bold tracking-tight text-[#172B25] sm:text-4xl">{profile.companyName}</h1>{profile.industry && <p className="mt-2 text-[#52635B]">{profile.industry}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#68776F]">{profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-[#16895C]" />{profile.location}</span>}{profile.companySize && <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-[#16895C]" />{profile.companySize}</span>}</div>
          </div>
          {website && <a href={website} target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white hover:bg-[#11764D]">Company website <ArrowUpRight className="size-4" /></a>}
        </div>
      </header>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {profile.description && <Section title="About the company" icon={<Building2 className="size-5 text-[#16895C]" />}><p className="whitespace-pre-line leading-7 text-[#52635B]">{profile.description}</p></Section>}
          <Section title={`Open positions${profile.jobs.length ? ` (${profile.jobs.length})` : ""}`} icon={<BriefcaseBusiness className="size-5 text-[#16895C]" />}>
            {profile.jobs.length ? <div className="divide-y divide-[#EAF0EC]">{profile.jobs.map((job) => <Link key={job.id} href={`/jobs/${job.id}`} className="group block py-5 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-[#172B25] group-hover:text-[#16895C]">{job.title}</h3><p className="mt-1 text-sm leading-6 text-[#68776F]">{job.shortDescription}</p></div><ArrowUpRight className="mt-1 size-4 shrink-0 text-[#93A39A] group-hover:text-[#16895C]" /></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#68776F]"><span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{job.location}</span><span>{job.jobType.replaceAll("-", " ")}</span><span className="inline-flex items-center gap-1"><Monitor className="size-3.5" />{job.workMode}</span><span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{new Date(job.createdAt).toLocaleDateString("en", { month: "short", year: "numeric" })}</span></div></Link>)}</div> : <p className="text-sm text-[#68776F]">There are no active openings right now.</p>}
          </Section>
        </div>
        <aside><Section title="Company details" icon={<Building2 className="size-5 text-[#16895C]" />}><dl className="space-y-4 text-sm">{profile.industry && <div><dt className="text-[#849189]">Industry</dt><dd className="mt-1 font-medium text-[#294538]">{profile.industry}</dd></div>}{profile.companySize && <div><dt className="text-[#849189]">Company size</dt><dd className="mt-1 font-medium text-[#294538]">{profile.companySize}</dd></div>}{profile.location && <div><dt className="text-[#849189]">Location</dt><dd className="mt-1 font-medium text-[#294538]">{profile.location}</dd></div>}{website && <div><dt className="text-[#849189]">Website</dt><dd className="mt-1 break-all font-medium text-[#16895C]">{new URL(website).hostname}</dd></div>}</dl></Section></aside>
      </div>
    </div>
  </main>;
}
