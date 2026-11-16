"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedHeading } from "./animations/AnimatedHeading";
import { DashboardOverview } from "./dashboard-overview";
import {
  ProfileSettings,
  ResumePanel,
  NotificationsPanel,
  SettingsPanel,
} from "./account-panels";
import { CategoryManager } from "./category-manager";
import { EmployerJobsPanel, EmployerApplicantsPanel } from "./employer-panels";
import { PostJobForm } from "./post-job-form";
import {
  AdminPeoplePanel,
  AdminApplicationsPanel,
  AdminContactMessagesPanel,
} from "./admin-people-panel";
import { reveal, stagger, subtleReveal } from "@/lib/motion";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useJobZ } from "./provider";
import { JobCard } from "./site";
import type { Job } from "@/data/jobs";
import { AdminJobsManager } from "@/components/admin-jobs";

const links: Record<string, [string, string][]> = {
  seeker: [
    ["Overview", "dashboard"],
    ["Find jobs", "find-jobs"],
    ["My applications", "applications"],
    ["Saved jobs", "saved-jobs"],
    ["My profile", "profile"],
    ["Resume", "resume"],
    ["Notifications", "notifications"],
    ["Settings", "settings"],
  ],
  employer: [
    ["Overview", "dashboard"],
    ["Post a job", "post-job"],
    ["Manage jobs", "manage-jobs"],
    ["Applicants", "applicants"],
    ["Company profile", "company-profile"],
    ["Analytics", "analytics"],
    ["Notifications", "notifications"],
    ["Settings", "settings"],
  ],
  admin: [
    ["Overview", "dashboard"],
    ["Job seekers", "job-seekers"],
    ["Employers", "employers"],
    ["Manage jobs", "jobs"],
    ["Applications", "applications"],
    ["Contact messages", "contact-messages"],
    ["Categories", "categories"],
    ["Companies", "companies"],
    ["Featured jobs", "featured-jobs"],
    ["Reports & analytics", "analytics"],
    ["Settings", "settings"],
  ],
};
const icons = [
  LayoutDashboard,
  Search,
  ClipboardList,
  BriefcaseBusiness,
  Users,
  FileText,
  Bell,
  Settings,
  Building2,
  Activity,
  Shield,
];

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]">
      <BriefcaseBusiness />
      <h3 className="text-lg font-semibold text-[#172B25]">{title}</h3>
      <p className="text-sm leading-6 text-[#71817A]">{body}</p>
      <Link
        href="/jobs"
        className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)]"
      >
        Browse jobs <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function Table({
  title,
  headers,
  rows,
  tabs,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  tabs?: string[];
}) {
  const [activeTab, setActiveTab] = useState("All");
  const filtered =
    activeTab === "All" || !tabs
      ? rows
      : rows.filter(
          (row) =>
            String(row[headers.indexOf("Status")] || "").toLowerCase() ===
            activeTab.toLowerCase(),
        );
  return (
    <div className="panel [background:#fff] [border:1px_solid_#eaedf1] [border-radius:.75rem] [border-color:#E5ECE8] [box-shadow:0_1px_2px_rgb(24_45_77_/_3%)] table-panel [padding:17px] [margin-top:13px] max-[700px]:[padding:13px] [border-color:#E5ECE8] [border-radius:.75rem] [background:#fff] [box-shadow:0_1px_2px_rgb(24_45_77_/_3%)] [background-color:#fff] [&_a]:[color:#328A66]">
      <div className="panel-head [&_select]:[width:112px] [&_select]:[padding:7px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [display:flex] [justify-content:space-between] [align-items:center] [&>div]:[display:grid] [&>div]:[gap:5px] [&_b]:[font-size:21px] [&_b]:[color:#354761] [&_small]:[font-size:14px] [&_small]:[color:#929daa] [.table-panel>_&]:[margin-bottom:17px] [&_b]:[line-height:1.35] [&_small]:[line-height:1.5]">
        <div>
          <b>{title}</b>
          <small>{rows.length} records</small>
        </div>
      </div>
      {tabs && (
        <div className="table-tabs [display:flex] [gap:17px] [border-bottom:1px_solid_#edf0f3] [margin-bottom:7px] [overflow-x:auto] [&_button]:[border:0] [&_button]:[background:none] [&_button]:[padding:9px_0] [&_button]:[color:#8994a2] [&_button]:[font-size:15px] [&_button]:[white-space:nowrap] [&_button]:[line-height:1.5] max-[700px]:[&_button]:[transition:color_180ms_ease-out,_border-color_180ms_ease-out]">
          {tabs.map((tab) => (
            <button
              className={
                activeTab === tab
                  ? "on [.table-tabs_&]:[color:#267653] [.table-tabs_&]:[border-bottom:2px_solid_#6278d2] [.table-tabs_&]:[font-weight:700] [.table-tabs_&]:[border-color:#3FA47B]"
                  : ""
              }
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      {filtered.length ? (
        <div className="scroll-table [overflow:auto]">
          <div className="data-row [display:grid] [grid-template-columns:repeat(auto-fit,minmax(100px,1fr))] [gap:10px] [align-items:center] [padding:13px_8px] [border-bottom:1px_solid_#f0f2f5] [color:#657286] [font-size:.875rem] [min-width:580px] max-[700px]:[min-width:610px] [line-height:1.5] [&_a]:[color:#328A66] data-head [font-size:.75rem] [letter-spacing:.6px] [color:#99a2ae] [line-height:1.5]">
            {headers.map((header) => (
              <span key={header}>{header}</span>
            ))}
          </div>
          {filtered.map((row, index) => (
            <div
              className="data-row [display:grid] [grid-template-columns:repeat(auto-fit,minmax(100px,1fr))] [gap:10px] [align-items:center] [padding:13px_8px] [border-bottom:1px_solid_#f0f2f5] [color:#657286] [font-size:.875rem] [min-width:580px] max-[700px]:[min-width:610px] [line-height:1.5] [&_a]:[color:#328A66]"
              key={index}
            >
              {headers.map((header, column) => (
                <span key={header}>{row[column] ?? ""}</span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]">
          <p className="text-sm leading-6 text-[#71817A]">
            {rows.length
              ? "No records match this filter."
              : "No records available yet."}
          </p>
        </div>
      )}
    </div>
  );
}

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
              ? {
                  fullName,
                  email,
                  password,
                  phone,
                  role: adminSignup ? "admin" : role,
                }
              : {
                  email,
                  password,
                  rememberMe,
                  ...(adminLogin ? { expectedRole: "admin" } : {}),
                },
          ),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result.message || "Request failed. Please try again.");
        return;
      }

      if (signup || adminSignup) {
        setFeedback(
          adminSignup
            ? "Admin account created. You can now sign in."
            : "Account created. You can now sign in.",
        );
        return;
      }

      const target = adminLogin
        ? "/admin/dashboard"
        : result.user?.role === "jobSeeker"
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
    <main className="auth-page [min-height:100vh] [display:grid] [grid-template-columns:42%_58%] [background:#F7F9F8] max-[700px]:[grid-template-columns:1fr]">
      <div className="auth-aside [padding:40px_10%] [background:linear-gradient(145deg,#173f34,#267653)] [display:flex] [flex-direction:column] [justify-content:space-between] [position:relative] [overflow:hidden] [&_:after]:[content:''] [&_:after]:[position:absolute] [&_:after]:[width:500px] [&_:after]:[height:500px] [&_:after]:[border-radius:50%] [&_:after]:[border:1px_solid_#dfe5f0] [&_:after]:[right:-270px] [&_:after]:[bottom:-190px] [&_:after]:[box-shadow:0_0_0_45px_#ffffff80,0_0_0_90px_#ffffff45] [&>div]:[position:relative] [&>div]:[z-index:1] [&>div]:[margin-top:-50px] [&_h1]:[font-size:clamp(48px,_6vw,_74px)] [&_h1]:[line-height:1.08] [&_h1]:[letter-spacing:-0.035em] [&_h1]:[color:#213959] [&_p]:[max-width:330px] [&_p]:[color:#7b8799] [&_p]:[line-height:1.65] max-[700px]:[display:none] [&_p]:[font-size:16px] max-[700px]:[&_h1]:[font-size:clamp(48px,_6vw,_74px)] max-[700px]:[&_h1]:[letter-spacing:-0.03em]">
        <Link
          href="/"
          className="brand [display:flex] [align-items:center] [gap:7px] [font-size:23px] [font-weight:700] [letter-spacing:-1.4px] [color:#172B25] [.dash-sidebar_&]:[color:#fff]"
        >
          <span className="brandmark [display:grid] [place-items:center] [width:29px] [height:29px] [border-radius:9px] [background:#3FA47B] [color:#fff] [font-family:inherit] [font-size:23px] [line-height:1] [.dash-brand_&]:[width:27px] [.dash-brand_&]:[height:27px] [.home-brand_&]:[background:#3FA47B] [.home-brand_&]:[color:#fff] [.dash-sidebar_&]:[background:#3FA47B]">
            j
          </span>
          jobz
          <span className="branddot [color:#3FA47B] [margin-left:-7px]">.</span>
        </Link>
        <div>
          <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">
            YOUR NEXT CHAPTER STARTS HERE
          </div>
          <AnimatedHeading as="h1">
            Good work
            <br />
            finds{" "}
            <span className="serif-accent [font-family:inherit] [font-weight:400] [font-style:italic] [color:#328A66] [letter-spacing:-2px] [.home-hero_&]:[color:#328A66] [.home-hero_&]:[font-style:italic] [.home-hero_&]:[letter-spacing:-.06em] [.auth-aside_&]:[color:#8ed0ad]">
              good people.
            </span>
          </AnimatedHeading>
          <p className="text-sm leading-6 text-[#71817A]">
            Find meaningful work, meet thoughtful teams, and make your next move
            with confidence.
          </p>
        </div>
        <div className="auth-proof [font-size:14px] [color:#328A66] [&_span]:[color:#e8ad43] [&_span]:[margin-right:8px] [&_span]:[letter-spacing:2px] [line-height:1.5]">
          <span>
            <Shield size={14} />
          </span>{" "}
          A better way to find work
        </div>
      </div>
      <section className="auth-form-wrap [display:grid] [place-items:center] [padding:40px] max-[700px]:[padding:28px_22px] max-[700px]:[min-height:100vh] max-[420px]:[padding:24px_18px]">
        <form
          className="auth-form [width:min(430px,100%)] [&_h2]:[font-size:var(--type-card-heading)] [&_h2]:[letter-spacing:-.8px] [&_h2]:[color:#243a59] [&_h2]:[margin:0_0_8px] [&>p]:[color:#8792a2] [&>p]:[font-size:16px] [&>p]:[margin:0_0_25px] [&_h2]:[line-height:1.3] [&>p]:[line-height:1.65]"
          onSubmit={handleSubmit}
        >
          <Link
            className="back-link [display:block] [color:#6e7c91] [font-size:14px] [margin:5px_0_24px] [.auth-form>_&]:[margin-bottom:45px] [&_)]:[color:#328A66] max-[700px]:[.auth-form>_&]:[margin-bottom:35px] [line-height:1.5] [&_):hover]:[color:#267653]"
            href="/"
          >
            ← Back to JobZ
          </Link>
          <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">
            {adminSignup || adminLogin
              ? "ADMINISTRATOR ACCESS"
              : signup
                ? "START SOMETHING GOOD"
                : "WELCOME BACK"}
          </div>
          <AnimatedHeading as="h2">
            {adminSignup
              ? "Create admin account"
              : signup
                ? "Create your account"
                : adminLogin
                  ? "Admin sign in"
                  : "Sign in to JobZ"}
          </AnimatedHeading>
          <p className="text-sm leading-6 text-[#71817A]">
            {adminSignup
              ? "Create an administrator account for JobZ."
              : signup
                ? "A little closer to work that feels right."
                : adminLogin
                  ? "Sign in with your JobZ administrator account."
                  : "Pick up right where your next chapter begins."}
          </p>

          {signup && !adminSignup && (
            <>
              <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">
                I’m here as
              </label>
              <div className="role-picker [display:grid] [grid-template-columns:repeat(3,1fr)] [gap:7px] [margin-top:8px] [&_button]:[border:1px_solid_#e5e9ef] [&_button]:[border-radius:7px] [&_button]:[background:white] [&_button]:[padding:11px_8px] [&_button]:[display:flex] [&_button]:[align-items:center] [&_button]:[gap:7px] [&_button]:[position:relative] [&_button]:[color:#67768a] [&_button]:[font-size:15px] [&_button>svg:last-child]:[position:absolute] [&_button>svg:last-child]:[right:6px] [&_button>svg:last-child]:[top:6px] max-[700px]:[grid-template-columns:1fr] max-[700px]:[&_button]:[padding:12px]">
                {(
                  [
                    ["jobSeeker", "Job seeker"],
                    ["employer", "Employer"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      role === value
                        ? "selected [.role-picker_&]:[border-color:#3FA47B] [.role-picker_&]:[background:#EAF5F0] [.role-picker_&]:[color:#267653] [background:#EAF5F0] [border-color:#c9e3d7] [color:#267653]"
                        : ""
                    }
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
              <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">
                Full name
                <input
                  className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]"
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
          {adminSignup && (
            <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">
              Full name
              <input
                className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Your name"
              />
            </label>
          )}

          <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">
            Email address
            <input
              className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </label>
          <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">
            Password
            <input
              className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                signup || adminSignup ? "new-password" : "current-password"
              }
              required
              minLength={signup || adminSignup ? 8 : undefined}
              maxLength={72}
              placeholder={
                signup || adminSignup
                  ? "At least 8 characters"
                  : "Your password"
              }
            />
          </label>
          {signup && !adminSignup && (
            <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">
              Phone number
              <input
                className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                placeholder="(555) 000-0000"
              />
            </label>
          )}
          {!signup && !adminSignup && (
            <div className="form-inline [display:flex] [justify-content:space-between] [font-size:14px] [color:#798598] [margin:13px_0] [&_a]:[color:#328A66] [line-height:1.5] [&_a:hover]:[color:#267653]">
              <label className="grid gap-2 text-sm font-medium text-[#172B25]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] placeholder:text-[#71817A] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20"
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

          <button
            className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)] btn-wide [width:100%]"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? signup || adminSignup
                ? "Creating account…"
                : "Signing in…"
              : signup || adminSignup
                ? "Create account"
                : adminLogin
                  ? "Continue to admin"
                  : "Continue to JobZ"}
            {!submitting && <ArrowRight size={16} />}
          </button>
          <small className="auth-terms [display:block] [color:#919baa] [font-size:14px] [line-height:1.5] [text-align:center] [margin-top:17px]">
            By continuing, you agree to our <a>Terms of Service</a> and{" "}
            <a>Privacy Policy</a>.
          </small>
          <p className="auth-switch [text-align:center!important] [margin:21px_0_0!important] [color:#7e8999!important] [font-size:14px] [line-height:1.5]">
            {adminSignup
              ? "Already have an admin account?"
              : adminLogin
                ? "Need an admin account?"
                : signup
                  ? "Already have an account?"
                  : "New to JobZ?"}{" "}
            <Link
              href={
                adminSignup
                  ? "/admin/login"
                  : adminLogin
                    ? "/admin/register"
                    : signup
                      ? "/login"
                      : "/register"
              }
            >
              {adminSignup
                ? "Admin sign in"
                : adminLogin
                  ? "Register admin"
                  : signup
                    ? "Sign in"
                    : "Create an account"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
export function DashboardPage({
  role,
  section,
}: {
  role: string;
  section: string;
}) {
  const router = useRouter();
  const { jobs, saved, apps } = useJobZ();
  const [user, setUser] = useState<{ role: string; name: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
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
        const accountRole =
          account?.role === "jobSeeker" ? "seeker" : account?.role;

        if (!current) return;
        if (!account || !links[accountRole]) {
          router.replace("/login");
          return;
        }
        if (accountRole !== roleKey) {
          router.replace(
            accountRole === "seeker"
              ? "/job-seeker/dashboard"
              : `/${accountRole}/dashboard`,
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
    return (
      <div className="loading-screen [height:100vh] [display:grid] [place-items:center] [color:#3FA47B]">
        <span className="brandmark [display:grid] [place-items:center] [width:29px] [height:29px] [border-radius:9px] [background:#3FA47B] [color:#fff] [font-family:inherit] [font-size:23px] [line-height:1] [.dash-brand_&]:[width:27px] [.dash-brand_&]:[height:27px] [.home-brand_&]:[background:#3FA47B] [.home-brand_&]:[color:#fff] [.dash-sidebar_&]:[background:#3FA47B]">
          j
        </span>
      </div>
    );
  }

  return (
    <div className="dashboard-shell [min-height:100vh] [background:#F7F9F8] max-[700px]:[padding-bottom:0] motion-reduce:[animation:none]">
      <aside
        className={
          "dash-sidebar [position:fixed] [inset:0_auto_0_0] [width:248px] [background:#173f34] [border-right:1px_solid_#eaedf1] [padding:20px_14px] [display:flex] [flex-direction:column] [z-index:5] max-[900px]:[width:215px] max-[700px]:[transform:translateX(-100%)] max-[700px]:[transition:transform_.2s_ease] max-[700px]:[width:255px] max-[700px]:[box-shadow:10px_0_30px_#172a4118] [color:#fff] [border-color:#245447] " +
          (menu ? "show max-[700px]:[transform:translateX(0)]" : "")
        }
      >
        <Link
          className="brand [display:flex] [align-items:center] [gap:7px] [font-size:23px] [font-weight:700] [letter-spacing:-1.4px] [color:#172B25] [.dash-sidebar_&]:[color:#fff] dash-brand [padding:0_9px_23px] [font-size:21px]"
          href="/"
        >
          <span className="brandmark [display:grid] [place-items:center] [width:29px] [height:29px] [border-radius:9px] [background:#3FA47B] [color:#fff] [font-family:inherit] [font-size:23px] [line-height:1] [.dash-brand_&]:[width:27px] [.dash-brand_&]:[height:27px] [.home-brand_&]:[background:#3FA47B] [.home-brand_&]:[color:#fff] [.dash-sidebar_&]:[background:#3FA47B]">
            j
          </span>
          jobz
          <span className="branddot [color:#3FA47B] [margin-left:-7px]">.</span>
        </Link>
        <div className="workspace-switch [display:flex] [align-items:center] [gap:10px] [padding:11px_9px] [border:1px_solid_#edf0f3] [border-radius:8px] [margin-bottom:25px] [&>span:nth-child(2)]:[display:grid] [&>span:nth-child(2)]:[gap:4px] [&>span:nth-child(2)]:[flex:1] [&_b]:[font-size:14px] [&_small]:[color:#8994a2] [&_small]:[font-size:14px] [&>svg]:[color:#8b96a4] [&_b]:[line-height:1.5] [&_small]:[line-height:1.5] [border-color:rgb(255_255_255_/_12%)] [background:rgb(255_255_255_/_6%)]">
          <span className="workspace-mark [display:grid] [place-items:center] [width:32px] [height:32px] [background:#EAF5F0] [color:#267653] [border-radius:8px] [font-weight:700]">
            {(user.name || "J").slice(0, 1).toUpperCase()}
          </span>
          <span>
            <b>{user.name}</b>
            <small>
              {roleKey === "employer"
                ? "Hiring workspace"
                : roleKey === "admin"
                  ? "Admin workspace"
                  : "Personal workspace"}
            </small>
          </span>
          <ChevronDown size={15} />
        </div>
        <small className="side-label [font-size:14px] [letter-spacing:1.2px] [color:#b5c5c0] [font-weight:600] [padding:0_10px_9px] [line-height:1.45]">
          WORKSPACE
        </small>
        <nav className="side-nav [display:grid] [gap:3px] [&_a]:[display:flex] [&_a]:[align-items:center] [&_a]:[gap:10px] [&_a]:[color:#d4dfdc] [&_a]:[padding:10px] [&_a]:[border-radius:6px] [&_a]:[font-size:16px] [&_a:hover]:[background:rgb(255_255_255_/_8%)] [&_a]:[font-weight:500] [&_a:hover]:[color:#fff]">
          {items.map(([label, path], i) => {
            const Icon = icons[Math.min(i, icons.length - 1)];
            return (
              <Link
                key={path}
                href={`/${role}/${path}`}
                className={
                  active === path
                    ? "active [.side-nav_&]:[background:#3FA47B] [.side-nav_&]:[color:#fff] [.side-nav_&]:[font-weight:600] [.navlinks_&]:[color:#267653] [.table-tabs_&]:[color:#267653] [.table-tabs_&]:[border-color:#3FA47B] [&_svg]:[color:#fff]"
                    : ""
                }
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="side-spacer [flex:1]" />
        <div className="side-help [display:grid] [grid-template-columns:23px_1fr] [column-gap:8px] [padding:12px] [background:rgb(255_255_255_/_6%)] [border-radius:8px] [color:#758397] [font-size:14px] [&_svg]:[grid-row:span_3] [&_svg]:[color:#7483c3] [&_b]:[color:#455670] [&_b]:[font-size:14px] [&_span]:[font-size:14px] [&_span]:[margin-top:4px] [&_a]:[display:flex] [&_a]:[align-items:center] [&_a]:[gap:4px] [&_a]:[color:#fff] [&_a]:[font-weight:600] [&_a]:[font-size:14px] [&_a]:[margin-top:9px] [line-height:1.5] [&_b]:[line-height:1.5] [&_span]:[line-height:1.5] [&_a]:[line-height:1.5] [border-color:rgb(255_255_255_/_12%)] [&_p]:[color:#b5c5c0] [&_h3]:[color:#fff] [&_a]:[background:#3FA47B]">
          <CircleHelp size={18} />
          <b>Need a hand?</b>
          <span>We’re always happy to help.</span>
          <Link href="/contact">
            Visit help center <ArrowRight size={13} />
          </Link>
        </div>
        <button
          className="side-profile [display:flex] [align-items:center] [gap:9px] [background:white] [border:0] [border-top:1px_solid_#edf0f3] [margin-top:13px] [padding:14px_3px_2px] [text-align:left] [&>span:nth-child(2)]:[display:grid] [&>span:nth-child(2)]:[gap:4px] [&>span:nth-child(2)]:[flex:1] [&_b]:[font-size:14px] [&_small]:[font-size:14px] [&_small]:[color:#8490a0] [&>svg]:[color:#8995a5] [&_b]:[line-height:1.5] [&_small]:[line-height:1.5]"
          onClick={handleLogout}
        >
          <span className="avatar [display:grid] [place-items:center] [width:31px] [height:31px] [background:#EAF5F0] [color:#267653] [border-radius:50%] [font-size:11px] [font-weight:700]">
            {(user.name || "J")[0]}
          </span>
          <span>
            <b>{user.name}</b>
            <small>
              {user.role === "admin"
                ? "Administrator"
                : user.role === "employer"
                  ? "Hiring manager"
                  : "Job seeker"}
            </small>
          </span>
          <LogOut size={16} />
        </button>
      </aside>
      <main className="dash-main [margin-left:248px] [min-height:100vh] max-[900px]:[margin-left:215px] max-[700px]:[margin-left:0]">
        <header className="dash-header [height:59px] [background:#fff] [border-bottom:1px_solid_#eaedf1] [display:flex] [align-items:center] [justify-content:space-between] [padding:0_34px] max-[700px]:[padding:0_14px] max-[700px]:[padding-left:18px] max-[700px]:[padding-right:18px] [background-color:#fff] [border-color:#E5ECE8] [color:#172B25]">
          <button
            className="icon-btn [display:grid] [place-items:center] [background:transparent] [border:0] [color:#5c6a7e] [padding:8px] [border-radius:8px] [&_:hover]:[color:#267653] dash-menu-btn [display:none] max-[700px]:[display:grid]"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
          <div className="breadcrumbs [font-size:14px] [color:#8994a3] [&_span]:[margin:0_8px] [&_span]:[color:#bdc4cd] max-[700px]:[margin-right:auto] max-[700px]:[margin-left:8px] [line-height:1.5]">
            Workspace <span>/</span> {pageTitle}
          </div>
          <div className="dash-header-actions [display:flex] [align-items:center] [gap:14px] max-[700px]:[gap:7px]">
            <button className="icon-btn [display:grid] [place-items:center] [background:transparent] [border:0] [color:#5c6a7e] [padding:8px] [border-radius:8px] [&_:hover]:[color:#267653]">
              <Search size={18} />
            </button>
            <button
              className="icon-btn [display:grid] [place-items:center] [background:transparent] [border:0] [color:#5c6a7e] [padding:8px] [border-radius:8px] [&_:hover]:[color:#267653] notification-btn [position:relative] [&_i]:[position:absolute] [&_i]:[width:6px] [&_i]:[height:6px] [&_i]:[border-radius:50%] [&_i]:[background:#ed7e63] [&_i]:[right:7px] [&_i]:[top:7px]"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>
            <span className="avatar [display:grid] [place-items:center] [width:31px] [height:31px] [background:#EAF5F0] [color:#267653] [border-radius:50%] [font-size:11px] [font-weight:700]">
              {(user.name || "J")[0]}
            </span>
          </div>
        </header>
        <div className="dash-content [max-width:1250px] [padding:31px_35px_55px] [margin:auto] max-[900px]:[padding:25px_20px] max-[700px]:[padding:22px_18px] [width:min(100%,_1440px)] [color:#172B25]">
          <div className="dash-welcome [display:flex] [align-items:center] [justify-content:space-between] [margin-bottom:23px] [&_h1]:[font-size:clamp(1.875rem,_3vw,_2.5rem)] [&_h1]:[letter-spacing:-.035em] [&_h1]:[margin:0] [&_h1]:[color:#263b59] [&_h1_span]:[font-size:17px] [&_h1_span]:[color:#dba741] [&_p]:[font-size:16px] [&_p]:[color:#8792a1] [&_p]:[margin:7px_0_0] max-[700px]:[gap:1rem] max-[700px]:[align-items:flex-start] max-[700px]:[&_h1]:[font-size:clamp(32px,_3vw,_44px)] max-[700px]:[&_p]:[font-size:10px] max-[700px]:[&_p]:[max-width:280px] max-[700px]:[&_p]:[line-height:1.5] [&_h1]:[line-height:1.2] [&_p]:[line-height:1.65]">
            <div>
              <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">
                {new Date()
                  .toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                  .toUpperCase()}
              </div>
              <AnimatedHeading key={active} as="h1">
                {active === "dashboard" ? (
                  <>
                    Good morning, {user.name?.split(" ")[0] || "there"}{" "}
                    <span>✦</span>
                  </>
                ) : (
                  pageTitle
                )}
              </AnimatedHeading>
              <p className="text-sm leading-6 text-[#71817A]">
                {active === "dashboard"
                  ? roleKey === "employer"
                    ? "Here’s what’s happening with your hiring today."
                    : roleKey === "admin"
                      ? "Here’s an overview of what’s happening across JobZ."
                      : "A little progress adds up. Here’s your job search at a glance."
                  : `Manage your ${pageTitle.toLowerCase()} and keep your next steps moving.`}
              </p>
            </div>
            {roleKey === "employer" && (
              <Link
                href="/employer/post-job"
                className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)]"
              >
                <Plus size={17} /> Post a job
              </Link>
            )}
          </div>
          {active === "dashboard" ? (
            <DashboardOverview roleKey={roleKey} />
          ) : active === "find-jobs" ? (
            <>
              <div className="dash-search [display:flex] [align-items:center] [gap:11px] [border:1px_solid_#e8ecf1] [background:#fff] [padding:7px_12px] [border-radius:8px] [margin-bottom:17px] [color:#8995a5] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[flex:1] [&_input]:[font-size:14px]">
                <Search />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by role, skill, or company"
                  className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] placeholder:text-[#71817A] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20"
                />
                <Link
                  href="/jobs"
                  className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)] btn-sm [padding:8px_13px] [font-size:.75rem] [min-height:38px]"
                >
                  Browse jobs <ArrowRight size={15} />
                </Link>
              </div>
              <div className="dash-job-grid [display:grid] [grid-template-columns:repeat(2,1fr)] [gap:12px] max-[700px]:[grid-template-columns:1fr]">
                {jobs
                  .filter(
                    (j) =>
                      !search ||
                      j.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .slice(0, 6)
                  .map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
              </div>
            </>
          ) : active === "saved-jobs" ? (
            <>
              <div className="dash-job-grid [display:grid] [grid-template-columns:repeat(2,1fr)] [gap:12px] max-[700px]:[grid-template-columns:1fr]">
                {jobs
                  .filter((j) => saved.includes(j.id))
                  .map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
              </div>
              {!saved.length && (
                <Empty
                  title="Your saved roles will live here"
                  body="Save a role that catches your eye and come back whenever you’re ready."
                />
              )}
            </>
          ) : active === "jobs" && roleKey === "admin" ? (
            <AdminJobsManager />
          ) : active === "applications" && roleKey === "admin" ? (
            <AdminApplicationsPanel />
          ) : active === "applications" ? (
            <Table
              title="Your applications"
              headers={["Role", "Company", "Applied", "Status"]}
              rows={apps.map((a) => [a.jobTitle, a.company, a.date, a.status])}
              tabs={[
                "All",
                "Pending",
                "Reviewed",
                "Shortlisted",
                "Interview",
                "Rejected",
              ]}
            />
          ) : active === "post-job" ? (
            <PostJobForm />
          ) : active === "manage-jobs" ? (
            <EmployerJobsPanel />
          ) : active === "applicants" ? (
            <EmployerApplicantsPanel />
          ) : active === "profile" || active === "company-profile" ? (
            <ProfileSettings roleKey={roleKey} />
          ) : active === "analytics" ? (
            <DashboardOverview roleKey={roleKey} />
          ) : active === "resume" ? (
            <ResumePanel />
          ) : active === "notifications" ? (
            <NotificationsPanel />
          ) : active === "categories" ? (
            <CategoryManager />
          ) : active === "contact-messages" && roleKey === "admin" ? (
            <AdminContactMessagesPanel />
          ) : active === "settings" ? (
            <SettingsPanel />
          ) : active === "job-seekers" && roleKey === "admin" ? (
            <AdminPeoplePanel role="jobSeeker" />
          ) : active === "employers" && roleKey === "admin" ? (
            <AdminPeoplePanel role="employer" />
          ) : (
            <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]">
              <h3 className="text-lg font-semibold text-[#172B25]">
                No records available
              </h3>
              <p className="text-sm leading-6 text-[#71817A]">
                Records will appear here when they are available in your
                account.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function AboutPage() {
  return (
    <>
      
      <main>
        <section className="about-hero [max-width:1160px] [margin:auto] [padding:100px_30px_82px] [&_h1]:[font-size:clamp(48px,_6vw,_74px)] [&_h1]:[letter-spacing:-0.035em] [&_h1]:[line-height:1.08] [&_h1]:[color:#203858] [&_h1]:[margin:20px_0] [&_p]:[max-width:540px] [&_p]:[color:#7f8c9e] [&_p]:[font-size:16px] [&_p]:[line-height:1.65] max-[700px]:[padding:68px_22px_48px] max-[700px]:[&_h1]:[font-size:clamp(48px,_6vw,_74px)] max-[700px]:[&_h1]:[letter-spacing:-0.03em]">
          <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">
            A BETTER WAY TO FIND YOUR FIT
          </div>
          <AnimatedHeading as="h1">
            Work should feel like
            <br />
            <span className="serif-accent [font-family:inherit] [font-weight:400] [font-style:italic] [color:#328A66] [letter-spacing:-2px] [.home-hero_&]:[color:#328A66] [.home-hero_&]:[font-style:italic] [.home-hero_&]:[letter-spacing:-.06em] [.auth-aside_&]:[color:#8ed0ad]">
              a good next chapter.
            </span>
          </AnimatedHeading>
          <p className="text-sm leading-6 text-[#71817A]">
            JobZ brings good people and thoughtful teams a little closer.
            Because the right work can change everything.
          </p>
        </section>
        <section className="about-values [max-width:1050px] [margin:0_auto] [padding:42px_30px_80px] [display:grid] [grid-template-columns:1fr_1fr] [gap:55px] [&>div]:[border-top:1px_solid_#e9edf2] [&>div]:[padding-top:18px] [&_span]:[font-size:14px] [&_span]:[letter-spacing:1.3px] [&_span]:[color:#328A66] [&_span]:[font-weight:600] [&_h2]:[font-size:clamp(28px,_3vw,_38px)] [&_h2]:[line-height:1.25] [&_h2]:[color:#2c405e] [&_h2]:[letter-spacing:-0.025em] [&_p]:[font-size:16px] [&_p]:[color:#8490a0] [&_p]:[line-height:1.65] max-[700px]:[grid-template-columns:1fr] max-[700px]:[gap:20px] max-[700px]:[padding:25px_22px_48px] [&_span]:[line-height:1.45] max-[700px]:[&_h2]:[font-size:clamp(28px,_3vw,_38px)]">
          <div>
            <span>OUR MISSION</span>
            <AnimatedHeading as="h2">
              Make meaningful work easier to find.
            </AnimatedHeading>
            <p className="text-sm leading-6 text-[#71817A]">
              We help people discover opportunities where their skills, values,
              and ambitions can thrive—and help good teams meet the people who
              will move them forward.
            </p>
          </div>
          <div>
            <span>OUR VISION</span>
            <AnimatedHeading as="h2">
              A working world where everyone can find their place.
            </AnimatedHeading>
            <p className="text-sm leading-6 text-[#71817A]">
              More transparency. Less noise. Better matches that create stronger
              teams and more fulfilling careers.
            </p>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 sm:px-8 md:grid-cols-3 md:pb-20">
          <article className="rounded-2xl border border-[#E5ECE8] bg-white p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#328A66]">Our story</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#172B25]">A more considered job search</h2>
            <p className="mt-3 text-sm leading-6 text-[#71817A]">JobZ is built around the details that help people make informed career decisions: clear role information, searchable skills, and company profiles.</p>
          </article>
          <article className="rounded-2xl border border-[#E5ECE8] bg-white p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#328A66]">Why JobZ exists</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#172B25]">Less noise, more useful context</h2>
            <p className="mt-3 text-sm leading-6 text-[#71817A]">A role is more than a title. JobZ brings location, work style, compensation, skills, and responsibilities together so candidates can compare opportunities with context.</p>
          </article>
          <article className="rounded-2xl border border-[#E5ECE8] bg-white p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#328A66]">What you can do here</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#172B25]">Explore at your own pace</h2>
            <p className="mt-3 text-sm leading-6 text-[#71817A]">Search current openings, learn about employers, save roles, and apply when the opportunity matches what you are looking for.</p>
          </article>
        </section>        <div className="bottom-cta [&_h2]:[margin:0] [&_h2]:[color:#172B25] [&_h2]:[font-size:clamp(1.75rem,_2.6vw,_2rem)] [&_h2]:[letter-spacing:-.035em] [&_h2]:[line-height:1.2] [margin:72px_auto] [max-width:1120px] [border-radius:15px] [background:linear-gradient(115deg,#173f34,#267653)] [padding:41px_50px] [color:white] [display:flex] [align-items:center] [justify-content:space-between] [position:relative] [overflow:hidden] [&_:after]:[content:''] [&_:after]:[position:absolute] [&_:after]:[width:280px] [&_:after]:[height:280px] [&_:after]:[border:1px_solid_#ffffff17] [&_:after]:[border-radius:50%] [&_:after]:[right:220px] [&_:after]:[top:-155px] [&_:after]:[box-shadow:0_0_0_35px_#ffffff08,0_0_0_70px_#ffffff06] [&_p]:[color:#c6d0e1] [&_p]:[font-size:14px] [&_p]:[margin:7px_0_0] max-[900px]:[margin-left:25px] max-[900px]:[margin-right:25px] max-[700px]:[display:block] max-[700px]:[margin:2rem_20px] max-[700px]:[padding:28px_24px] max-[700px]:[&_h2]:[font-size:22px] [&_p]:[line-height:1.5] max-[600px]:[flex-wrap:wrap] max-[600px]:[gap:12px] max-[600px]:[padding:30px_23px]">
          <div>
            <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">
              GOOD WORK IS OUT THERE
            </div>
            <AnimatedHeading as="h2">Let’s find what’s next.</AnimatedHeading>
            <p className="text-sm leading-6 text-[#71817A]">
              Your next chapter starts with one small step.
            </p>
          </div>
          <Link
            href="/register"
            className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-white [background:white] [color:#267653] [&_:hover]:[background:#eff3fb]"
          >
            Join JobZ <ArrowRight size={16} />
          </Link>
        </div>
      </main>
      
    </>
  );
}
