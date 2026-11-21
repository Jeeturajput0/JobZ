"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatedHeading } from "./animations/AnimatedHeading";
import { ArrowRight, Building2, Check, Shield, Users } from "lucide-react";
import { HowJobZWorks } from "@/components/home/HomeSections";

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
        : result.user?.dashboard ||
          (result.user?.role === "jobSeeker"
            ? "/profile"
            : `/${result.user?.role}/dashboard`);
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
            â† Back to JobZ
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
                Iâ€™m here as
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
                ? "Creating accountâ€¦"
                : "Signing inâ€¦"
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
            {adminLogin ? (
              "Administrator accounts are provisioned by the platform owner."
            ) : (
              <>
                {adminSignup ? "Already have an admin account?" : signup ? "Already have an account?" : "New to JobZ?"}{" "}
                <Link href={adminSignup ? "/admin/login" : signup ? "/login" : "/register"}>
                  {adminSignup ? "Admin sign in" : signup ? "Sign in" : "Create an account"}
                </Link>
              </>
            )}
          </p>
        </form>
      </section>
    </main>
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
        <HowJobZWorks />
        <section className="about-values [max-width:1050px] [margin:0_auto] [padding:42px_30px_80px] [display:grid] [grid-template-columns:1fr_1fr] [gap:55px] [&>div]:[border-top:1px_solid_#e9edf2] [&>div]:[padding-top:18px] [&_span]:[font-size:14px] [&_span]:[letter-spacing:1.3px] [&_span]:[color:#328A66] [&_span]:[font-weight:600] [&_h2]:[font-size:clamp(28px,_3vw,_38px)] [&_h2]:[line-height:1.25] [&_h2]:[color:#2c405e] [&_h2]:[letter-spacing:-0.025em] [&_p]:[font-size:16px] [&_p]:[color:#8490a0] [&_p]:[line-height:1.65] max-[700px]:[grid-template-columns:1fr] max-[700px]:[gap:20px] max-[700px]:[padding:25px_22px_48px] [&_span]:[line-height:1.45] max-[700px]:[&_h2]:[font-size:clamp(28px,_3vw,_38px)]">
          <div>
            <span>OUR MISSION</span>
            <AnimatedHeading as="h2">
              Make meaningful work easier to find.
            </AnimatedHeading>
            <p className="text-sm leading-6 text-[#71817A]">
              We help people discover opportunities where their skills, values,
              and ambitions can thriveâ€”and help good teams meet the people who
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
            <AnimatedHeading as="h2">Letâ€™s find whatâ€™s next.</AnimatedHeading>
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
