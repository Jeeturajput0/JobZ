"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { AnimatedHeading } from "./animations/AnimatedHeading";
import { quickSpring, reveal, stagger, subtleReveal } from "@/lib/motion";

const MotionLink = motion.create(Link);

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <motion.header className="nav motion-safe-enter" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
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
    </motion.header>
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
          <b className="text-lg font-bold">For candidates</b>
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
      <main className="motion-safe-enter">
        <section className="hero">
          <div className="hero-content">
            <motion.div className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}>
              <span className="eyebrow-dot" /> A better way to work
              <span className="eyebrow-line" /> Loved by 40,000+ professionals
            </motion.div>
            <AnimatedHeading as="h1">
              Find work that
              <br />
              works <span className="serif-accent">for you.</span>
            </AnimatedHeading>
            <motion.p className="hero-sub motion-safe-enter" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              Your next chapter starts here. Discover meaningful opportunities
              at companies that value what you bring.
            </motion.p>
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
          <motion.div className="hero-art motion-safe-enter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}>
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
          </motion.div>
        </section>
        <section className="trust">
          <span>GOOD PEOPLE, GREAT TEAMS</span>
          <motion.div className="trust-logos motion-safe-enter" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, staggerChildren: 0.06 }}>
            <motion.b className="motion-safe-enter" variants={subtleReveal}>◈ linear</motion.b>
            <motion.b className="motion-safe-enter" variants={subtleReveal}>◉ notion</motion.b>
            <motion.b className="motion-safe-enter" variants={subtleReveal}>▲ Vercel</motion.b>
            <motion.b className="motion-safe-enter" variants={subtleReveal}>◧ Webflow</motion.b>
            <motion.b className="motion-safe-enter" variants={subtleReveal}>◉ stripe</motion.b>
            <motion.b className="motion-safe-enter" variants={subtleReveal}>✳ Figma</motion.b>
          </motion.div>
        </section>
        <section className="section categories">
          <div className="section-heading">
            <div>
              <div className="kicker">A PLACE TO START</div>
              <AnimatedHeading as="h2">What do you want to do?</AnimatedHeading>
              <p>
                Explore roles in fields where your skills can make a difference.
              </p>
            </div>
            <Link className="text-link" href="/jobs">
              Explore all categories <ArrowRight size={16} />
            </Link>
          </div>
          <motion.div className="category-grid motion-safe-enter" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {[
              ["✳", "Design", "1,240 roles", "#f0edff"],
              ["⌘", "Engineering", "3,820 roles", "#eaf2ff"],
              ["↗", "Marketing", "960 roles", "#fff2e8"],
              ["▦", "Product", "780 roles", "#e9f8f2"],
              ["◎", "Customer success", "1,105 roles", "#fff0f5"],
              ["⌁", "Data & analytics", "640 roles", "#eff6ff"],
            ].map(([icon, title, count, bg]) => (
              <MotionLink
                href={"/jobs?category=" + encodeURIComponent(title)}
                className="category-card motion-safe-enter"
                key={title}
                variants={subtleReveal}
              >
                <span className="category-icon" style={{ background: bg }}>
                  {icon}
                </span>
                <strong>{title}</strong>
                <small>{count}</small>
                <ArrowRight size={16} className="category-arrow" />
              </MotionLink>
            ))}
          </motion.div>
        </section>
        <section className="section featured">
          <div className="section-heading">
            <div>
              <div className="kicker">HAND-PICKED FOR YOU</div>
              <AnimatedHeading as="h2">A few good opportunities.</AnimatedHeading>
              <p>Thoughtful teams, meaningful work, room to grow.</p>
            </div>
            <Link className="text-link" href="/jobs">
              See all jobs <ArrowRight size={16} />
            </Link>
          </div>
          <motion.div className="feature-grid motion-safe-enter" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
            {["j1", "j2", "j3"].map((id) => (
              <JobCard key={id} id={id} staggered />
            ))}
          </motion.div>
        </section>
        <section className="why" id="about">
          <div className="why-left">
            <div className="kicker">WORK, WITH MORE MEANING</div>
            <AnimatedHeading as="h2">
              Not just your next job.
              <br />
              <span className="serif-accent">Your next chapter.</span>
            </AnimatedHeading>
            <p>
              We believe finding work should feel less like a search and more
              like finding your people. JobZ brings the right opportunities
              closer, so you can focus on what’s next.
            </p>
            <Link href="/register" className="btn btn-primary">
              Find your fit <ArrowRight size={16} />
            </Link>
          </div>
          <motion.div className="why-points motion-safe-enter" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <motion.div className="motion-safe-enter" variants={subtleReveal}>
              <span className="why-icon">✦</span>
              <div>
                <b>Made for your whole story</b>
                <p>
                  We look beyond keywords to help connect who you are with where
                  you can go.
                </p>
              </div>
            </motion.div>
            <motion.div className="motion-safe-enter" variants={subtleReveal}>
              <span className="why-icon">◉</span>
              <div>
                <b>Good people, good places</b>
                <p>
                  Meet thoughtful teams building products and workplaces worth
                  showing up for.
                </p>
              </div>
            </motion.div>
            <motion.div className="motion-safe-enter" variants={subtleReveal}>
              <span className="why-icon">↗</span>
              <div>
                <b>More clarity, less noise</b>
                <p>
                  Real salary ranges, honest expectations, and a job search that
                  respects your time.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </section>
        <motion.section className="bottom-cta motion-safe-enter" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
          <div>
            <div className="kicker">YOUR NEXT CHAPTER IS OUT THERE</div>
            <AnimatedHeading as="h2">Ready for work that feels right?</AnimatedHeading>
            <p>Join thousands finding a better fit with JobZ.</p>
          </div>
          <Link href="/register" className="btn btn-white">
            Create your free profile <ArrowRight size={16} />
          </Link>
        </motion.section>
      </main>
      <Footer />
    </>
  );
}

function SearchBar() {
  const [q, setQ] = useState(""),
    [loc, setLoc] = useState("");
  return (
    <motion.form className="searchbar motion-safe-enter" action="/jobs" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>
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
    </motion.form>
  );
}

export function JobCard({ id, job: custom, staggered = false }: { id?: string; job?: Job; staggered?: boolean }) {
  const { jobs, saved, toggleSave } = useJobZ();
  const j = custom || jobs.find((x) => x.id === id) || jobs[0];
  return (
    <motion.article className="job-card motion-safe-enter" variants={subtleReveal} {...(!staggered && { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.18 } })} whileHover={{ y: -3 }}>
      <div className="job-card-top">
        <span className="company-logo" style={{ background: j.color }}>
          {j.logo}
        </span>
        <motion.button
          onClick={() => toggleSave(j.id)}
          className={"save-btn " + (saved.includes(j.id) ? "saved" : "")}
          aria-label="Save job"
          whileTap={{ scale: 0.88 }}
          transition={quickSpring}
        >
          <Bookmark
            size={17}
            fill={saved.includes(j.id) ? "currentColor" : "none"}
          />
        </motion.button>
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
    </motion.article>
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
  const animatedResultIds = useRef(new Set<string>());
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
  useEffect(() => {
    filtered.forEach((job) => animatedResultIds.current.add(job.id));
  }, [filtered]);
  return (
    <>
      <Navbar />
      <main className="jobs-page">
        <div className="jobs-head">
          <div>
            <div className="kicker">A BETTER FIT STARTS HERE</div>
            <AnimatedHeading as="h1">
              Find work that <span className="serif-accent">fits.</span>
            </AnimatedHeading>
            <p>Good opportunities, from teams you’ll be glad to join.</p>
          </div>
          <div className="jobs-count">
            <b>{filtered.length}</b>
            <span>open roles</span>
          </div>
        </div>
        <motion.form
          className="searchbar jobs-search motion-safe-enter"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
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
        </motion.form>
        <div className="jobs-layout">
          <motion.aside className="filters motion-safe-enter" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.06 }}>
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
          </motion.aside>
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
                {filtered.map((j, index) => {
                  const shouldAnimate = !animatedResultIds.current.has(j.id);
                  animatedResultIds.current.add(j.id);
                  return (
                  <motion.article
                    className="result-card motion-safe-enter"
                    key={j.id}
                    initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: shouldAnimate ? Math.min(index * 0.035, 0.14) : 0 }}
                  >
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
                  </motion.article>
                  );
                })}
              </div>
            ) : (
              <motion.div className="empty-state motion-safe-enter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
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
              </motion.div>
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
                <AnimatedHeading as="h1">{job.title}</AnimatedHeading>
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
      <AnimatePresence>
      {modal && (
        <motion.div className="modal-backdrop motion-safe-enter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(false)}>
          <motion.div className="modal" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()}>
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      <Footer />
    </>
  );
}
