'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedHeading } from './animations/AnimatedHeading';
import { DashboardOverview } from './dashboard-overview';
import { ProfileSettings, ResumePanel, NotificationsPanel, SettingsPanel } from './account-panels';
import { CategoryManager } from './category-manager';
import { EmployerJobsPanel, EmployerApplicantsPanel } from './employer-panels';
import { PostJobForm } from './post-job-form';
import { AdminPeoplePanel } from './admin-people-panel';
import { reveal, stagger, subtleReveal } from '@/lib/motion';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, Building2, Check, ChevronDown, CircleHelp, ClipboardList, FileText, LayoutDashboard, LogOut, Menu, MapPin, MessageSquare, Plus, Search, Settings, Shield, Sparkles, Users, X } from 'lucide-react';
import { useJobZ } from './provider';
import { JobCard, Navbar, Footer } from './site';
import type { Job } from '@/data/jobs';
import { AdminJobsManager } from '@/components/admin-jobs';

const links:Record<string,[string,string][]>={
 seeker:[['Overview','dashboard'],['Find jobs','find-jobs'],['My applications','applications'],['Saved jobs','saved-jobs'],['My profile','profile'],['Resume','resume'],['Notifications','notifications'],['Settings','settings']],
 employer:[['Overview','dashboard'],['Post a job','post-job'],['Manage jobs','manage-jobs'],['Applicants','applicants'],['Company profile','company-profile'],['Analytics','analytics'],['Notifications','notifications'],['Settings','settings']],
 admin:[['Overview','dashboard'],['Job seekers','job-seekers'],['Employers','employers'],['Manage jobs','jobs'],['Applications','applications'],['Categories','categories'],['Companies','companies'],['Featured jobs','featured-jobs'],['Reports & analytics','analytics'],['Settings','settings']]};
const icons=[LayoutDashboard,Search,ClipboardList,BriefcaseBusiness,Users,FileText,Bell,Settings,Building2,Activity,Shield];
export function AuthPage({ kind }: { kind: string }) {
  const [role, setRole] = useState<"jobSeeker" | "employer">("jobSeeker");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const signup = kind === "register";
  const adminLogin = kind === "admin-login";
  const adminSignup = kind === "admin-register";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setSubmitting(true);

    try {
      const response = await fetch(
        signup || adminSignup ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            signup || adminSignup
              ? { fullName, email, password, phone, role: adminSignup ? "admin" : role }
              : { email, password, rememberMe, ...(adminLogin ? { expectedRole: "admin" } : {}) },
          ),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result.message || "Request failed. Please try again.");
        return;
      }

      if (signup || adminSignup) {
        setFeedback(adminSignup ? "Admin account created. You can now sign in." : "Account created. You can now sign in.");
        return;
      }

      const target = adminLogin ? "/admin/dashboard" :
        result.user?.role === "jobSeeker"
          ? "/job-seeker/dashboard"
          : `/${result.user?.role}/dashboard`;
      router.replace(target);
      router.refresh();
    } catch {
      setFeedback("Could not connect to JobZ. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link href="/" className="brand">
          <span className="brandmark">j</span>jobz<span className="branddot">.</span>
        </Link>
        <div>
          <div className="kicker">YOUR NEXT CHAPTER STARTS HERE</div>
          <AnimatedHeading as="h1">
            Good work<br />finds <span className="serif-accent">good people.</span>
          </AnimatedHeading>
          <p>
            Find meaningful work, meet thoughtful teams, and make your next move
            with confidence.
          </p>
        </div>
        <div className="auth-proof">
          <span>★★★★★</span> A better way to find work
        </div>
      </div>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <Link className="back-link" href="/">← Back to JobZ</Link>
          <div className="kicker">
            {adminSignup || adminLogin ? "ADMINISTRATOR ACCESS" : signup ? "START SOMETHING GOOD" : "WELCOME BACK"}
          </div>
          <AnimatedHeading as="h2">
            {adminSignup ? "Create admin account" : signup ? "Create your account" : adminLogin ? "Admin sign in" : "Sign in to JobZ"}
          </AnimatedHeading>
          <p>
            {adminSignup ? "Create an administrator account for JobZ." : signup
              ? "A little closer to work that feels right."
              : adminLogin ? "Sign in with your JobZ administrator account." : "Pick up right where your next chapter begins."}
          </p>

          {signup && !adminSignup && (
            <>
              <label className="input-label">I’m here as</label>
              <div className="role-picker">
                {([
                  ["jobSeeker", "Job seeker"],
                  ["employer", "Employer"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={role === value ? "selected" : ""}
                    onClick={() => setRole(value)}
                  >
                    {value === "jobSeeker" ? (
                      <Users size={18} />
                    ) : (
                      <Building2 size={18} />
                    )}
                    <span>{label}</span>
                    {role === value && <Check size={15} />}
                  </button>
                ))}
              </div>
              <label className="input-label">
                Full name
                <input
                  className="input"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Your name"
                />
              </label>
            </>
          )}
          {adminSignup && <label className="input-label">Full name<input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required minLength={2} maxLength={80} placeholder="Your name" /></label>}

          <label className="input-label">
            Email address
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </label>
          <label className="input-label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={signup || adminSignup ? "new-password" : "current-password"}
              required
              minLength={signup || adminSignup ? 8 : undefined}
              maxLength={72}
              placeholder={signup || adminSignup ? "At least 8 characters" : "Your password"}
            />
          </label>
          {signup && !adminSignup && (
            <label className="input-label">
              Phone number
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                placeholder="(555) 000-0000"
              />
            </label>
          )}
          {!signup && !adminSignup && (
            <div className="form-inline">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />{" "}
                Remember me
              </label>
              <Link href="/forgot-password">Forgot password?</Link>
            </div>
          )}

          {feedback && (
            <p className="auth-feedback" role="alert" aria-live="polite">
              {feedback}
            </p>
          )}

          <button className="btn btn-primary btn-wide" type="submit" disabled={submitting}>
            {submitting
              ? signup || adminSignup ? "Creating account…" : "Signing in…"
            : signup || adminSignup ? "Create account" : adminLogin ? "Continue to admin" : "Continue to JobZ"}
            {!submitting && <ArrowRight size={16} />}
          </button>
          <small className="auth-terms">
            By continuing, you agree to our <a>Terms of Service</a> and{" "}
            <a>Privacy Policy</a>.
          </small>
          <p className="auth-switch">
            {adminSignup ? "Already have an admin account?" : adminLogin ? "Need an admin account?" : signup ? "Already have an account?" : "New to JobZ?"}{" "}
            <Link href={adminSignup ? "/admin/login" : adminLogin ? "/admin/register" : signup ? "/login" : "/register"}>
              {adminSignup ? "Admin sign in" : adminLogin ? "Register admin" : signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
export function DashboardPage({ role, section }: { role: string; section: string }) {
  const router = useRouter();
  const { jobs, saved, apps } = useJobZ();
  const [user, setUser] = useState<{ role: string; name: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [workMode, setWorkMode] = useState("remote");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [postError, setPostError] = useState("");
  const [posting, setPosting] = useState(false);
  const roleKey = role === "job-seeker" ? "seeker" : role;
  const items = links[roleKey] || links.seeker;
  const active = section || "dashboard";
  const pageTitle = items.find((item) => item[1] === active)?.[0] || "Overview";

  useEffect(() => {
    let current = true;
    fetch("/api/categories", { cache: "no-store" }).then((response) => response.json()).then((result) => { if (current) setCategories(result.categories || []); }).catch(() => { if (current) setCategories([]); });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) throw new Error("Authentication required.");

        const result = await response.json();
        const account = result.user;
        const accountRole = account?.role === "jobSeeker" ? "seeker" : account?.role;

        if (!current) return;
        if (!account || !links[accountRole]) {
          router.replace("/login");
          return;
        }
        if (accountRole !== roleKey) {
          router.replace(
            accountRole === "seeker" ? "/job-seeker/dashboard" : `/${accountRole}/dashboard`,
          );
          return;
        }

        setUser({ role: accountRole, name: account.fullName });
      } catch {
        if (current) router.replace("/login");
      }
    }

    void loadCurrentUser();
    return () => {
      current = false;
    };
  }, [roleKey, router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.replace("/login");
      router.refresh();
    }
  }

  if (!user || user.role !== roleKey) {
    return <div className="loading-screen"><span className="brandmark">j</span></div>;
  }

  return <div className="dashboard-shell"><aside className={'dash-sidebar '+(menu?'show':'')}><Link className="brand dash-brand" href="/"><span className="brandmark">j</span>jobz<span className="branddot">.</span></Link><div className="workspace-switch"><span className="workspace-mark">{roleKey==='employer'?'A':roleKey==='admin'?'J':'J'}</span><span><b>{user.name}</b><small>{roleKey==='employer'?'Hiring workspace':roleKey==='admin'?'Admin workspace':'Personal workspace'}</small></span><ChevronDown size={15}/></div><small className="side-label">WORKSPACE</small><nav className="side-nav">{items.map(([label,path],i)=>{const Icon=icons[Math.min(i,icons.length-1)];return <Link key={path} href={`/${role}/${path}`} className={active===path?'active':''}><Icon size={17}/>{label}</Link>})}</nav><div className="side-spacer"/><div className="side-help"><CircleHelp size={18}/><b>Need a hand?</b><span>We’re always happy to help.</span><Link href="/contact">Visit help center <ArrowRight size={13}/></Link></div><button className="side-profile" onClick={handleLogout}><span className="avatar">{(user.name||'J')[0]}</span><span><b>{user.name}</b><small>{user.role==='admin'?'Administrator':user.role==='employer'?'Hiring manager':'Job seeker'}</small></span><LogOut size={16}/></button></aside><main className="dash-main"><header className="dash-header"><button className="icon-btn dash-menu-btn" onClick={()=>setMenu(!menu)}><Menu/></button><div className="breadcrumbs">Workspace <span>/</span> {pageTitle}</div><div className="dash-header-actions"><button className="icon-btn"><Search size={18}/></button><button className="icon-btn notification-btn" aria-label="Notifications"><Bell size={18}/></button><span className="avatar">{(user.name||'J')[0]}</span></div></header><div className="dash-content"><div className="dash-welcome"><div><div className="kicker">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase()}</div><AnimatedHeading key={active} as="h1">{active==='dashboard'?<>Good morning, {user.name?.split(' ')[0]||'there'} <span>✦</span></>:pageTitle}</AnimatedHeading><p>{active==='dashboard'?(roleKey==='employer'?'Here’s what’s happening with your hiring today.':roleKey==='admin'?'Here’s an overview of what’s happening across JobZ.':'A little progress adds up. Here’s your job search at a glance.'):`Manage your ${pageTitle.toLowerCase()} and keep your next steps moving.`}</p></div>{roleKey==='employer'&&<Link href="/employer/post-job" className="btn btn-primary"><Plus size={17}/> Post a job</Link>}</div>
{active==='dashboard'?<DashboardOverview roleKey={roleKey}/>:active==='find-jobs'?<><div className="dash-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by role, skill, or company"/><Link href="/jobs" className="btn btn-primary btn-sm">Browse jobs <ArrowRight size={15}/></Link></div><div className="dash-job-grid">{jobs.filter(j=>!search||j.title.toLowerCase().includes(search.toLowerCase())).slice(0,6).map(j=><JobCard key={j.id} job={j}/>)}</div></>:active==='saved-jobs'?<><div className="dash-job-grid">{jobs.filter(j=>saved.includes(j.id)).map(j=><JobCard key={j.id} job={j}/>)}</div>{!saved.length&&<Empty title="Your saved roles will live here" body="Save a role that catches your eye and come back whenever you’re ready."/>}</>:active==='jobs'&&roleKey==='admin'?<AdminJobsManager/>:active==='applications'?<Table title="Your applications" headers={['Role','Company','Applied','Status']} rows={apps.map(a=>[a.jobTitle,a.company,a.date,a.status])} tabs={['All','Pending','Reviewed','Shortlisted','Interview','Rejected']}/>:active==='post-job'?<PostJobForm/>:active==='manage-jobs'?<EmployerJobsPanel/>:active==='applicants'?<EmployerApplicantsPanel/>:active==='profile'||active==='company-profile'?<ProfileSettings roleKey={roleKey}/>:active==='analytics'?<DashboardOverview roleKey={roleKey}/>:active==='resume'?<ResumePanel/>:active==='notifications'?<NotificationsPanel/>:active==='categories'?<CategoryManager/>:active==='settings'?<SettingsPanel/>:active==='job-seekers'&&roleKey==='admin'?<AdminPeoplePanel role="jobSeeker"/>:active==='employers'&&roleKey==='admin'?<AdminPeoplePanel role="employer"/>:<div className="empty-state"><h3>No records available</h3><p>Records will appear here when they are available in your account.</p></div>}</div></main></div>}

export function AboutPage(){return <><Navbar/><main><section className="about-hero"><div className="kicker">A BETTER WAY TO FIND YOUR FIT</div><AnimatedHeading as="h1">Work should feel like<br/><span className="serif-accent">a good next chapter.</span></AnimatedHeading><p>JobZ brings good people and thoughtful teams a little closer. Because the right work can change everything.</p></section><section className="about-values"><div><span>OUR MISSION</span><AnimatedHeading as="h2">Make meaningful work easier to find.</AnimatedHeading><p>We help people discover opportunities where their skills, values, and ambitions can thrive—and help good teams meet the people who will move them forward.</p></div><div><span>OUR VISION</span><AnimatedHeading as="h2">A working world where everyone can find their place.</AnimatedHeading><p>More transparency. Less noise. Better matches that create stronger teams and more fulfilling careers.</p></div></section><div className="bottom-cta"><div><div className="kicker">GOOD WORK IS OUT THERE</div><AnimatedHeading as="h2">Let’s find what’s next.</AnimatedHeading><p>Your next chapter starts with one small step.</p></div><Link href="/register" className="btn btn-white">Join JobZ <ArrowRight size={16}/></Link></div></main><Footer/></>}
