"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CircleHelp,
  Clock3,
  Compass,
  MapPin,
  X,
  Zap,
} from "lucide-react";
import { useJobZ } from "./provider";
import { toJob, type ApiJob, type Job } from "@/data/jobs";
import { AnimatedHeading } from "./animations/AnimatedHeading";
import { quickSpring, subtleReveal } from "@/lib/motion";

export { HomePage } from "./home/HomePage";
export { JobsSearchPage as JobsPage } from "./jobs/jobs-page";

export function JobCard({ id, job: custom, staggered = false, homeCard = false }: { id?: string; job?: Job; staggered?: boolean; homeCard?: boolean }) {
  const { jobs, saved, toggleSave } = useJobZ();
  const j = custom || jobs.find((x) => x.id === id);
  if (!j) return null;
  return (
    <motion.article className={`job-card [&_:hover]:[transform:translateY(-3px)] [&_:hover]:[box-shadow:0_14px_35px_#172d4c0d] [&_:hover]:[border-color:#c9e3d7] [border:1px_solid_#ebeff3] [border-radius:.75rem] [padding:20px] [transition:all_.2s] [position:relative] [background:white] [&_h3]:[font-size:18px] [&_h3]:[letter-spacing:-.025em] [&_h3]:[color:#233b5d] [&_h3]:[margin:0_0_8px] [&_h3]:[line-height:1.4] [border-color:#E5ECE8] [&_h3]:[display:-webkit-box] [&_h3]:[overflow:hidden] [&_h3]:[min-height:50px] [&_h3]:[-webkit-box-orient:vertical] [&_h3]:[-webkit-line-clamp:2] flex flex-col [.job-card_&]:[display:flex] [.job-card_&]:[flex-direction:column] [.job-card_&]:[height:100%] motion-safe-enter [@media(scripting:none)]:[opacity:1!important] [@media(scripting:none)]:[filter:none!important] [@media(scripting:none)]:[transform:none!important]${homeCard ? " home-job-card [.home-featured_&]:[min-height:380px] [.home-featured_&]:[padding:23px] [.home-featured_&]:[border-color:#E5ECE8] [.home-featured_&]:[border-radius:16px] [.home-featured_&]:[box-shadow:0_5px_20px_rgb(24_45_77_/_4%)] [&_:hover]:[border-color:#c9e3d7] [&_:hover]:[box-shadow:0_18px_40px_rgb(24_45_77_/_9%)] max-[600px]:[.home-featured_&]:[min-height:360px] max-[600px]:[.home-featured_&]:[padding:20px]" : ""}`} variants={subtleReveal} {...(!staggered && { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.18 } })} whileHover={{ y: -3 }}>
      <div className="job-card-top [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:15px] [.home-featured_&]:[margin-bottom:17px]">
        <span className="company-logo [display:grid] [place-items:center] [width:42px] [height:42px] [border-radius:11px] [color:#fff] [font-weight:700] [font-size:17px] max-[700px]:[.result-card>_&]:[width:36px] max-[700px]:[.result-card>_&]:[height:36px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[width:52px] [.home-featured_&]:[height:52px] [.home-featured_&]:[border:1px_solid_#edf0f5] [.home-featured_&]:[border-radius:14px] [.home-featured_&]:[font-size:18px] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:contain] [&_img]:[padding:4px] [&_img]:[background:#fff] [background:#3FA47B]" >
          {j.logoUrl ? <img src={j.logoUrl} alt={`${j.company} logo`} /> : j.logo}
        </span>
        <motion.button
          onClick={() => toggleSave(j.id)}
          className={"save-btn [border:0] [background:transparent] [color:#9aa5b4] [padding:7px] [border-radius:7px] [&_:hover]:[color:#5570d3] [&_:hover]:[background:#f1f3ff] [.result-actions_&]:[border:1px_solid_#ebeff3] [transition-duration:180ms] [transition-timing-function:ease-out] [transition-property:transform,_color,_background-color] [&_:active]:[transform:scale(.9)] motion-reduce:[transition-duration:.01ms!important] " + (saved.includes(j.id) ? "saved [color:#267653] [background:#EAF5F0] [border-color:#3FA47B]" : "")}
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
      {j.featured && <span className="featured-tag [font-size:.75rem] [letter-spacing:.8px] [color:#267653] [background:#EAF5F0] [border-radius:4px] [padding:5px_7px] [display:inline-block] [margin-bottom:9px] [font-weight:700] [.result-title-row_&]:[margin:0] [line-height:1.35] [border-color:#c9e3d7]">FEATURED</span>}
      <h3 className="text-lg font-semibold text-[#172B25]">{j.title}</h3>
      <div className="job-company [display:flex] [gap:7px] [align-items:center] [color:#7f8a99] [font-size:11px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[color:#708098] [.home-featured_&]:[font-size:13px] [.home-featured_&]:[text-overflow:ellipsis] [.home-featured_&]:[white-space:nowrap]">
        {j.company}
        <span>·</span>
        {j.location}
      </div>
      <p className="job-desc [font-size:.875rem] [color:#8490a0] [line-height:1.6] [margin:14px_0] [display:-webkit-box] [overflow:hidden] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [line-clamp:3] [.home-featured_&]:[min-height:70px] [.home-featured_&]:[margin:15px_0_17px] [.home-featured_&]:[color:#758399] [.home-featured_&]:[font-size:13px] [.home-featured_&]:[line-height:1.7]">{j.shortDescription || j.description}</p>
      <div className="job-tags [display:flex] [gap:7px] [flex-wrap:wrap] [&_span]:[padding:7px_9px] [&_span]:[border-radius:7px] [&_span]:[background:#F7F9F8] [&_span]:[color:#52645c] [&_span]:[font-size:11px] [.result-main_&]:[margin-bottom:10px] [&_span]:[line-height:1.5] [.home-featured_&]:[gap:8px] [&_span]:[border:1px_solid_#e9edf3] [&_span]:[border-color:#E5ECE8]">
        <span>{j.type}</span>
        <span>{j.mode}</span>
      </div>
      <div className="job-card-bottom [display:flex] [justify-content:space-between] [align-items:center] [border-top:1px_solid_#eff1f4] [padding-top:13px] [margin-top:17px] [.home-featured_&]:[margin-top:auto] [.home-featured_&]:[padding-top:16px] [.home-featured_&]:[border-color:#edf0f4] mt-auto [margin-top:auto]">
        <span className="salary [color:#364b6b] [font-weight:700] [font-size:14px] [line-height:1.5] [.home-featured_&]:[color:#267653] [.home-featured_&]:[font-size:14px]">{j.salary}</span>
        <Link href={"/jobs/" + j.id} className="job-link [display:flex] [align-items:center] [gap:5px] [font-size:14px] [color:#328A66] [font-weight:600] [line-height:1.5] [transition-duration:180ms] [transition-timing-function:ease-out] motion-reduce:[transition-duration:.01ms!important] [.home-featured_&]:[gap:6px] [.home-featured_&]:[color:#328A66] [.home-featured_&]:[font-size:13px] [&_:hover]:[color:#267653]">
          View role <ArrowRight size={15} />
        </Link>
      </div>
    </motion.article>
  );
}

export function JobDetail({ id }: { id: string }) {
  const { jobs: allJobs, saved, toggleSave, apply } = useJobZ();
  const [job, setJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState("");
  const [modal, setModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    let current = true;

    async function loadJob() {
      setJob(null);
      setJobError("");
      try {
        const response = await fetch(`/api/jobs/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Could not load this job.");
        }
        if (current) setJob(toJob(result.job as ApiJob));
      } catch (error) {
        if (current) {
          setJobError(
            error instanceof Error ? error.message : "Could not load this job.",
          );
        }
      }
    }

    void loadJob();
    return () => {
      current = false;
    };
  }, [id]);

  if (!job) {
    return (
      <>
        
        <main className="detail-page [max-width:1100px] [margin:auto] [padding:32px_30px_90px] max-[700px]:[padding:2rem_20px_4rem] [padding-top:clamp(2rem,_5vw,_3.75rem)] max-[420px]:[padding-left:16px] max-[420px]:[padding-right:16px]" aria-live="polite">
          {jobError ? jobError : "Loading job details…"}
          {jobError && <p className="text-sm leading-6 text-[#71817A]"><Link href="/jobs">Browse all jobs</Link></p>}
        </main>
        
      </>
    );
  }
  return (
    <>
      
      <main className="detail-page [max-width:1100px] [margin:auto] [padding:32px_30px_90px] max-[700px]:[padding:2rem_20px_4rem] [padding-top:clamp(2rem,_5vw,_3.75rem)] max-[420px]:[padding-left:16px] max-[420px]:[padding-right:16px]">
        <Link href="/jobs" className="back-link [display:block] [color:#6e7c91] [font-size:14px] [margin:5px_0_24px] [.auth-form>_&]:[margin-bottom:45px] [&_)]:[color:#328A66] max-[700px]:[.auth-form>_&]:[margin-bottom:35px] [line-height:1.5] [&_):hover]:[color:#267653]">
          ← All opportunities
        </Link>
        <div className="detail-grid [display:grid] [grid-template-columns:1fr_300px] [gap:42px] max-[700px]:[grid-template-columns:1fr] max-[700px]:[gap:20px]">
          <section>
            <div className="detail-company [display:flex] [align-items:center] [gap:16px] [&_h1]:[margin:0_0_6px] [&_h1]:[font-size:clamp(1.75rem,_3vw,_2.25rem)] [&_h1]:[letter-spacing:-.7px] [&_h1]:[color:#253a59] [&_p]:[color:#7d8999] [&_p]:[margin:0] [&_p]:[font-size:14px] [&_p_span]:[margin:0_5px] max-[700px]:[align-items:flex-start] max-[700px]:[&_h1]:[font-size:21px] [&_h1]:[line-height:1.2] [&_p]:[line-height:1.5]">
              <span
                className="company-logo [display:grid] [place-items:center] [width:42px] [height:42px] [border-radius:11px] [color:#fff] [font-weight:700] [font-size:17px] max-[700px]:[.result-card>_&]:[width:36px] max-[700px]:[.result-card>_&]:[height:36px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[width:52px] [.home-featured_&]:[height:52px] [.home-featured_&]:[border:1px_solid_#edf0f5] [.home-featured_&]:[border-radius:14px] [.home-featured_&]:[font-size:18px] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:contain] [&_img]:[padding:4px] [&_img]:[background:#fff] [background:#3FA47B] big [width:58px] [height:58px] [font-size:23px]"
                
              >
                {job.logo}
              </span>
              <div>
                <AnimatedHeading as="h1">{job.title}</AnimatedHeading>
                <p className="text-sm leading-6 text-[#71817A]">
                  {job.company} <span>·</span> {job.location}
                </p>
              </div>
            </div>
            <div className="detail-actions [display:flex] [gap:9px] [padding:24px_0] [border-bottom:1px_solid_#eff1f4] max-[700px]:[flex-wrap:wrap]">
              <button
                className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)]"
                onClick={() => setModal(true)}
              >
                Apply for this role <ArrowRight size={16} />
              </button>
              <button
                className={
                  "btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc] " + (saved.includes(job.id) ? "saved [color:#267653] [background:#EAF5F0] [border-color:#3FA47B]" : "")
                }
                onClick={() => toggleSave(job.id)}
              >
                <Bookmark size={16} />
                {saved.includes(job.id) ? "Saved" : "Save role"}
              </button>
              <button
                className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc]"
                onClick={() => {
                  navigator.clipboard?.writeText(location.href);
                  alert("Link copied to clipboard");
                }}
              >
                Share
              </button>
            </div>
            <div className="detail-content [padding-top:10px] [color:#69778a] [font-size:16px] [line-height:1.65] [&_h2]:[color:#2a3f5d] [&_h3]:[color:#2a3f5d] [&_h2]:[font-size:1.25rem] [&_h2]:[margin:17px_0_10px] [&_h3]:[font-size:var(--type-subheading)] [&_h3]:[margin:25px_0_7px] [&_ul]:[padding-left:20px] [&_li]:[padding:3px_0] [&_h2]:[line-height:1.3] [&_h3]:[line-height:1.4]">
              <h2 className="text-2xl font-semibold tracking-tight text-[#172B25]">About this role</h2>
              <p className="text-sm leading-6 text-[#71817A]">{job.description}</p>
              {!!job.responsibilities?.length && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">What you’ll do</h3>
                  <ul>{job.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
                </>
              )}
              {!!job.requirements?.length && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">What you’ll bring</h3>
                  <ul>{job.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
                </>
              )}
              {!!job.skills?.length && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">Skills for this role</h3>
                  <div className="flex flex-wrap gap-2">{job.skills.map((skill) => <span key={skill} className="rounded-full border border-[#E5ECE8] bg-[#F7F9F8] px-3 py-1.5 text-sm text-[#52645c]">{skill}</span>)}</div>
                </>
              )}
              {job.companyDescription && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">About {job.company}</h3>
                  <p className="text-sm leading-6 text-[#71817A]">{job.companyDescription}</p>
                </>
              )}
              {!!job.benefits?.length && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">Benefits</h3>
                  <div className="benefit-pills [display:flex] [gap:8px] [flex-wrap:wrap] [&_span]:[border:1px_solid_#e8ecf1] [&_span]:[padding:7px_10px] [&_span]:[border-radius:5px] [&_span]:[font-size:14px] [&_span]:[line-height:1.5]">
                    {job.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}
                  </div>
                </>
              )}
            </div>
          </section>
          <aside className="detail-sidebar max-[700px]:[grid-row:1] [&>_*]:[background-color:#fff] [&>_*]:[border-color:#E5ECE8]">
            <div className="summary-card [border:1px_solid_#e9edf2] [border-radius:.75rem] [padding:18px] [&>b]:[font-size:21px] [&>div]:[display:flex] [&>div]:[gap:11px] [&>div]:[align-items:center] [&>div]:[padding:15px_0] [&>div]:[border-bottom:1px_solid_#eff1f4] [&>div]:[color:#6780b8] [&>div_svg]:[width:17px] [&>div_span]:[display:grid] [&>div_span]:[gap:4px] [&>div_span]:[font-size:14px] [&>div_span]:[color:#42536d] [&>div_small]:[font-size:14px] [&>div_small]:[color:#8d98a7] max-[700px]:[display:grid] max-[700px]:[grid-template-columns:1fr_1fr] max-[700px]:[gap:0_10px] max-[700px]:[&>b]:[grid-column:1/-1] max-[700px]:[&>div]:[border:0] [&>b]:[line-height:1.35] [&>div_span]:[line-height:1.5] [&>div_small]:[line-height:1.5] [border-color:#E5ECE8] [background-color:#fff] [&>_div]:[color:#328A66] [background:#fff]">
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
                  <small>Experience</small>{job.experienceLevel || "Not specified"}
                </span>
              </div>
              {job.applicationDeadline && <div>
                <Clock3 />
                <span><small>Apply by</small>{new Date(job.applicationDeadline).toLocaleDateString()}</span>
              </div>}
              <button
                className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)] btn-wide [width:100%]"
                onClick={() => setModal(true)}
              >
                Apply now <ArrowRight size={16} />
              </button>
            </div>
            <div className="help-card [border:1px_solid_#e9edf2] [border-radius:.75rem] [padding:18px] [margin-top:13px] [background:#f8f9fc] [&>svg]:[color:#6279c9] [&_b]:[display:block] [&_b]:[margin:9px_0_5px] [&_b]:[font-size:12px] [&_p]:[font-size:16px] [&_p]:[color:#8792a2] [&_a]:[color:#328A66] [&_a]:[font-size:14px] [&_a]:[font-weight:600] max-[700px]:[display:none] [&_p]:[line-height:1.65] [&_a]:[line-height:1.5] [border-color:#E5ECE8] [&_a:hover]:[color:#267653] [&>_svg]:[color:#328A66]">
              <CircleHelp />
              <b>Questions about JobZ?</b>
              <p className="text-sm leading-6 text-[#71817A]">Contact our support team for help with your application.</p>
              <Link href="/contact">Contact support →</Link>
            </div>
          </aside>
        </div>
      </main>
      {allJobs.some((related) => related.id !== job.id && related.category === job.category) && <section aria-labelledby="related-jobs" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#328A66]">Keep exploring</p><h2 id="related-jobs" className="mt-2 text-2xl font-semibold tracking-tight text-[#172B25]">Related opportunities</h2></div>
          <Link href="/jobs" className="text-sm font-semibold text-[#328A66] hover:text-[#267653]">Browse all jobs</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{allJobs.filter((related) => related.id !== job.id && related.category === job.category).slice(0, 3).map((related) => <JobCard key={related.id} job={related} homeCard />)}</div>
      </section>}
      <AnimatePresence>
      {modal && (
        <motion.div className="modal-backdrop [position:fixed] [inset:0] [background:#10213a88] [z-index:20] [display:grid] [place-items:center] [padding:20px] motion-safe-enter [@media(scripting:none)]:[opacity:1!important] [@media(scripting:none)]:[filter:none!important] [@media(scripting:none)]:[transform:none!important]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(false)}>
          <motion.div className="modal [position:relative] [background:#fff] [border-radius:14px] [padding:30px] [width:min(475px,100%)] [box-shadow:0_25px_90px_#101d3933] [&_h2]:[font-size:var(--type-card-heading)] [&_h2]:[color:#263b5a] [&_h2]:[margin:3px_0_8px] [&>p]:[color:#7c8999] [&>p]:[font-size:16px] [&>p]:[line-height:1.65] [&_textarea]:[width:100%] [&_textarea]:[height:95px] [&_textarea]:[resize:vertical] [&_textarea]:[padding:11px] [&_textarea]:[border:1px_solid_#e5e9ee] [&_textarea]:[border-radius:7px] [&_textarea]:[margin:10px_0] [&_h2]:[line-height:1.3] [background-color:#fff] [border-color:#E5ECE8]" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close [position:absolute] [right:15px] [top:15px] [background:white] [border:0] [color:#8793a1]" onClick={() => setModal(false)}>
              <X />
            </button>
            <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">MAKE YOUR NEXT MOVE</div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#172B25]">Apply to {job.company}</h2>
            <p className="text-sm leading-6 text-[#71817A]">
              Applying for <b>{job.title}</b>. Add a quick note to introduce
              yourself.
            </p>
            <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">Cover letter<textarea className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" value={coverLetter} onChange={(event)=>setCoverLetter(event.target.value)} maxLength={10000} placeholder="Introduce yourself to the employer" /></label>
            <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">Resume URL (optional)<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" type="url" value={resumeUrl} onChange={(event)=>setResumeUrl(event.target.value)} placeholder="https://…" /></label>
            <button
              className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)] btn-wide [width:100%]"
              onClick={() => {
                apply(job, { coverLetter, resumeUrl });
                setModal(false);
              }}
            >
              Send application <ArrowRight size={16} />
            </button>
            <small className="modal-foot [display:block] [text-align:center] [color:#929ba7] [font-size:9px] [margin-top:12px]">
              Your information stays private and is only shared with this
              employer.
            </small>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      
    </>
  );
}
