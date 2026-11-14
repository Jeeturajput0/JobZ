import Link from "next/link";
import { AnimatedHeading } from "@/components/animations/AnimatedHeading";

export default function Page() {
  return <main className="auth-form-wrap"><section className="auth-form"><Link className="back-link" href="/login">← Back to sign in</Link><div className="kicker">ACCOUNT ACCESS</div><AnimatedHeading as="h2">Password recovery is unavailable</AnimatedHeading><p>Password reset has not been configured for this JobZ deployment. Contact your site administrator for help accessing your account.</p><Link href="/login" className="btn btn-primary btn-wide">Return to sign in</Link></section></main>;
}
