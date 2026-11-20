import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, GraduationCap, MapPin, Monitor, Users, Wrench } from "lucide-react";
import { getPublicProfile } from "@/lib/public-profile-data";

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
    const portfolio = safeUrl(profile.portfolioUrl);
    const linkedIn = safeUrl(profile.linkedInUrl);
    const resume = safeUrl(profile.resumeUrl);
    return <main className="min-h-[calc(100vh-64px)] bg-[#F7F9F8] pb-16">
      <div className="h-44 bg-[radial-gradient(ellipse_at_top_left,_#D9F2E5,_transparent_62%),linear-gradient(120deg,#F3F8F5,#E7F2EC)] sm:h-56" />
      <div className="mx-auto -mt-14 max-w-5xl px-5 sm:-mt-16 sm:px-8">
        <header className="rounded-3xl border border-[#E4EBE7] bg-white p-6 shadow-[0_16px_45px_rgba(20,50,35,.08)] sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar src={profile.profileImage} name={profile.fullName} />
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#16895C]">Job seeker</p>
              <h1 className="text-3xl font-bold tracking-tight text-[#172B25] sm:text-4xl">{profile.fullName}</h1>
              {profile.headline && <p className="mt-2 text-base text-[#52635B] sm:text-lg">{profile.headline}</p>}
              {profile.location && <p className="mt-3 flex items-center gap-1.5 text-sm text-[#68776F]"><MapPin className="size-4 text-[#16895C]" />{profile.location}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolio && <a href={portfolio} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#CBD8D0] px-4 text-sm font-semibold text-[#24543D] hover:bg-[#F5FAF7]">Portfolio <ArrowUpRight className="size-4" /></a>}
              {linkedIn && <a href={linkedIn} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white hover:bg-[#11764D]">LinkedIn <ArrowUpRight className="size-4" /></a>}
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            {profile.summary && <Section title="About" icon={<span className="text-[#16895C]">✳</span>}><p className="whitespace-pre-line leading-7 text-[#52635B]">{profile.summary}</p></Section>}
            {profile.experience.length > 0 && <Section title="Experience" icon={<BriefcaseBusiness className="size-5 text-[#16895C]" />}><div className="space-y-6">{profile.experience.map((item, index) => <article key={`${item.company}-${item.position}-${index}`} className="relative border-l border-[#DCE8E1] pb-1 pl-5 last:border-transparent"><span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-[#16895C] ring-4 ring-white" /><h3 className="font-semibold text-[#172B25]">{item.position}</h3><p className="mt-1 text-sm font-medium text-[#39594A]">{item.company}</p>{item.duration && <p className="mt-1 text-sm text-[#748078]">{item.duration}</p>}{item.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#52635B]">{item.description}</p>}</article>)}</div></Section>}
            {profile.education.length > 0 && <Section title="Education" icon={<GraduationCap className="size-5 text-[#16895C]" />}><div className="space-y-5">{profile.education.map((item, index) => <article key={`${item.institution}-${item.degree}-${index}`}><h3 className="font-semibold text-[#172B25]">{item.degree}</h3><p className="mt-1 text-sm text-[#52635B]">{item.institution}</p>{item.year && <p className="mt-1 text-sm text-[#748078]">{item.year}</p>}</article>)}</div></Section>}
          </div>
          <aside className="space-y-5">
            {profile.skills.length > 0 && <Section title="Skills" icon={<Wrench className="size-5 text-[#16895C]" />}><div className="flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="rounded-full bg-[#EFF7F2] px-3 py-1.5 text-sm font-medium text-[#315B45]">{skill}</span>)}</div></Section>}
            {resume && <Section title="Resume" icon={<CheckCircle2 className="size-5 text-[#16895C]" />}><p className="mb-4 text-sm leading-6 text-[#68776F]">A resume has been shared publicly by this candidate.</p><a href={resume} target="_blank" rel="noreferrer" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white hover:bg-[#11764D]">View resume <ArrowUpRight className="size-4" /></a></Section>}
          </aside>
        </div>
      </div>
    </main>;
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
