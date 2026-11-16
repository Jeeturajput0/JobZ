import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: { default: "Find work that fits | JobZ", template: "%s | JobZ" },
  description: "Discover meaningful jobs, explore company profiles, and find your next opportunity with JobZ.",
  openGraph: {
    type: "website",
    siteName: "JobZ",
    title: "Find work that fits | JobZ",
    description: "Discover meaningful jobs and find your next opportunity with JobZ.",
  },
};

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><Navbar />{children}<Footer /></>;
}
