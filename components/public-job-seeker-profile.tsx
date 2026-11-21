import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCircle2, GraduationCap, MapPin, Pencil, Wrench } from "lucide-react";
import { ExpandableSummary, ProfileSectionNav } from "@/components/public-profile-controls";
import { getPublicProfile } from "@/lib/public-profile-data";

type CandidateProfile = Extract<Awaited<ReturnType<typeof getPublicProfile>>, { type: "jobSeeker" }>;

function initials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "J";
}

function Section({ id, title, icon, children }: { id?: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-32 rounded-2xl border border-[#E5ECE8] bg-white p-6 shadow-[0_4px_20px_rgba(23,43,37,.035)] sm:p-8">
    <h2 className="mb-5 flex items-center gap-2.5 text-lg font-bold text-[#172B25]">{icon}<span>{title}</span></h2>{children}
  </section>;
}

export function PublicJobSeekerProfile({ profile, isOwner }: { profile: CandidateProfile; isOwner: boolean }) {
  const resume = safeExternalUrl(profile.resumeUrl);
  const portfolio = safeExternalUrl(profile.portfolioUrl);
  const linkedIn = safeExternalUrl(profile.linkedInUrl);
  const current = profile.experience[0];
  const overview = [
    profile.location && { label: "Current location", value: profile.location },
    current?.position && { label: "Current role", value: current.position },
    current?.company && { label: "Current company", value: current.company },
    current?.duration && { label: "Duration", value: current.duration },
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const sections = [
    { id: "overview", label: "Overview" },
    ...(profile.skills.length ? [{ id: "skills", label: "Skills" }] : []),
    ...(profile.experience.length ? [{ id: "experience", label: "Experience" }] : []),
    ...(profile.education.length ? [{ id: "education", label: "Education" }] : []),
  ];

  return <main className="min-h-[calc(100vh-64px)] bg-[#F7F9F8] pb-16">
    <div className="h-36 bg-[linear-gradient(120deg,#EAF5F0,#F7F9F8)] sm:h-44" />
    <div className="mx-auto -mt-12 max-w-6xl px-4 sm:-mt-14 sm:px-8">
      <header className="rounded-2xl border border-[#E5ECE8] bg-white p-5 shadow-[0_10px_32px_rgba(23,43,37,.07)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#EAF5F0] text-xl font-bold text-[#267653] shadow-sm sm:size-24">
            {profile.profileImage ? <img src={profile.profileImage} alt={`${profile.fullName} profile photo`} className="size-full object-cover" /> : initials(profile.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#3FA47B]">Public candidate profile</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B25] sm:text-3xl">{profile.fullName}</h1>
            {profile.headline && <p className="mt-1.5 text-base text-[#52635B] sm:text-lg">{profile.headline}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#71817A]">
              {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-[#3FA47B]" />{profile.location}</span>}
              {current?.position && <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="size-4 text-[#3FA47B]" />{current.position}{current.company ? ` at ${current.company}` : ""}</span>}
            </div>
            {profile.updatedAt && <p className="mt-2 text-xs text-[#849189]">Profile updated {new Date(profile.updatedAt).toLocaleDateString("en", { month: "long", year: "numeric" })}</p>}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {isOwner && <Link href="/profile/edit" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#DCE8E1] px-3.5 text-sm font-semibold text-[#267653] hover:bg-[#F5FAF7]"><Pencil className="size-4" />Edit profile</Link>}
            {resume && <a href={resume} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#3FA47B] px-3.5 text-sm font-semibold text-white hover:bg-[#267653]"><ArrowDownToLine className="size-4" />Download resume</a>}
          </div>
        </div>
      </header>

      <div className="mt-4"><ProfileSectionNav sections={sections} /></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(270px,3fr)] lg:items-start">
        <div className="space-y-5">
          <Section id="overview" title="Professional overview" icon={<BriefcaseBusiness className="size-5 text-[#3FA47B]" />}>
            {overview.length ? <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{overview.map((item) => <div key={item.label}><dt className="text-xs font-semibold uppercase tracking-wide text-[#849189]">{item.label}</dt><dd className="mt-1.5 text-sm font-medium text-[#294538]">{item.value}</dd></div>)}</dl> : <p className="text-sm text-[#71817A]">No overview details have been added yet.</p>}
            {profile.summary && <div className="mt-6 border-t border-[#E5ECE8] pt-5"><h3 className="mb-3 font-semibold text-[#172B25]">About</h3><ExpandableSummary text={profile.summary} /></div>}
          </Section>
          {profile.skills.length > 0 && <Section id="skills" title="Skills & expertise" icon={<Wrench className="size-5 text-[#3FA47B]" />}><div className="flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="rounded-full border border-[#DDEBE3] bg-[#EAF5F0] px-3.5 py-1.5 text-sm font-medium text-[#315B45]">{skill}</span>)}</div></Section>}
          {profile.experience.length > 0 && <Section id="experience" title="Work experience" icon={<BriefcaseBusiness className="size-5 text-[#3FA47B]" />}><div className="space-y-7">{profile.experience.map((item, index) => <article key={`${item.company}-${item.position}-${index}`} className="relative border-l border-[#DCE8E1] pb-1 pl-6 last:border-transparent"><span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-[#3FA47B] ring-4 ring-white" /><h3 className="font-semibold text-[#172B25]">{item.position}</h3><p className="mt-1 text-sm font-medium text-[#39594A]">{item.company}</p>{item.duration && <p className="mt-1 text-sm text-[#71817A]">{item.duration}</p>}{item.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#52635B]">{item.description}</p>}</article>)}</div></Section>}
          {profile.education.length > 0 && <Section id="education" title="Education" icon={<GraduationCap className="size-5 text-[#3FA47B]" />}><div className="grid gap-4 sm:grid-cols-2">{profile.education.map((item, index) => <article key={`${item.institution}-${item.degree}-${index}`} className="rounded-xl border border-[#E5ECE8] bg-[#FBFCFB] p-4"><h3 className="font-semibold text-[#172B25]">{item.degree}</h3><p className="mt-1 text-sm text-[#52635B]">{item.institution}</p>{item.year && <p className="mt-2 text-sm text-[#71817A]">{item.year}</p>}</article>)}</div></Section>}
        </div>
        <aside className="space-y-5 lg:sticky lg:top-[76px]">
          <Section title="Candidate snapshot" icon={<CheckCircle2 className="size-5 text-[#3FA47B]" />}>
            {overview.length ? <dl className="space-y-4">{overview.map((item) => <div key={item.label}><dt className="text-xs font-semibold uppercase tracking-wide text-[#849189]">{item.label}</dt><dd className="mt-1 text-sm font-medium text-[#294538]">{item.value}</dd></div>)}</dl> : <p className="text-sm text-[#71817A]">No overview details provided.</p>}
            {profile.skills.length > 0 && <div className="mt-5 border-t border-[#E5ECE8] pt-4"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#849189]">Key skills</h3><div className="flex flex-wrap gap-2">{profile.skills.slice(0, 8).map((skill) => <span key={skill} className="rounded-full bg-[#EAF5F0] px-2.5 py-1 text-xs font-medium text-[#315B45]">{skill}</span>)}</div></div>}
            {resume && <a href={resume} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3FA47B] px-4 text-sm font-semibold text-white hover:bg-[#267653]">Download resume <ArrowDownToLine className="size-4" /></a>}
          </Section>
          {!profile.summary && !profile.skills.length && !profile.experience.length && !profile.education.length && <p className="rounded-2xl border border-[#E5ECE8] bg-white p-5 text-sm leading-6 text-[#71817A]">This candidate is still building their public profile.</p>}
          {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DCE8E1] bg-white px-4 text-sm font-semibold text-[#267653] hover:bg-[#F5FAF7]">Portfolio <ArrowUpRight className="size-4" /></a>}
          {profile.linkedInUrl && <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DCE8E1] bg-white px-4 text-sm font-semibold text-[#267653] hover:bg-[#F5FAF7]">LinkedIn <ArrowUpRight className="size-4" /></a>}
          {profile.updatedAt && <p className="flex items-center gap-2 px-1 text-xs text-[#849189]"><CalendarDays className="size-4" />Updated {new Date(profile.updatedAt).toLocaleDateString("en", { month: "short", year: "numeric" })}</p>}
        </aside>
      </div>
    </div>
  </main>;
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    const sensitiveParameters = /^(token|access_token|signature|sig|credential|x-amz-signature|x-amz-credential|x-goog-signature|auth)$/i;
    const containsCredentials = [...url.searchParams.keys()].some((key) => sensitiveParameters.test(key));
    return ["https:", "http:"].includes(url.protocol) && !containsCredentials && !url.username && !url.password ? url.toString() : "";
  } catch { return ""; }
}
