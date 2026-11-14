"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  FileText,
  Filter,
  Heart,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useJobZ } from "./provider";
import type { Job } from "@/data/jobs";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <Link href="/" className="brand">
        <span className="brandmark">j</span>jobz
        <span className="branddot">.</span>
      </Link>
      <nav className={open ? "navlinks open" : "navlinks"}>
        <Link href="/">Home</Link>
        <Link href="/jobs">Find jobs</Link>
        <Link href="/companies">Companies</Link>
        <a href="/about">About us</a>
        <Link href="/contact">Contact</Link>
        <div className="mobile-actions">
          <Link href="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </nav>
      <div className="navactions">
        <Link href="/login" className="navlogin">
          Log in
        </Link>
        <Link href="/register" className="btn btn-primary btn-sm">
          Get started <ArrowRight size={15} />
        </Link>
      </div>
      <button
        className="icon-btn hamburger"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Link href="/" className="brand footer-brand">
            <span className="brandmark">j</span>jobz
            <span className="branddot">.</span>
          </Link>
          <p>
            Good people deserve great work.
            <br />
            Let’s find yours.
          </p>
          <div className="socials">
            <span>in</span>
            <span>𝕏</span>
            <span>◎</span>
          </div>
        </div>
        <div>
          <b>For candidates</b>
          <Link href="/jobs">Browse jobs</Link>
          <Link href="/companies">Explore companies</Link>
          <Link href="/register">Create profile</Link>
        </div>
        <div>
          <b>For employers</b>
          <Link href="/employer/post-job">Post a job</Link>
          <Link href="/employer/dashboard">Employer dashboard</Link>
          <Link href="/contact">Talk to our team</Link>
        </div>
        <div>
          <b>JobZ</b>
          <Link href="/about">About us</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Demo sign in</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 JobZ, Inc. All rights reserved.</span>
        <span>Your Career. Your Future. Your JobZ.</span>
      </div>
    </footer>
  );
}

const jobsCount = "2,400+";
export function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> A better way to work
              <span className="eyebrow-line" /> Loved by 40,000+ professionals
            </div>
            <h1>
              Find work that
              <br />
              works <span className="serif-accent">for you.</span>
            </h1>
            <p className="hero-sub">
              Your next chapter starts here. Discover meaningful opportunities
              at companies that value what you bring.
            </p>
            <SearchBar />
            <div className="hero-foot">
              <div className="avatar-stack">
                <i>J</i>
                <i>M</i>
                <i>A</i>
                <i>+</i>
              </div>
              <span>
                <b>4,800+</b> people found their fit this month
              </span>
              <span className="hero-rating">
                ★★★★★ <small>4.9/5 candidate rating</small>
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-glow" />
            <div className="art-board">
              <div className="board-head">
                <span>YOUR NEXT CHAPTER</span>
                <span className="live-pill">● LIVE</span>
              </div>
              <div className="board-quote">
                “The right work
                <br />
                changes everything.”
              </div>
              <div className="board-line" />
              <div className="mini-role">
                <span
                  className="mini-logo"
                  style={{ background: "#e8eaff", color: "#5e6ad2" }}
                >
                  L
                </span>
                <div>
                  <b>Product Designer</b>
                  <small>Linear · Remote</small>
                </div>
                <span className="match">98% match</span>
              </div>
              <div className="mini-role">
                <span
                  className="mini-logo"
                  style={{ background: "#e7f8ef", color: "#16a34a" }}
                >
                  S
                </span>
                <div>
                  <b>Design Lead</b>
                  <small>Stripe · New York</small>
                </div>
                <span className="match">94% match</span>
              </div>
              <div className="board-bottom">
                <span>
                  <b>2,400+</b>
                  <small>open roles</small>
                </span>
                <span>
                  <b>680</b>
                  <small>hiring teams</small>
                </span>
                <span>
                  <b>Daily</b>
                  <small>new matches</small>
                </span>
              </div>
            </div>
            <div className="float-card float-top">
              <span className="float-check">
                <Check size={16} />
              </span>
              <div>
                <b>You’re a great fit!</b>
                <small>Product Designer · Linear</small>
              </div>
            </div>
            <div className="float-card float-bottom">
              <span className="float-spark">
                <Sparkles size={17} />
              </span>
              <div>
                <b>Opportunity found</b>
                <small>Just for your profile</small>
              </div>
              <ArrowRight size={16} />
            </div>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
          </div>
        </section>
        <section className="trust">
          <span>GOOD PEOPLE, GREAT TEAMS</span>
          <div className="trust-logos">
            <b>◈ linear</b>
            <b>◉ notion</b>
            <b>▲ Vercel</b>
            <b>◧ Webflow</b>
            <b>◉ stripe</b>
            <b>✳ Figma</b>
          </div>
        </section>
        <section className="section categories">
          <div className="section-heading">
            <div>
              <div className="kicker">A PLACE TO START</div>
              <h2>What do you want to do?</h2>
              <p>
                Explore roles in fields where your skills can make a difference.
              </p>
            </div>
            <Link className="text-link" href="/jobs">
              Explore all categories <ArrowRight size={16} />
            </Link>
          </div>
          <div className="category-grid">
            {[
              ["✳", "Design", "1,240 roles", "#f0edff"],
              ["⌘", "Engineering", "3,820 roles", "#eaf2ff"],
              ["↗", "Marketing", "960 roles", "#fff2e8"],
              ["▦", "Product", "780 roles", "#e9f8f2"],
              ["◎", "Customer success", "1,105 roles", "#fff0f5"],
              ["⌁", "Data & analytics", "640 roles", "#eff6ff"],
            ].map(([icon, title, count, bg]) => (
              <Link
                href={"/jobs?category=" + encodeURIComponent(title)}
                className="category-card"
                key={title}
              >
                <span className="category-icon" style={{ background: bg }}>
                  {icon}
                </span>
                <strong>{title}</strong>
                <small>{count}</small>
                <ArrowRight size={16} className="category-arrow" />
              </Link>
            ))}
          </div>
        </section>
        <section className="section featured">
          <div className="section-heading">
            <div>
              <div className="kicker">HAND-PICKED FOR YOU</div>
              <h2>A few good opportunities.</h2>
              <p>Thoughtful teams, meaningful work, room to grow.</p>
            </div>
            <Link className="text-link" href="/jobs">
              See all jobs <ArrowRight size={16} />
            </Link>
          </div>
          <div className="feature-grid">
            {["j1", "j2", "j3"].map((id) => (
              <JobCard key={id} id={id} />
            ))}
          </div>
        </section>
        <section className="why" id="about">
          <div className="why-left">
            <div className="kicker">WORK, WITH MORE MEANING</div>
            <h2>
              Not just your next job.
              <br />
              <span className="serif-accent">Your next chapter.</span>
            </h2>
            <p>
              We believe finding work should feel less like a search and more
              like finding your people. JobZ brings the right opportunities
              closer, so you can focus on what’s next.
            </p>
            <Link href="/register" className="btn btn-primary">
              Find your fit <ArrowRight size={16} />
            </Link>
          </div>
          <div className="why-points">
            <div>
              <span className="why-icon">✦</span>
              <div>
                <b>Made for your whole story</b>
                <p>
                  We look beyond keywords to help connect who you are with where
                  you can go.
                </p>
              </div>
            </div>
            <div>
              <span className="why-icon">◉</span>
              <div>
                <b>Good people, good places</b>
                <p>
                  Meet thoughtful teams building products and workplaces worth
                  showing up for.
                </p>
              </div>
            </div>
            <div>
              <span className="why-icon">↗</span>
              <div>
                <b>More clarity, less noise</b>
                <p>
                  Real salary ranges, honest expectations, and a job search that
                  respects your time.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="bottom-cta">
          <div>
            <div className="kicker">YOUR NEXT CHAPTER IS OUT THERE</div>
            <h2>Ready for work that feels right?</h2>
            <p>Join thousands finding a better fit with JobZ.</p>
          </div>
          <Link href="/register" className="btn btn-white">
            Create your free profile <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

function SearchBar() {
  const [q, setQ] = useState(""),
    [loc, setLoc] = useState("");
  return (
    <form className="searchbar" action="/jobs">
      <div className="search-field">
        <Search size={18} />
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Job title, skill, or company"
        />
      </div>
      <div className="search-divider" />
      <div className="search-field location-field">
        <MapPin size={18} />
        <input
          name="location"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          placeholder="City or remote"
        />
      </div>
      <button className="btn btn-primary" type="submit">
        Find a job <ArrowRight size={16} />
      </button>
    </form>
  );
}

export function JobCard({ id, job: custom }: { id?: string; job?: Job }) {
  const { jobs, saved, toggleSave } = useJobZ();
  const j = custom || jobs.find((x) => x.id === id) || jobs[0];
  return (
    <article className="job-card">
      <div className="job-card-top">
        <span className="company-logo" style={{ background: j.color }}>
          {j.logo}
        </span>
        <button
          onClick={() => toggleSave(j.id)}
          className={"save-btn " + (saved.includes(j.id) ? "saved" : "")}
          aria-label="Save job"
        >
          <Bookmark
            size={17}
            fill={saved.includes(j.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      {j.featured && <span className="featured-tag">FEATURED</span>}
      <h3>{j.title}</h3>
      <div className="job-company">
        {j.company}
        <span>·</span>
        {j.location}
      </div>
      <p className="job-desc">{j.description}</p>
      <div className="job-tags">
        <span>{j.type}</span>
        <span>{j.mode}</span>
      </div>
      <div className="job-card-bottom">
        <span className="salary">{j.salary}</span>
        <Link href={"/jobs/" + j.id} className="job-link">
          View role <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export function JobsPage() {
  const { jobs, saved, toggleSave, apply } = useJobZ();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") || ""),
    [loc, setLoc] = useState(sp.get("location") || ""),
    [category, setCategory] = useState(sp.get("category") || "All"),
    [type, setType] = useState("All types"),
    [mode, setMode] = useState("Any mode"),
    [sort, setSort] = useState("Recommended");
  const filtered = jobs.filter(
    (j) =>
      (category === "All" ||
        j.category.toLowerCase() === category.toLowerCase() ||
        category.toLowerCase().includes(j.category.toLowerCase())) &&
      (!query ||
        [j.title, j.company, j.category]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!loc || j.location.toLowerCase().includes(loc.toLowerCase())) &&
      (type === "All types" || j.type === type) &&
      (mode === "Any mode" || j.mode === mode),
  );
  return (
    <>
      <Navbar />
      <main className="jobs-page">
        <div className="jobs-head">
          <div>
            <div className="kicker">A BETTER FIT STARTS HERE</div>
            <h1>
              Find work that <span className="serif-accent">fits.</span>
            </h1>
            <p>Good opportunities, from teams you’ll be glad to join.</p>
          </div>
          <div className="jobs-count">
            <b>{filtered.length}</b>
            <span>open roles</span>
          </div>
        </div>
        <form
          className="searchbar jobs-search"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Role, company, or keyword"
            />
          </div>
          <div className="search-divider" />
          <div className="search-field">
            <MapPin size={18} />
            <input
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              placeholder="Location or remote"
            />
          </div>
          <button className="btn btn-primary">
            <Search size={16} /> Search
          </button>
        </form>
        <div className="jobs-layout">
          <aside className="filters">
            <div className="filter-title">
              <b>
                <Filter size={17} /> Filters
              </b>
              <button
                onClick={() => {
                  setCategory("All");
                  setType("All types");
                  setMode("Any mode");
                  setQuery("");
                  setLoc("");
                }}
              >
                Clear all
              </button>
            </div>
            <label className="filter-label">
              CATEGORY
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>All</option>
                {Array.from(new Set(jobs.map((j) => j.category))).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="filter-label">
              JOB TYPE
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {[
                  "All types",
                  "Full-time",
                  "Part-time",
                  "Contract",
                  "Internship",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="filter-label">
              WORK STYLE
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                {["Any mode", "Remote", "Hybrid", "On-site"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <div className="filter-label">SALARY RANGE</div>
            <div className="salary-range">
              <input type="range" min="0" max="200" defaultValue="90" />
              <div>
                <span>$0k</span>
                <span>$200k+</span>
              </div>
            </div>
            <div className="filter-note">
              <Sparkles size={16} />
              <span>
                <b>A little more you.</b>
                <br />
                Create a profile to get roles picked for you.
              </span>
            </div>
          </aside>
          <section className="job-results">
            <div className="results-top">
              <span>
                Showing <b>{filtered.length} opportunities</b>
              </span>
              <label>
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option>Recommended</option>
                  <option>Latest</option>
                  <option>Oldest</option>
                </select>
              </label>
            </div>
            {filtered.length ? (
              <div className="results-list">
                {filtered.map((j) => (
                  <article className="result-card" key={j.id}>
                    <span
                      className="company-logo"
                      style={{ background: j.color }}
                    >
                      {j.logo}
                    </span>
                    <div className="result-main">
                      <div className="result-title-row">
                        <Link href={"/jobs/" + j.id}>
                          <h3>{j.title}</h3>
                        </Link>
                        {j.featured && (
                          <span className="featured-tag">FEATURED</span>
                        )}
                      </div>
                      <div className="job-company">
                        {j.company}
                        <span>·</span>
                        {j.location}
                        <span>·</span>
                        {j.posted}
                      </div>
                      <p>{j.description}</p>
                      <div className="job-tags">
                        <span>{j.type}</span>
                        <span>{j.mode}</span>
                        <span>{j.category}</span>
                      </div>
                      <div className="salary">{j.salary}</div>
                    </div>
                    <div className="result-actions">
                      <button
                        onClick={() => toggleSave(j.id)}
                        className={
                          "save-btn " + (saved.includes(j.id) ? "saved" : "")
                        }
                      >
                        <Bookmark
                          size={17}
                          fill={saved.includes(j.id) ? "currentColor" : "none"}
                        />
                      </button>
                      <Link
                        href={"/jobs/" + j.id}
                        className="btn btn-outline btn-sm"
                      >
                        View role
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={28} />
                <h3>No roles found yet</h3>
                <p>Try adjusting your filters or broadening your search.</p>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setCategory("All");
                    setType("All types");
                    setMode("Any mode");
                    setQuery("");
                    setLoc("");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function JobDetail({ id }: { id: string }) {
  const { jobs, saved, toggleSave, apply } = useJobZ();
  const [modal, setModal] = useState(false);
  const job = jobs.find((x) => x.id === id) || jobs[0];
  return (
    <>
      <Navbar />
      <main className="detail-page">
        <Link href="/jobs" className="back-link">
          ← All opportunities
        </Link>
        <div className="detail-grid">
          <section>
            <div className="detail-company">
              <span
                className="company-logo big"
                style={{ background: job.color }}
              >
                {job.logo}
              </span>
              <div>
                <h1>{job.title}</h1>
                <p>
                  {job.company} <span>·</span> {job.location}
                </p>
              </div>
            </div>
            <div className="detail-actions">
              <button
                className="btn btn-primary"
                onClick={() => setModal(true)}
              >
                Apply for this role <ArrowRight size={16} />
              </button>
              <button
                className={
                  "btn btn-outline " + (saved.includes(job.id) ? "saved" : "")
                }
                onClick={() => toggleSave(job.id)}
              >
                <Bookmark size={16} />
                {saved.includes(job.id) ? "Saved" : "Save role"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  navigator.clipboard?.writeText(location.href);
                  alert("Link copied to clipboard");
                }}
              >
                Share
              </button>
            </div>
            <div className="detail-content">
              <h2>About this role</h2>
              <p>
                {job.description} You’ll work closely with a thoughtful,
                collaborative team to make a meaningful impact. We value craft,
                curiosity, and people who care about doing great work together.
              </p>
              <h3>What you’ll do</h3>
              <ul>
                <li>
                  Build and improve experiences that solve real customer
                  problems.
                </li>
                <li>
                  Collaborate across a kind, ambitious, and highly capable team.
                </li>
                <li>Bring thoughtful ideas from discovery through delivery.</li>
                <li>Help us make our product and team better every day.</li>
              </ul>
              <h3>What you’ll bring</h3>
              <ul>
                <li>
                  Relevant experience in {job.category.toLowerCase()} or a
                  related field.
                </li>
                <li>Clear communication and a collaborative working style.</li>
                <li>
                  Comfort with ambiguity and a bias toward thoughtful action.
                </li>
              </ul>
              <h3>About {job.company}</h3>
              <p>
                {job.company} is a team of curious people building products that
                make work more meaningful. We care deeply about our craft, our
                customers, and the way we work together.
              </p>
              <h3>Benefits</h3>
              <div className="benefit-pills">
                <span>Health coverage</span>
                <span>Flexible time off</span>
                <span>Learning budget</span>
                <span>Remote friendly</span>
              </div>
            </div>
          </section>
          <aside className="detail-sidebar">
            <div className="summary-card">
              <b>At a glance</b>
              <div>
                <Clock3 />
                <span>
                  <small>Employment</small>
                  {job.type}
                </span>
              </div>
              <div>
                <MapPin />
                <span>
                  <small>Location</small>
                  {job.location}
                </span>
              </div>
              <div>
                <BriefcaseBusiness />
                <span>
                  <small>Work style</small>
                  {job.mode}
                </span>
              </div>
              <div>
                <Zap />
                <span>
                  <small>Compensation</small>
                  {job.salary}
                </span>
              </div>
              <div>
                <Compass />
                <span>
                  <small>Experience</small>Mid – Senior level
                </span>
              </div>
              <button
                className="btn btn-primary btn-wide"
                onClick={() => setModal(true)}
              >
                Apply now <ArrowRight size={16} />
              </button>
            </div>
            <div className="help-card">
              <CircleHelp />
              <b>Questions about the role?</b>
              <p>Reach out to the hiring team directly.</p>
              <a href="mailto:careers@example.com">Contact the team →</a>
            </div>
          </aside>
        </div>
      </main>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(false)}>
              <X />
            </button>
            <div className="kicker">MAKE YOUR NEXT MOVE</div>
            <h2>Apply to {job.company}</h2>
            <p>
              Applying for <b>{job.title}</b>. Add a quick note to introduce
              yourself.
            </p>
            <textarea placeholder="A few words about why this role feels right for you…" />
            <label className="upload-label">
              <FileText /> Add a resume
              <input type="file" accept=".pdf,.doc,.docx" />
            </label>
            <button
              className="btn btn-primary btn-wide"
              onClick={() => {
                apply(job);
                setModal(false);
              }}
            >
              Send application <ArrowRight size={16} />
            </button>
            <small className="modal-foot">
              Your information stays private and is only shared with this
              employer.
            </small>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
