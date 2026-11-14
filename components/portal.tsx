'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedHeading } from './animations/AnimatedHeading';
import { DashboardOverview } from './dashboard-overview';
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
          <span>★★★★★</span> Trusted by 40,000+ professionals
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
  const { jobs, saved, apps, addJob } = useJobZ();
  const [user, setUser] = useState<{ role: string; name: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("Acme Studio");
  const roleKey = role === "job-seeker" ? "seeker" : role;
  const items = links[roleKey] || links.seeker;
  const active = section || "dashboard";
  const pageTitle = items.find((item) => item[1] === active)?.[0] || "Overview";

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

  const postJob = () => {
    if (!title.trim()) return;
    const job: Job = {
      id: `custom-${Date.now()}`,
      title,
      company,
      logo: company.charAt(0).toUpperCase(),
      color: "#4c73e6",
      location: "Remote · US",
      salary: "$100k – $150k",
      type: "Full-time",
      mode: "Remote",
      category: "Product",
      posted: "Just now",
      description: "Join our team and make a meaningful impact.",
    };
    addJob(job);
    setTitle("");
    router.push("/employer/manage-jobs");
  };return <div className="dashboard-shell"><aside className={'dash-sidebar '+(menu?'show':'')}><Link className="brand dash-brand" href="/"><span className="brandmark">j</span>jobz<span className="branddot">.</span></Link><div className="workspace-switch"><span className="workspace-mark">{roleKey==='employer'?'A':roleKey==='admin'?'J':'J'}</span><span><b>{roleKey==='employer'?'Acme Studio':roleKey==='admin'?'JobZ Admin':'Jordan Lee'}</b><small>{roleKey==='employer'?'Hiring workspace':roleKey==='admin'?'Admin workspace':'Personal workspace'}</small></span><ChevronDown size={15}/></div><small className="side-label">WORKSPACE</small><nav className="side-nav">{items.map(([label,path],i)=>{const Icon=icons[Math.min(i,icons.length-1)];return <Link key={path} href={`/${role}/${path}`} className={active===path?'active':''}><Icon size={17}/>{label}{label==='Notifications'&&<span className="side-badge">3</span>}</Link>})}</nav><div className="side-spacer"/><div className="side-help"><CircleHelp size={18}/><b>Need a hand?</b><span>We’re always happy to help.</span><Link href="/contact">Visit help center <ArrowRight size={13}/></Link></div><button className="side-profile" onClick={handleLogout}><span className="avatar">{(user.name||'J')[0]}</span><span><b>{user.name}</b><small>{user.role==='admin'?'Administrator':user.role==='employer'?'Hiring manager':'Job seeker'}</small></span><LogOut size={16}/></button></aside><main className="dash-main"><header className="dash-header"><button className="icon-btn dash-menu-btn" onClick={()=>setMenu(!menu)}><Menu/></button><div className="breadcrumbs">Workspace <span>/</span> {pageTitle}</div><div className="dash-header-actions"><button className="icon-btn"><Search size={18}/></button><button className="icon-btn notification-btn"><Bell size={18}/><i/></button><span className="avatar">{(user.name||'J')[0]}</span></div></header><div className="dash-content"><div className="dash-welcome"><div><div className="kicker">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase()}</div><AnimatedHeading key={active} as="h1">{active==='dashboard'?<>Good morning, {user.name?.split(' ')[0]||'Jordan'} <span>✦</span></>:pageTitle}</AnimatedHeading><p>{active==='dashboard'?(roleKey==='employer'?'Here’s what’s happening with your hiring today.':roleKey==='admin'?'Here’s an overview of what’s happening across JobZ.':'A little progress adds up. Here’s your job search at a glance.'):`Manage your ${pageTitle.toLowerCase()} and keep your next steps moving.`}</p></div>{roleKey==='employer'&&<Link href="/employer/post-job" className="btn btn-primary"><Plus size={17}/> Post a job</Link>}</div>
{active==='dashboard'?<DashboardOverview roleKey={roleKey}/>:active==='find-jobs'?<><div className="dash-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by role, skill, or company"/><Link href="/jobs" className="btn btn-primary btn-sm">Browse jobs <ArrowRight size={15}/></Link></div><div className="dash-job-grid">{jobs.filter(j=>!search||j.title.toLowerCase().includes(search.toLowerCase())).slice(0,6).map(j=><JobCard key={j.id} job={j}/>)}</div></>:active==='saved-jobs'?<><div className="dash-job-grid">{jobs.filter(j=>saved.includes(j.id)).map(j=><JobCard key={j.id} job={j}/>)}</div>{!saved.length&&<Empty title="Your saved roles will live here" body="Save a role that catches your eye and come back whenever you’re ready."/>}</>:active==='jobs'&&roleKey==='admin'?<AdminJobsManager/>:active==='applications'?<Table title="Your applications" headers={['Role','Company','Applied','Status']} rows={apps.map(a=>[a.jobTitle,a.company,a.date,a.status])} tabs={['All','Pending','Reviewed','Shortlisted','Interview','Rejected']}/>:active==='post-job'?<motion.div className="form-card motion-safe-enter" variants={reveal} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.15}}><div className="form-section-title"><span>01</span><div><b>The role</b><small>Start with the essentials. You can add the details next.</small></div></div><div className="form-grid"><label>Job title<input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Senior Product Designer"/></label><label>Company<input className="input" value={company} onChange={e=>setCompany(e.target.value)}/></label><label>Job category<select className="input"><option>Product</option><option>Engineering</option><option>Design</option><option>Marketing</option></select></label><label>Job type<select className="input"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label><label>Work mode<select className="input"><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label>Location<input className="input" placeholder="City, state or remote"/></label><label>Salary range<input className="input" placeholder="$100,000 – $150,000"/></label><label>Experience level<select className="input"><option>Mid-level</option><option>Entry-level</option><option>Senior</option></select></label><label className="full-field">Description<textarea className="input" placeholder="Tell candidates what makes this role exciting…" rows={5}/></label><label className="full-field">Skills<input className="input" placeholder="Add skills separated by commas"/></label></div><div className="form-footer"><button className="btn btn-outline" onClick={()=>{}}>Save as draft</button><button className="btn btn-primary" onClick={postJob}>Publish role <ArrowRight size={16}/></button></div></motion.div>:active==='manage-jobs'?<Table title="Your job posts" headers={['Role','Location','Type','Applicants','Posted','Status','Actions']} rows={jobs.slice(0,8).map((j,i)=>[j.title,j.location,j.type,String(12+i*4),j.posted,'Active','···'])}/>:active==='applicants'?<Table title="Recent applicants" headers={['Candidate','Applied for','Experience','Applied','Status']} rows={['Taylor Kim','Sam Rivera','Morgan Chen','Alex Morgan'].map((n,i)=>[n,jobs[i]?.title ?? "No job data",`${3+i} years`,`${i+1} days ago`,i===0?'Shortlisted':'In review'])}/>:active==='profile'||active==='company-profile'?<ProfileForm roleKey={roleKey}/>:active==='analytics'?<DashboardOverview roleKey={roleKey}/>:active==='resume'?<ResumePanel/>:active==='notifications'?<Notifications/>:active==='categories'?<Categories/>:active==='settings'?<SettingsPanel/>:<Table title={pageTitle} headers={['Name','Email','Joined','Status','Actions']} rows={['Taylor Kim','Jordan Lee','Morgan Chen','Sam Rivera'].map((n,i)=>[n,`${n.split(' ')[0].toLowerCase()}@example.com`,'Oct 2026',i?'Active':'Pending','···'])}/>}</div></main></div>}

function ProfileForm({roleKey}:{roleKey:string}){return <motion.div className="form-card motion-safe-enter" variants={reveal} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.15}}><div className="profile-cover"><div className="profile-avatar">J</div><button className="btn btn-outline btn-sm">Change photo</button></div><div className="form-grid"><label>{roleKey==='employer'?'Company name':'Full name'}<input className="input" defaultValue={roleKey==='employer'?'Acme Studio':'Jordan Lee'}/></label><label>{roleKey==='employer'?'Website':'Email'}<input className="input" defaultValue={roleKey==='employer'?'acmestudio.com':'jordan@example.com'}/></label><label>{roleKey==='employer'?'Industry':'Phone'}<input className="input" placeholder={roleKey==='employer'?'Design & technology':'(555) 555-0100'}/></label><label>Location<input className="input" defaultValue="Brooklyn, NY"/></label><label className="full-field">{roleKey==='employer'?'About your company':'Professional headline'}<textarea className="input" rows={4} placeholder="Tell us a little more…"/></label><label className="full-field">Skills<input className="input" defaultValue="Product design, Figma, Research"/></label></div><div className="form-footer"><button className="btn btn-primary">Save changes</button></div></motion.div>}
function ResumePanel(){const [file,setFile]=useState('Jordan_Lee_Resume.pdf');return <motion.div className="panel resume-panel motion-safe-enter" variants={reveal} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.15}}><div className="resume-preview"><FileText size={46}/><b>{file}</b><small>PDF document · Updated today</small></div><label className="upload-drop"><input type="file" accept=".pdf,.doc,.docx" onChange={e=>e.target.files?.[0]&&setFile(e.target.files[0].name)}/><Plus/> <b>Upload a new resume</b><span>PDF or DOCX, up to 10 MB</span></label><p>Your resume is only shared with employers when you apply to a role.</p></motion.div>}
function Notifications(){return <motion.div className="panel notifications-panel motion-safe-enter" variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.15}}>{[['You’ve been shortlisted!','Linear would love to meet you for the Product Designer role.','10 min ago'],['New roles picked for you','3 new design roles match your profile.','Yesterday'],['Application received','Notion received your application for Product Marketing Manager.','2 days ago']].map(([a,b,c],i)=><motion.div className="notification-item motion-safe-enter" key={a} variants={subtleReveal}><span className="notification-icon">{i===0?<Sparkles/>:i===1?<BriefcaseBusiness/>:<Check/>}</span><div><b>{a}</b><p>{b}</p><small>{c}</small></div><i className="unread-dot"/></motion.div>)}</motion.div>}
function Categories(){const [cats,setCats]=useState(['Design','Engineering','Marketing','Product','Data & analytics']);const [v,setV]=useState('');return <motion.div className="panel category-admin motion-safe-enter" variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.15}}><div className="panel-head"><div><b>Job categories</b><small>{cats.length} categories</small></div></div><div className="add-category"><input className="input" value={v} onChange={e=>setV(e.target.value)} placeholder="New category name"/><button className="btn btn-primary" onClick={()=>{if(v.trim()){setCats([...cats,v]);setV('')}}}><Plus size={16}/> Add category</button></div>{cats.map(c=><motion.div className="category-row motion-safe-enter" key={c} variants={subtleReveal}><span>✳</span><b>{c}</b><small>{(c.length*84)} active jobs</small><button onClick={()=>setCats(cats.filter(x=>x!==c))}>Remove</button></motion.div>)}</motion.div>}
function SettingsPanel(){return <motion.div className="panel settings-panel motion-safe-enter" variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.15}}>{[['Profile visibility','Let employers discover your profile'],['Job alerts','Get notified when matching roles are posted'],['Application updates','Receive updates about your applications'],['Weekly digest','A thoughtful roundup every Monday']].map(([a,b],i)=><motion.div className="setting-row motion-safe-enter" key={a} variants={subtleReveal}><span><b>{a}</b><small>{b}</small></span><input type="checkbox" defaultChecked={i!==3}/></motion.div>)}</motion.div>}

export function CompaniesPage(){const [q,setQ]=useState('');const comps=[['L','Linear','Software','New York, NY','51–200 employees','24 open roles','#5e6ad2'],['N','Notion','Productivity','San Francisco, CA','501–1,000 employees','18 open roles','#252525'],['▲','Vercel','Developer tools','Remote','201–500 employees','31 open roles','#111827'],['F','Figma','Design','San Francisco, CA','1,000+ employees','12 open roles','#a259ff'],['S','Stripe','Fintech','Remote','1,000+ employees','38 open roles','#635bff'],['W','Webflow','Software','Austin, TX','501–1,000 employees','16 open roles','#146ef5']];return <><Navbar/><main className="jobs-page"><div className="jobs-head"><div><div className="kicker">GOOD PEOPLE, GOOD PLACES</div><AnimatedHeading as="h1">Meet your <span className="serif-accent">future team.</span></AnimatedHeading><p>Get to know the companies building something worth being part of.</p></div></div><motion.div className="searchbar jobs-search motion-safe-enter" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.4}}><div className="search-field"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search companies or industries"/></div><button className="btn btn-primary" onClick={()=>{}}>Explore companies <ArrowRight size={16}/></button></motion.div><motion.div className="company-grid motion-safe-enter" variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.15}}>{comps.filter(c=>c[1].toLowerCase().includes(q.toLowerCase())||c[2].toLowerCase().includes(q.toLowerCase())).map(c=><motion.article className="company-card motion-safe-enter" key={c[1]} variants={subtleReveal}><div className="company-cover"/><div className="company-card-logo" style={{background:c[6]}}>{c[0]}</div><div className="company-card-content"><h3>{c[1]} <span className="verified"><Check size={12}/></span></h3><p>{c[2]} <i/> {c[3]}</p><div className="company-size"><Users size={14}/>{c[4]}</div><div className="company-card-bottom"><span>{c[5]}</span><Link href={`/companies/${c[1].toLowerCase()}`} className="text-link">View company <ArrowRight size={14}/></Link></div></div></motion.article>)}</motion.div></main><Footer/></>}
export function CompanyProfile({slug}:{slug:string}){const {jobs}=useJobZ();const company=decodeURIComponent(slug).replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());const roles=jobs.filter(j=>j.company.toLowerCase()===company.toLowerCase());return <><Navbar/><main className="jobs-page"><Link href="/companies" className="back-link">← All companies</Link><div className="company-profile-hero"><motion.span className="company-logo big" initial={{opacity:0,scale:0.94}} animate={{opacity:1,scale:1}} transition={{duration:0.35}}>{company[0]}</motion.span><div><div className="verified-label"><Check size={12}/> VERIFIED COMPANY</div><AnimatedHeading key={company} as="h1">{company}</AnimatedHeading><p>Product & technology · Building thoughtful tools for people everywhere</p></div><button className="btn btn-outline">♡ Follow company</button></div><div className="company-profile-columns"><motion.section className="panel company-about motion-safe-enter" variants={subtleReveal} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.2}}><h2>About {company}</h2><p>We’re a team of curious, collaborative people building products that help people do their best work. We value craft, clarity, and making a meaningful impact together.</p><h3>Our values</h3><div className="benefit-pills"><span>Thoughtful craft</span><span>People first</span><span>Room to grow</span></div></motion.section><aside className="summary-card"><b>Company at a glance</b><div><Users/><span><small>Company size</small>201–500 people</span></div><div><Building2/><span><small>Industry</small>Technology</span></div><div><MapPin/><span><small>Headquarters</small>Remote friendly</span></div></aside></div><div className="company-openings"><div className="section-heading"><div><div className="kicker">COME BUILD WITH US</div><h2>Open opportunities</h2></div><span>{roles.length||jobs.length} roles</span></div><motion.div className="company-role-list motion-safe-enter" variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.15}}>{(roles.length?roles:jobs.slice(0,3)).map(j=><motion.div className="company-role motion-safe-enter" key={j.id} variants={subtleReveal}><span className="company-logo" style={{background:j.color}}>{j.logo}</span><div><Link href={`/jobs/${j.id}`}><b>{j.title}</b></Link><small>{j.location} · {j.type}</small></div><Link href={`/jobs/${j.id}`} className="btn btn-outline btn-sm">View role <ArrowRight size={14}/></Link></motion.div>)}</motion.div></div></main><Footer/></>}
export function AboutPage(){return <><Navbar/><main><section className="about-hero"><div className="kicker">A BETTER WAY TO FIND YOUR FIT</div><AnimatedHeading as="h1">Work should feel like<br/><span className="serif-accent">a good next chapter.</span></AnimatedHeading><p>JobZ brings good people and thoughtful teams a little closer. Because the right work can change everything.</p></section><section className="about-values"><div><span>OUR MISSION</span><AnimatedHeading as="h2">Make meaningful work easier to find.</AnimatedHeading><p>We help people discover opportunities where their skills, values, and ambitions can thrive—and help good teams meet the people who will move them forward.</p></div><div><span>OUR VISION</span><AnimatedHeading as="h2">A working world where everyone can find their place.</AnimatedHeading><p>More transparency. Less noise. Better matches that create stronger teams and more fulfilling careers.</p></div></section><section className="about-stats"><div><b>48k+</b><span>people in our community</span></div><div><b>2.4k+</b><span>open opportunities</span></div><div><b>680</b><span>thoughtful hiring teams</span></div><div><b>4.9/5</b><span>candidate experience</span></div></section><div className="bottom-cta"><div><div className="kicker">GOOD WORK IS OUT THERE</div><AnimatedHeading as="h2">Let’s find what’s next.</AnimatedHeading><p>Your next chapter starts with one small step.</p></div><Link href="/register" className="btn btn-white">Join JobZ <ArrowRight size={16}/></Link></div></main><Footer/></>}
export function ContactPage(){const [sent,setSent]=useState(false);return <><Navbar/><main className="contact-page"><div className="contact-intro"><div className="kicker">WE’RE HERE FOR YOU</div><AnimatedHeading as="h1">Let’s talk about<br/><span className="serif-accent">what’s next.</span></AnimatedHeading><p>Big question or little hello, we’d love to hear from you.</p><div className="contact-detail"><span>✉</span><div><small>EMAIL US</small><b>hello@jobz.com</b></div></div><div className="contact-detail"><span>◷</span><div><small>RESPONSE TIME</small><b>Usually within one business day</b></div></div></div><form className="contact-form" onSubmit={e=>{e.preventDefault();setSent(true)}}><AnimatedHeading as="h2">Send us a note</AnimatedHeading><p>Tell us a little about what you need.</p><label>Your name<input required className="input" placeholder="Jordan Lee"/></label><label>Email address<input required type="email" className="input" placeholder="you@example.com"/></label><label>What can we help with?<select className="input"><option>General question</option><option>I'm looking for a job</option><option>I'm hiring</option><option>Something else</option></select></label><label>Your message<textarea className="input" required rows={4} placeholder="Write your message here…"/></label><button className="btn btn-primary btn-wide">{sent?'Message sent ✓':'Send message'} <ArrowRight size={16}/></button>{sent&&<small>Thanks for reaching out. We’ll be in touch soon.</small>}</form></main><Footer/></>}




