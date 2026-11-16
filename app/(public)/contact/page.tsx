import type { Metadata } from "next";
import { ContactPage } from "@/components/contact-page";
export const metadata: Metadata = {
  title: "Contact JobZ",
  description: "Contact the JobZ team about your account, job search, or employer workspace.",
  alternates: { canonical: "/contact" },
};
export default function Page() {
  return <ContactPage />;
}
